(() => {
  const key = 'wfi-sign-out-feedback';
  const savedReceipt = sessionStorage.getItem(key);
  if (savedReceipt === null) return;
  const panel = document.getElementById('sign-out-panel');
  const form = document.getElementById('sign-out-feedback');
  const status = document.getElementById('sign-out-status');
  const dismiss = document.getElementById('dismiss-sign-out');
  const email = document.getElementById('email');
  panel.hidden = false;
  form.hidden = !savedReceipt;
  panel.querySelector('h2').focus();

  function closeFeedback() {
    sessionStorage.removeItem(key);
    panel.hidden = true;
  }
  dismiss.addEventListener('click', () => {
    closeFeedback();
    email.focus();
  });
  document.getElementById('login-form').addEventListener('submit', closeFeedback);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Sending feedback…';
    try {
      const response = await fetch('/api/auth/sign-out-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt: savedReceipt,
          rating: Number(form.elements.rating.value),
          comment: form.elements.comment.value
        }),
        signal: AbortSignal.timeout(5000)
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          form.hidden = true;
          sessionStorage.removeItem(key);
          dismiss.textContent = 'Continue to sign in';
          dismiss.focus();
        }
        throw new Error(result.message || 'Feedback could not be sent. Try again.');
      }
      sessionStorage.removeItem(key);
      form.hidden = true;
      status.textContent = 'Thank you for your feedback, ' + result.full_name + '. Your suggestions help us improve. Bye and stay blessed! 😊';
      dismiss.textContent = 'Continue to sign in';
      dismiss.focus();
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' ? 'Feedback took too long. Try again or skip.' : error.message;
    } finally {
      submit.disabled = false;
    }
  });
})();
