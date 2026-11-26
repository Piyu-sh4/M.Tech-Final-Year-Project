const {transaction} = require('./database');

function fail(status, message) { throw Object.assign(new Error(message), {status}); }

exports.review = async (request, response, next) => {
  try {
    const {action, approved_amount, reject_reason, paid_on} = request.body;
    const status = request.body.status ?? ({approve:'approved', reject:'rejected'})[action];
    if (!['approved','rejected','paid'].includes(status)) fail(400, 'Choose an expense decision.');
    await transaction(async run => {
      const [claim] = await run(`SELECT c.*,u.reporting_manager_id FROM expense_claims c
        JOIN users u ON u.user_id=c.user_id WHERE claim_id=? FOR UPDATE`, [request.params.id]);
      if (!claim) fail(404,'Expense claim not found.');
      const actor = request.user;
      if (actor.user_id === claim.user_id || (actor.role_id === 3 && actor.user_id !== claim.reporting_manager_id))
        fail(403,'A separate authorized reviewer must decide this claim.');
      if (status === 'paid' && ![1,4].includes(actor.role_id)) fail(403,'HR or administrator access is required to record payment.');
      if (claim.status !== (status === 'paid' ? 'approved' : 'pending')) fail(409,'This decision is unavailable at the current stage.');
      if (status === 'paid') {
        const batches = await run('SELECT batch_id FROM reimbursement_batch_items WHERE claim_id=?',[claim.claim_id]);
        if (batches.length) fail(409,'Record payment through the assigned batch.');
        await run("UPDATE expense_claims SET status='paid',paid_on=COALESCE(?,CURRENT_DATE) WHERE claim_id=?", [paid_on || null, claim.claim_id]);
      } else {
        const amount = Number(approved_amount ?? claim.amount);
        if (status === 'approved' && (!Number.isFinite(amount) || amount <= 0 || amount > Number(claim.amount))) fail(400,'Approved amount must be positive and within the claim.');
        await run(`UPDATE expense_claims SET status=?, approved_amount=?, reject_reason=?,
          reviewed_by=?, reviewed_at=NOW() WHERE claim_id=?`,
          [status,status === 'approved' ? amount : null,reject_reason || null,actor.user_id,claim.claim_id]);
      }
    });
    response.json({message:'Expense claim '+status});
  } catch (error) { next(error); }
};
