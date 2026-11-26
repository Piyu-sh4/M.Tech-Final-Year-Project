(() => {
  function element(tag, text) {
    return Object.assign(document.createElement(tag), { textContent: text });
  }

  function show(title, fields, actions = [], opener = document.activeElement) {
    const dialog = element('dialog', '');
    dialog.className = 'wfi-record-dialog';
    const heading = element('h2', title);
    heading.id = 'wfi-record-dialog-title';
    dialog.setAttribute('aria-labelledby', heading.id);
    const details = element('dl', '');
    for (const [label, value] of fields)
      details.append(element('dt', label), element('dd', value));
    const close = element('button', 'Close');
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    const footer = element('div', '');
    footer.className = 'form-actions';
    footer.append(...actions, close);
    dialog.append(heading, details, footer);
    document.body.append(dialog);
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (opener?.isConnected) opener.focus();
    }, { once:true });
    dialog.showModal();
    return dialog;
  }

  async function download(path, filename, token) {
    const response = await fetch(path, { headers:{ Authorization:'Bearer ' + token } });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || 'Could not download the file.');
    }
    const url = URL.createObjectURL(await response.blob());
    const link = Object.assign(element('a', ''), { href:url, download:filename });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.WorkforceRecords = { show, download };
})();
