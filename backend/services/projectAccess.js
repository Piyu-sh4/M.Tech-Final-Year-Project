// HR and administrators oversee the register. Everyone else sees projects they
// manage, started, or were explicitly added to.
const oversight = user => [1, 4].includes(user.role_id);
const participation = `(p.manager_id=? OR p.created_by=? OR EXISTS (
  SELECT 1 FROM project_members membership
  WHERE membership.project_id=p.project_id AND membership.user_id=?
))`;
const readScope = user => oversight(user)
  ? ['1=1', []]
  : [participation, [user.user_id, user.user_id, user.user_id]];
const writeScope = user => oversight(user)
  ? ['1=1', []]
  : ['(p.manager_id=? OR p.created_by=?)', [user.user_id, user.user_id]];

module.exports = { oversight, participation, readScope, writeScope };
