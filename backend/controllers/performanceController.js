const db = require('../config/db');
const q = (sql,p)=>new Promise((r,j)=>db.query(sql,p||[],(e,res)=>e?j(e):r(res)));

exports.getMyReviews = async (req,res)=>{
  try {
    const rows=await q(`SELECT pr.*,u.full_name AS reviewer_name FROM performance_reviews pr
      LEFT JOIN users u ON u.user_id=pr.reviewer_id
      WHERE pr.user_id=? ORDER BY pr.created_at DESC`,[req.user.user_id]);
    res.json(rows.map(row => ({...row,full_name:req.user.full_name})));
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getTeamReviews = async (req,res)=>{
  try {
    const rows=await q(`SELECT pr.*,u.full_name,u.email,u2.full_name AS reviewer_name
      FROM performance_reviews pr
      JOIN users u ON u.user_id=pr.user_id
      LEFT JOIN users u2 ON u2.user_id=pr.reviewer_id
      WHERE pr.reviewer_id=? OR u.reporting_manager_id=?
      ORDER BY pr.created_at DESC`,[req.user.user_id,req.user.user_id]);
    res.json(rows);
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getAllReviews = async (req,res)=>{
  try {
    const {cycle,status}=req.query;
    let sql=`SELECT pr.*,u.full_name,u.email,u2.full_name AS reviewer_name
      FROM performance_reviews pr JOIN users u ON u.user_id=pr.user_id
      LEFT JOIN users u2 ON u2.user_id=pr.reviewer_id WHERE 1=1`;
    const params=[];
    if(cycle){sql+=' AND pr.review_cycle=?';params.push(cycle);}
    if(status){sql+=' AND pr.status=?';params.push(status);}
    sql+=' ORDER BY pr.created_at DESC';
    res.json(await q(sql,params));
  } catch(e){res.status(500).json({message:e.message});}
};

exports.create = async (req,res)=>{
  try {
    const {user_id,review_cycle,review_type,period_start,period_end,score_quality,score_delivery,score_communication,score_teamwork,score_initiative,score_leadership,strengths,improvements,goals_next,reviewer_notes}=req.body;
    if(!user_id||!review_cycle) return res.status(400).json({message:'user_id and review_cycle required'});
    const scores=[score_quality,score_delivery,score_communication,score_teamwork,score_initiative,score_leadership].map(Number).filter(s=>s>0);
    const overall=scores.length?+(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1):0;
    const rating=overall>=4.5?'exceptional':overall>=3.5?'exceeds':overall>=2.5?'meets':overall>=1.5?'below':'unsatisfactory';
    const r=await q(`INSERT INTO performance_reviews
      (user_id,reviewer_id,review_cycle,review_type,period_start,period_end,score_quality,score_delivery,score_communication,score_teamwork,score_initiative,score_leadership,overall_score,rating,strengths,improvements,goals_next,reviewer_notes,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'submitted')`,[user_id,req.user.user_id,review_cycle,review_type||'manager',period_start||null,period_end||null,score_quality||0,score_delivery||0,score_communication||0,score_teamwork||0,score_initiative||0,score_leadership||0,overall,rating,strengths||null,improvements||null,goals_next||null,reviewer_notes||null]);
    res.json({message:'Review submitted',review_id:r.insertId,overall_score:overall,rating});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.acknowledge = async (req,res)=>{
  try {
    await q('UPDATE performance_reviews SET status=?,acknowledged_at=NOW() WHERE review_id=? AND user_id=?',['acknowledged',req.params.id,req.user.user_id]);
    res.json({message:'Review acknowledged'});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getSummary = async (req,res)=>{
  try {
    const [s]=await q(`SELECT COUNT(*) AS total, AVG(overall_score) AS avg_score,
      SUM(rating='exceptional') AS exceptional, SUM(rating='exceeds') AS exceeds,
      SUM(rating='meets') AS meets, SUM(rating='below') AS below
      FROM performance_reviews WHERE review_cycle=?`,[req.query.cycle||'Q2-2025']);
    res.json(s);
  } catch(e){res.status(500).json({message:e.message});}
};
