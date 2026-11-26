// The workspace directory and the assistant must use the same visibility rules.
function visibleTo(item, user) {
  if (item.roles && !item.roles.includes(user.role_id)) return false;
  if (!item.staffOnly && item.scope !== 'staff') return true;
  return item.slug === 'audit-log' ? user.role_id === 1 : [1, 3, 4].includes(user.role_id);
}

module.exports = { visibleTo };
