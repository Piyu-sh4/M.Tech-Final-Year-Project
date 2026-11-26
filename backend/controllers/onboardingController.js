const db = require('../config/db');
const q = (sql,p)=>new Promise((r,j)=>db.query(sql,p||[],(e,res)=>e?j(e):r(res)));

exports.getMyChecklist = async (req,res)=>{
  try {
    const uid=req.user.user_id;
    // Auto-create progress rows from default template if not exist
    const [tmpl]=await q('SELECT template_id FROM onboarding_templates WHERE is_default=1 LIMIT 1');
    if(tmpl){
      const tasks=await q('SELECT task_id FROM onboarding_tasks WHERE template_id=?',[tmpl.template_id]);
      for(const t of tasks){
        await q('INSERT IGNORE INTO onboarding_progress (user_id,task_id) VALUES (?,?)',[uid,t.task_id]).catch(()=>{});
      }
    }
    const rows=await q(`SELECT op.*,ot.title,ot.description,ot.category,ot.due_day,ot.assigned_to,ot.is_mandatory,ot.sort_order
      FROM onboarding_progress op JOIN onboarding_tasks ot ON ot.task_id=op.task_id
      WHERE op.user_id=? ORDER BY ot.sort_order`,[uid]);
    const total=rows.length;
    const done=rows.filter(r=>r.status==='completed').length;
    res.json({tasks:rows,total,completed:done,progress_pct:total?Math.round(done/total*100):0});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.updateTask = async (req,res)=>{
  try {
    const {status,notes}=req.body;
    const completed_at=(status==='completed')?new Date():null;
    await q('UPDATE onboarding_progress SET status=?,notes=?,completed_at=? WHERE task_id=? AND user_id=?',
      [status,notes||null,completed_at,req.params.taskId,req.user.user_id]);
    res.json({message:'Task updated'});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getTeamOnboarding = async (req,res)=>{
  try {
    const rows=await q(`SELECT u.user_id,u.full_name,u.email,u.created_at,
      COUNT(op.progress_id) AS total_tasks, SUM(op.status='completed') AS done
      FROM users u LEFT JOIN onboarding_progress op ON op.user_id=u.user_id
      WHERE u.status='active' AND u.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY u.user_id ORDER BY u.created_at DESC`);
    res.json(rows.map(r=>({...r,pct:r.total_tasks?Math.round(r.done/r.total_tasks*100):0})));
  } catch(e){res.status(500).json({message:e.message});}
};
