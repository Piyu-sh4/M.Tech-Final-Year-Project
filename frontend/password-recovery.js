(() => {
  let token;
  const request = document.getElementById('recovery-request');
  const confirm = document.getElementById('recovery-confirm');
  const instructions = document.getElementById('recovery-instructions');
  const status = document.getElementById('recovery-status');
  function openResetLink() {
    if (!location.hash) return;
    token = location.hash.slice(1);
    history.replaceState(null, '', location.pathname);
    request.hidden = true;
    confirm.hidden = false;
    instructions.textContent = 'Use at least 8 characters, with an uppercase letter and a number.';
  }
  openResetLink();
  window.addEventListener('hashchange', openResetLink);
  [request, confirm].forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    const isConfirm = form === confirm;
    const data = new FormData(form);
    const password = data.get('password');
    if (isConfirm && password !== data.get('confirmation')) {
      status.textContent = 'The passwords do not match.';
      form.elements.confirmation.focus();
      return;
    }
    const button = event.submitter;
    button.disabled = true;
    status.textContent = isConfirm ? 'Updating password…' : 'Requesting a reset link…';
    try {
      const response = await fetch('/api/auth/password-reset/' + (isConfirm ? 'confirm' : 'request'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isConfirm ? { token, password } : { email: data.get('email') }),
        signal: AbortSignal.timeout(12000)
      });
      const body = await response.json();
      status.textContent = body.message || 'The request could not be completed. Try again.';
      if (!response.ok) return;
      form.reset();
      if (isConfirm) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        confirm.hidden = true;
        instructions.hidden = true;
      }
    } catch {
      status.textContent = 'Could not contact Workforce Intelligence. Try again.';
    } finally { button.disabled = false; }
  }));
})();
