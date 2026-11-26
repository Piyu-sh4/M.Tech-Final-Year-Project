// Confirm the current account before offering its role-specific workspace.
(async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const response = await fetch('/api/auth/me', {headers:{Authorization:'Bearer '+token}});
    if (!response.ok) return;
    const user = await response.json();
    document.getElementById('home-title').textContent = 'Welcome, '+user.full_name;
    const workspace = document.getElementById('open-workspace');
    workspace.textContent = 'Open my dashboard';
    workspace.href = user.role_id === 3 ? '/manager.html' : [1,4].includes(user.role_id) ? '/admin-dashboard.html' : '/employee-dashboard.html';
    document.getElementById('register-link').remove();
  } catch { /* The public workspace links remain available when offline. */ }
})();
