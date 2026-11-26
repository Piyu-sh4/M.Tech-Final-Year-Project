const { transaction } = require('./database');

function reject(status, message) {
  throw Object.assign(new Error(message), { status });
}

async function decide(id, actor, decision, reason) {
  return transaction(async run => {
    // The row lock serializes competing approvals, rejections and cancellations.
    const [leave] = await run(`SELECT l.*, DATE_FORMAT(l.from_date,'%Y-%m-%d') first_day,
      DATE_FORMAT(l.to_date,'%Y-%m-%d') last_day, u.reporting_manager_id
      FROM leave_requests l JOIN users u ON u.user_id=l.user_id WHERE l.leave_id=? FOR UPDATE`, [id]);
    if (!leave) reject(404, 'Leave request not found');
    if (decision === 'cancelled') {
      if (actor.user_id !== leave.user_id && actor.role_id !== 1) reject(403, 'Cannot cancel this request');
    } else if (actor.user_id === leave.user_id || (actor.role_id === 3 && actor.user_id !== leave.reporting_manager_id)) {
      reject(403, 'A separate authorized reviewer must decide this request');
    }
    if (leave.status !== 'pending') reject(409, 'This request has already been decided');
    await run('UPDATE leave_requests SET status=?, reviewed_by=?, reviewed_at=NOW(), reject_reason=? WHERE leave_id=?',
      [decision, actor.user_id, reason || null, id]);
    if (decision === 'approved') {
      const day = new Date(leave.first_day);
      while (day <= new Date(leave.last_day)) {
        await run(`INSERT INTO attendance(user_id,work_date,status) VALUES (?,?,'leave')
          ON DUPLICATE KEY UPDATE status='leave'`, [leave.user_id, day.toISOString().slice(0,10)]);
        day.setUTCDate(day.getUTCDate()+1);
      }
    }
    if (!['unpaid','other','half_day'].includes(leave.leave_type)) {
      await run(`UPDATE leave_balances SET pending=GREATEST(0,pending-?), taken=taken+?
        WHERE user_id=? AND year=? AND leave_type=?`, [leave.days, decision === 'approved' ? leave.days : 0,
        leave.user_id, leave.first_day.slice(0,4), leave.leave_type]);
    }
    if (decision !== 'cancelled') {
      await run('INSERT INTO alerts(user_id,alert_message,alert_type) VALUES (?,?,?)',
        [leave.user_id, 'Your '+leave.leave_type+' leave was '+decision+'.', 'leave_'+decision]);
    }
  });
}

module.exports = { decide };
