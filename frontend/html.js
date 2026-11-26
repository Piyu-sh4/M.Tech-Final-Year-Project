// Escape plain text at HTML rendering boundaries. Keep database values unchanged.
window.wfiText = value => String(value ?? '').replace(/[&<>"']/g,character =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
