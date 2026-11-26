// Non-HR readers see active policies that apply to their role or department.
const audience = `JOIN users viewer ON viewer.user_id=?
  JOIN roles viewer_role ON viewer_role.role_id=viewer.role_id
  LEFT JOIN departments viewer_department ON viewer_department.dept_id=viewer.department_id`;
const canReadPolicy = `(viewer.role_id IN (1,4) OR
  (p.is_active=1 AND (COALESCE(p.applicable_to,'all')='all' OR
    p.applicable_to=viewer_role.role_name OR p.applicable_to=viewer_department.dept_name)))`;

module.exports = { audience, canReadPolicy };
