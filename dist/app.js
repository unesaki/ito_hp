(() => {
  const body = document.body;
  const key = `${body.dataset.brand}-layout`;
  const buttons = [...document.querySelectorAll('[data-layout-option]')];
  function setLayout(value) {
    if (!['immersive', 'editorial'].includes(value)) return;
    body.dataset.layout = value;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.layoutOption === value)));
    body.dispatchEvent(new CustomEvent('site:layout'));
  }
  try { setLayout(localStorage.getItem(key)); } catch {}
  buttons.forEach(b => b.addEventListener('click', () => {
    setLayout(b.dataset.layoutOption);
    try { localStorage.setItem(key, b.dataset.layoutOption); } catch {}
  }));
  const review = document.querySelector('.review');
  document.querySelector('.review-close').addEventListener('click', () => { review.hidden = true; });
  document.querySelector('.reopen-review').addEventListener('click', () => { review.hidden = false; window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}); });
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-menu');
  let trigger = null;
  const closing = new WeakSet();
  function openDialog(dialog, source) {
    // Keep the original page trigger when moving from one dialog to another.
    if (!source.closest('dialog')) trigger = source;
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
    dialog.showModal();
    body.style.overflow = 'hidden';
    menuButton.setAttribute('aria-expanded', String(dialog === menu));
    window.SiteMotion?.enterDialog(dialog);
  }
  async function closeDialog(dialog) {
    if (closing.has(dialog)) return;
    closing.add(dialog);
    try {
      await window.SiteMotion?.exitDialog(dialog);
      if (dialog.open) dialog.close();
    } finally { closing.delete(dialog); }
  }
  function resetDialog() {
    if (!document.querySelector('dialog[open]')) {
      body.style.overflow = '';
      menuButton.setAttribute('aria-expanded', 'false');
      if (trigger && !trigger.closest('dialog')) trigger.focus({preventScroll:true});
    }
  }
  menuButton.addEventListener('click', () => openDialog(menu, menuButton));
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => openDialog(document.getElementById(`${b.dataset.open}-dialog`), b)));
  document.querySelectorAll('dialog').forEach(d => {
    d.querySelector('[data-close]').addEventListener('click', () => closeDialog(d));
    d.addEventListener('cancel', event => { event.preventDefault(); closeDialog(d); });
    d.addEventListener('close', resetDialog);
    d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(d); } });
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeDialog(menu)));
  const form = document.querySelector('#visit-dialog form');
  const date = form.querySelector('[name=date]');
  const now = new Date();
  date.min = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const values = new FormData(form);
    form.querySelector('.form-result').textContent = `${values.get('date')} ／ ${values.get('purpose')}。入力内容を確認しました。このデザイン案では送信されず、予約は成立していません。`;
    window.SiteMotion?.confirm(form.querySelector('.form-result'));
  });
})();
