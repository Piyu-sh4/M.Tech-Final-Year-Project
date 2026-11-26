const db = require('../config/db');
const q = (sql,p)=>new Promise((r,j)=>db.query(sql,p||[],(e,res)=>e?j(e):r(res)));

exports.getAll = async (req,res)=>{
  try {
    const uid=req.user.user_id, rid=req.user.role_id;
    const rows=await q(`SELECT a.*,u.full_name AS author,
        (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id=a.announcement_id AND ar.user_id=?) AS is_read,
        (SELECT COUNT(*) FROM announcement_reads ar2 WHERE ar2.announcement_id=a.announcement_id) AS read_count
       FROM announcements a LEFT JOIN users u ON u.user_id=a.created_by
       WHERE a.is_active=1 AND (a.expires_at IS NULL OR a.expires_at>NOW())
         AND (a.target_roles='all' OR FIND_IN_SET(?,a.target_roles))
       ORDER BY a.is_pinned DESC, a.created_at DESC`,[uid,rid]);
    res.json(rows);
  } catch(e){res.status(500).json({message:e.message});}
};

exports.getOne = async (req,res)=>{
  try {
    const [row]=await q(`SELECT a.*,u.full_name AS author FROM announcements a
      LEFT JOIN users u ON u.user_id=a.created_by
      WHERE a.announcement_id=? AND a.is_active=1 AND (a.expires_at IS NULL OR a.expires_at>NOW())
        AND (a.target_roles='all' OR FIND_IN_SET(?,a.target_roles))`,[req.params.id,req.user.role_id]);
    if(!row) return res.status(404).json({message:'Not found'});
    res.json(row);
  } catch(e){res.status(500).json({message:e.message});}
};

exports.create = async (req,res)=>{
  try {
    const {title,body,category,target_roles,target_location,is_pinned,expires_at,attachment_url}=req.body;
    if(!title||!body) return res.status(400).json({message:'Title and body required'});
    const r=await q(`INSERT INTO announcements (title,body,category,target_roles,target_location,is_pinned,expires_at,attachment_url,created_by)
      VALUES (?,?,?,?,?,?,?,?,?)`,[title,body,category||'general',target_roles||'all',target_location||'all',is_pinned?1:0,expires_at||null,attachment_url||null,req.user.user_id]);
    res.json({message:'Announcement created',announcement_id:r.insertId});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.update = async (req,res)=>{
  try {
    const {title,body,category,is_pinned,is_active,expires_at}=req.body;
    await q('UPDATE announcements SET title=?,body=?,category=?,is_pinned=?,is_active=?,expires_at=? WHERE announcement_id=?',
      [title,body,category,is_pinned?1:0,is_active??1,expires_at||null,req.params.id]);
    res.json({message:'Updated'});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.markRead = async (req,res)=>{
  try {
    const [announcement] = await q(`SELECT announcement_id FROM announcements WHERE announcement_id=?
      AND is_active=1 AND (expires_at IS NULL OR expires_at>NOW())
      AND (target_roles='all' OR FIND_IN_SET(?,target_roles))`, [req.params.id, req.user.role_id]);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
    await q('INSERT IGNORE INTO announcement_reads (announcement_id,user_id) VALUES (?,?)',[req.params.id,req.user.user_id]);
    res.json({message:'Marked as read'});
  } catch(e){res.status(500).json({message:e.message});}
};

exports.archive = async (req,res)=>{
  try {
    await q('UPDATE announcements SET is_active=0 WHERE announcement_id=?',[req.params.id]);
    res.json({message:'Archived'});
  } catch(e){res.status(500).json({message:e.message});}
};
