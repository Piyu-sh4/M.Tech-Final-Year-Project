(() => {
  const page = location.pathname.split('/').pop();
  const sidebar = document.querySelector('.wiq-sidebar');
  const content = document.querySelector('.wiq-main');
  const policy = /^(cookie|privacy|security)-policy\.html$/.test(page);
  const make = (tag, text) => Object.assign(document.createElement(tag), { textContent: text });
  const makeButton = (text, className) => Object.assign(make('button', text), { type: 'button', className });
  const narrow = matchMedia('(max-width: 1000px)');

  if (policy) document.body.classList.add('wfi-policy');
  if (sidebar && content) initializeNavigation();
  if (sidebar) window.logout = async () => {
    const token = localStorage.getItem('token');
    if (token) await fetch('/api/auth/logout',{method:'POST',headers:{Authorization:'Bearer ' + token}}).catch(() => {});
    for (const key of ['token','user','user_id','full_name','role_id','email']) localStorage.removeItem(key);
    location.assign('/login.html');
  };
  const overview = document.getElementById('workforce-overview');
  if (overview) {
    content.querySelector('.dashboard .tab-nav').before(overview);
    fetch('/api/modules/data/overview', {headers:{Authorization:'Bearer ' + localStorage.getItem('token')}})
      .then(async response => {
        if (!response.ok) throw new Error('Workforce summary is unavailable. Refresh to try again.');
        return response.json();
      }).then(rows => {
        const grid = overview.querySelector('.wfi-overview-grid');
        for (const row of rows) {
          const link = Object.assign(make('a',''),{href:'/' + row.destination + '.html'});
          link.append(make('strong',Number(row.value).toLocaleString()),make('span',row.metric));
          grid.append(link);
        }
        overview.querySelector('[role="status"]').textContent = 'Current workforce records. Select a card to review.';
      }).catch(error => { overview.querySelector('[role="status"]').textContent = error.message; });
  }

  function initializeNavigation() {
    document.body.classList.add('wfi-workspace');
    content.id ||= 'wfi-main-content';
    content.tabIndex = -1;
    sidebar.id ||= 'wfi-sidebar';
    const skip = Object.assign(make('a', 'Skip to content'), { className: 'wfi-skip', href: '#' + content.id });
    document.body.prepend(skip);

    const navbar = content.querySelector(':scope > .navbar') || content;
    const shortcuts=[...navbar.querySelectorAll(':scope > a[href]')];
    if(shortcuts.length){
      const strip=make('div','');strip.className='wfi-shortcuts';strip.setAttribute('role','navigation');strip.setAttribute('aria-label','Quick links');
      for(const link of shortcuts){link.removeAttribute('style');strip.append(link);}
      navbar.after(strip);
    }
    const open = makeButton('☰ Menu', 'wfi-mobile-menu');
    open.setAttribute('aria-label','☰ Menu');
    open.setAttribute('aria-controls', sidebar.id);
    open.setAttribute('aria-expanded', 'false');
    navbar.prepend(open);
    const close = makeButton('Close menu', 'wfi-drawer-close');
    sidebar.prepend(close);
    const backdrop = makeButton('', 'wfi-drawer-backdrop');
    backdrop.tabIndex = -1;
    backdrop.setAttribute('aria-label', 'Close navigation');
    document.body.append(backdrop);
    const nav = sidebar.querySelector('nav') || sidebar;
    nav.setAttribute('aria-label', 'Workspace');
    const links = [...nav.querySelectorAll('a[href]')];
    const active = links.find(link => new URL(link.href).pathname === location.pathname);
    if (active) active.setAttribute('aria-current', 'page');

    if (!links.some(link => new URL(link.href).pathname === '/modules.html')) {
      const item = Object.assign(make('div', ''), { className: 'wiq-nav-item wfi-nav-first' });
      item.append(Object.assign(make('a', 'Browse modules'), { href: '/modules.html' }));
      nav.prepend(item);
    }

    for (const label of nav.querySelectorAll('.wiq-dropdown-toggle')) {
      const group = label.nextElementSibling;
      if (!group?.id || label.tagName === 'BUTTON') continue;
      label.tabIndex = 0;
      label.setAttribute('role', 'button');
      label.setAttribute('aria-controls', group.id);
      const sync = () => label.setAttribute('aria-expanded', String(getComputedStyle(group).display !== 'none'));
      sync();
      label.addEventListener('click', () => requestAnimationFrame(sync));
      label.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        label.click();
      });
    }

    let expanded = false;
    function setOpen(value, restoreFocus = false) {
      expanded = narrow.matches && value;
      document.body.classList.toggle('wfi-drawer-open', expanded);
      sidebar.inert = narrow.matches && !expanded;
      content.inert = expanded;
      open.setAttribute('aria-expanded', String(expanded));
      if (expanded) close.focus();
      else if (restoreFocus) open.focus();
    }
    open.addEventListener('click', () => setOpen(true));
    close.addEventListener('click', () => setOpen(false, true));
    backdrop.addEventListener('click', () => setOpen(false, true));
    sidebar.addEventListener('click', event => {
      if (event.target.closest('a')) setOpen(false);
    });
    narrow.addEventListener('change', () => setOpen(false));
    document.addEventListener('keydown', event => {
      if (!expanded) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false, true);
      }
      if (event.key === 'Tab') {
        const items = [...sidebar.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')]
          .filter(item => item.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
    setOpen(false);

    const chat = content.querySelector('.chat-layout');
    const context = chat?.querySelector('.chat-sidebar');
    if (chat && context) {
      context.id ||= 'wfi-chat-context';
      const toggle = makeButton('Chat tools', 'wfi-chat-controls');
      toggle.setAttribute('aria-controls', context.id);
      toggle.setAttribute('aria-expanded', 'false');
      chat.prepend(toggle);
      toggle.addEventListener('click', () => {
        const opened = chat.classList.toggle('wfi-context-open');
        toggle.setAttribute('aria-expanded', String(opened));
      });
    }
  }

  if (!sidebar && !policy) return;
  function wrapTable(table) {
    // Match ordinary record cells to their headers so mobile cards retain context.
    const headings = [...(table.tHead?.rows[0]?.cells || [])];
    if (headings.length && table.tHead.rows.length === 1 && headings.every(cell=>cell.colSpan === 1)) {
      table.classList.add('wfi-record-table');
      table.setAttribute('role','table');
      table.tHead.setAttribute('role','rowgroup');
      table.tHead.rows[0].setAttribute('role','row');
      headings.forEach(cell=>cell.setAttribute('role','columnheader'));
      for (const body of table.tBodies) {
        body.setAttribute('role','rowgroup');
        for (const row of body.rows) {
          row.setAttribute('role','row');
          const regular = row.cells.length === headings.length && [...row.cells].every(cell=>cell.colSpan === 1);
          row.classList.toggle('wfi-record-row',regular);
          if (regular) [...row.cells].forEach((cell,index)=>{
            cell.setAttribute('role','cell');
            cell.dataset.columnLabel = headings[index].textContent.trim();
          });
        }
      }
    }

    if (!table.parentElement || table.closest('.wfi-table-scroll')) return;
    const parent = table.parentElement;
    let region = parent;
    if (parent.children.length !== 1 || !/auto|scroll/.test(getComputedStyle(parent).overflowX)) {
      region = document.createElement('div');
      table.before(region);
      region.append(table);
    }
    region.classList.add('wfi-table-scroll');
    const update = () => {
      const scrollable = region.scrollWidth > region.clientWidth + 1;
      if (scrollable) {
        region.tabIndex = 0;
        region.setAttribute('role', 'region');
        region.setAttribute('aria-label', table.caption?.textContent.trim() || 'Scrollable table');
      } else {
        region.removeAttribute('tabindex');
        region.removeAttribute('role');
        region.removeAttribute('aria-label');
      }
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(region);
    resize.observe(table);
  }

  const scope = content || document.body;
  for (const table of scope.querySelectorAll('table')) wrapTable(table);
  new MutationObserver(records => {
    const tables = new Set();
    for (const record of records) {
      const changedTable = record.target.closest?.('table');
      if (changedTable) tables.add(changedTable);
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('table')) tables.add(node);
        for (const table of node.querySelectorAll('table')) tables.add(table);
      }
    }
    for (const table of tables) if (scope.contains(table)) wrapTable(table);
  }).observe(scope, { childList: true, subtree: true });
})();
