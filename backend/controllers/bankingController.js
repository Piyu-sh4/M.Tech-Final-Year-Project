/** Employee banking details. Account numbers are encrypted with AES-256-GCM.
 * Read endpoints expose only the last four characters. Retain the private
 * state volume with database backups so encrypted records remain recoverable.
 */
const db = require('../config/db');
function queryDatabase(sql, parameters) {
  return new Promise((r, j) => db.query(sql, parameters || [], (e, res) => e ? j(e) : r(res)));
}

/* ── Get my banking ── */
exports.getMyBanking = async (req, res) => {
  try {
    const [row] = await queryDatabase(`SELECT * FROM employee_banking WHERE user_id=?`, [req.user.user_id]);
    if (!row) return res.json(null);
    // Mask sensitive fields for display
    row.account_number_display = require('../services/bankingEncryption').mask(row);
    row.account_number = undefined; // never send raw
    res.json(row);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Get any user's banking (HR/Admin, masked) ── */
exports.getUserBanking = async (req, res) => {
  try {
    const [row] = await queryDatabase(`SELECT * FROM employee_banking WHERE user_id=?`, [req.params.userId]);
    if (!row) return res.json(null);
    row.account_number_display = require('../services/bankingEncryption').mask(row);
    row.account_number = undefined;
    res.json(row);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Save / update banking details ── */
exports.saveBanking = async (req, res) => {
  try {
    const {
      bank_name, account_number, account_type, ifsc_code, branch_name, account_holder,
      upi_id, pf_account_number, pf_uan, esi_number
    } = req.body;
    if (!bank_name || !account_number || !ifsc_code)
      return res.status(400).json({ message: 'Bank name, account number and IFSC are required' });

    if (typeof account_number !== 'string' || !/^[0-9]{6,34}$/.test(account_number) || typeof ifsc_code !== 'string' || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code)) return res.status(400).json({message:'Enter a 6–34 digit account number and valid uppercase IFSC.'});
    await queryDatabase(
      `INSERT INTO employee_banking
         (user_id, bank_name, account_number, account_last_four, account_type, ifsc_code, branch_name, account_holder,
          upi_id, pf_account_number, pf_uan, esi_number, is_verified)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)
       ON DUPLICATE KEY UPDATE
         bank_name=VALUES(bank_name), account_number=VALUES(account_number),account_last_four=VALUES(account_last_four),
         account_type=VALUES(account_type), ifsc_code=VALUES(ifsc_code),
         branch_name=VALUES(branch_name), account_holder=VALUES(account_holder),
         upi_id=VALUES(upi_id), pf_account_number=VALUES(pf_account_number),
         pf_uan=VALUES(pf_uan), esi_number=VALUES(esi_number), is_verified=0`,
      [req.user.user_id, bank_name, require('../services/bankingEncryption').encrypt(account_number),account_number.slice(-4), account_type || 'salary', ifsc_code,
       branch_name || null, account_holder || null, upi_id || null,
       pf_account_number || null, pf_uan || null, esi_number || null]
    );
    res.json({ message: 'Banking details saved. Pending HR verification.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── HR/Admin verify ── */
exports.verifyBanking = async (req, res) => {
  try {
    await queryDatabase(
      `UPDATE employee_banking SET is_verified=1, verified_by=?, verified_at=NOW() WHERE user_id=?`,
      [req.user.user_id, req.params.userId]
    );
    res.json({ message: 'Banking details verified' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── List all unverified (HR/Admin) ── */
exports.getUnverified = async (req, res) => {
  try {
    const rows = await queryDatabase(
      `SELECT eb.*, u.full_name, u.email
       FROM employee_banking eb JOIN users u ON u.user_id=eb.user_id
       WHERE eb.is_verified=0 ORDER BY eb.updated_at DESC`
    );
    rows.forEach(r => { r.account_number_display = require('../services/bankingEncryption').mask(r); r.account_number = undefined; });
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── IFSC lookup helper ── */
/** Look up public branch data; never substitute a fabricated bank response. */
exports.lookupIFSC=async(request,response)=>{
 const code=String(request.params.ifsc || '').toUpperCase();
 if(!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code))return response.status(400).json({message:'Enter a valid 11-character IFSC.'});
 try{const result=await fetch('https://ifsc.razorpay.com/'+code,{signal:AbortSignal.timeout(8000),redirect:'error'});
 if(result.status===404)return response.status(404).json({message:'This IFSC was not found.'});
 if(!result.ok)throw Error('Provider unavailable');
 const branch=await result.json();if(branch.IFSC!==code || !branch.BANK)throw Error('Unexpected branch response');
 response.json({...branch,NOTE:'Razorpay IFSC directory. Confirm branch details with your bank before payment.'});
 }catch{response.status(502).json({message:'The branch directory is unavailable. Verify the IFSC with your bank.'});}
};
