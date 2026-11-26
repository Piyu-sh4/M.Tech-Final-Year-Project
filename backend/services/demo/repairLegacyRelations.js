const fixtures = require('../../config/legacySeedDepartments.json');
const {query} = require('../database');

module.exports = async function repairLegacyRelations(connection) {
  const run = (sql,values) => query(connection,sql,values);
  // The historical SQL assumed auto-increment IDs after INSERT IGNORE. Resolve
  // these explicit synthetic fixtures by department name instead. Preserve any
  // assignment that has already been changed away from its legacy value.
  let repaired = 0;
  for (const fixture of fixtures) {
    const [department] = await run('SELECT dept_id FROM departments WHERE dept_name=?',[fixture.department]);
    if (!department) throw new Error('Missing legacy fixture department: '+fixture.department);
    if (department.dept_id === fixture.legacyId) continue;
    const result = await run('UPDATE users SET department_id=? WHERE email IN (?) AND department_id=?',
      [department.dept_id,fixture.emails,fixture.legacyId]);
    repaired += result.affectedRows;
  }
  // Two original demo tasks refer to a creator that was absent from the source
  // dump. Retain their content and assignee, with the demo administrator as owner.
  const [admin] = await run("SELECT user_id FROM users WHERE email='admin@wip.com'");
  if (admin) {
    const result = await run(`UPDATE tasks t LEFT JOIN users u ON u.user_id=t.assigned_by
      SET t.assigned_by=? WHERE u.user_id IS NULL AND t.title IN (?)`,
    [admin.user_id,['ML Model Training – Attrition','Data Pipeline Optimization']]);
    repaired += result.affectedRows;
  }
  console.log('[BOOT] Repaired '+repaired+' legacy fixture relationships');
};
