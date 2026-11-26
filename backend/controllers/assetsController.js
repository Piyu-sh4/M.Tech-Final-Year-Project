const db = require('../config/db');
const q = (sql,p)=>new Promise((r,j)=>db.query(sql,p||[],(e,res)=>e?j(e):r(res)));

exports.getAll = async (req,res)=>{
  try {
    const {status,category}=req.query;
    let sql=`SELECT a.*,u.full_name AS assigned_user FROM assets a
      LEFT JOIN asset_assignments aa ON aa.asset_id=a.asset_id AND aa.returned_at IS NULL
      LEFT JOIN users u ON u.user_id=aa.user_id WHERE 1=1`;
    const p=[];
    if(status){sql+=' AND a.status=?';p.push(status);}
    if(category){sql+=' AND a.category=?';p.push(category);}
    sql+=' ORDER BY a.category,a.asset_name';
    res.json(await q(sql,p));
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getMyAssets = async (req,res)=>{
  try {
    const rows=await q(`SELECT a.*,aa.assigned_at,aa.condition_out FROM assets a
      JOIN asset_assignments aa ON aa.asset_id=a.asset_id
      WHERE aa.user_id=? AND aa.returned_at IS NULL ORDER BY aa.assigned_at DESC`,[req.user.user_id]);
    res.json(rows.map(row => ({...row,assigned_user:req.user.full_name})));
  } catch(e){res.status(500).json({message:e.message});}
};

exports.create = async (req,res)=>{
  try {
    const {asset_code,asset_name,category,brand,model,serial_number,purchase_date,purchase_cost,warranty_end,location}=req.body;
    if(!asset_code||!asset_name||!category) return res.status(400).json({message:'Code, name and category required'});
    const r=await q('INSERT INTO assets (asset_code,asset_name,category,brand,model,serial_number,purchase_date,purchase_cost,warranty_end,location) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [asset_code,asset_name,category,brand||null,model||null,serial_number||null,purchase_date||null,purchase_cost||null,warranty_end||null,location||null]);
    res.json({message:'Asset added',asset_id:r.insertId});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.assign = async (req,res)=>{
  try {
    const {user_id,condition_out}=req.body;
    if(!user_id) return res.status(400).json({message:'user_id required'});
    await q('INSERT INTO asset_assignments (asset_id,user_id,assigned_by,condition_out) VALUES (?,?,?,?)',
      [req.params.id,user_id,req.user.user_id,condition_out||'good']);
    await q("UPDATE assets SET status='assigned' WHERE asset_id=?",[req.params.id]);
    res.json({message:'Asset assigned'});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.returnAsset = async (req,res)=>{
  try {
    const {condition_in,notes}=req.body;
    await q('UPDATE asset_assignments SET returned_at=NOW(),condition_in=?,notes=? WHERE asset_id=? AND returned_at IS NULL',
      [condition_in||'good',notes||null,req.params.id]);
    await q("UPDATE assets SET status='available' WHERE asset_id=?",[req.params.id]);
    res.json({message:'Asset returned'});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getStats = async (req,res)=>{
  try {
    const [s]=await q(`SELECT COUNT(*) AS total, SUM(status='available') AS available,
      SUM(status='assigned') AS assigned, SUM(status='maintenance') AS maintenance,
      SUM(purchase_cost) AS total_value FROM assets`);
    res.json(s);
  } catch(e){res.status(500).json({message:e.message});}
};
