/* Small, dependency-free motion direction for both kimono brands. */
(() => {
  const body = document.body;
  const heritage = body.dataset.brand === 'tsumugiya';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const hero = document.querySelector('.hero');
  const title = hero.querySelector('h1');
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const running = new Set();
  let observer;
  let introTimer;
  let frame = 0;

  // Keep the heading's readable name intact while animating visual glyphs.
  title.setAttribute('aria-label', [...title.childNodes].map(n => n.nodeName === 'BR' ? ' ' : n.textContent).join(''));
  let glyphIndex = 0;
  [...title.childNodes].forEach(node => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const fragment = document.createDocumentFragment();
    for (const char of node.textContent) {
      const glyph = document.createElement('span');
      glyph.className = 'motion-glyph';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.style.setProperty('--glyph-index', glyphIndex++);
      glyph.textContent = char;
      fragment.append(glyph);
    }
    node.replaceWith(fragment);
  });

  function animate(element, keyframes, options) {
    if (reduced.matches || !element.animate) return null;
    const animation = element.animate(keyframes, {easing:ease, ...options});
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
    return animation;
  }

  function intro() {
    clearTimeout(introTimer);
    body.classList.remove('intro-playing');
    if (reduced.matches) return;
    // Restart finite entrance animations after an A/B layout change.
    void hero.offsetWidth;
    body.classList.add('intro-playing');
    introTimer = setTimeout(() => body.classList.remove('intro-playing'), 3300);
  }

  const selectors = heritage ? [
    '.announcement', '.section-label', '.story h2', '.story-prose > *',
    '.story-detail', '.collection-copy > *', '.collection-image',
    '.journal-heading > *', '.journal-rows details', '.visit > div > *',
    '.footer-top > *'
  ] : [
    '.hero-caption', '.about > .section-label', '.about h2', '.about-grid > div > *',
    '.about-sign', '.section-top > *', '.look-main', '.look-aside > *',
    '.color-title > *', '.color-chips > div', '.journal-list details',
    '.visit > div > *', '.footer-top', '.footer-logo'
  ];
  const items = [...document.querySelectorAll(selectors.join(','))];
  const media = new Set(document.querySelectorAll('.story-detail, .collection-image, .look-main, .look-detail'));
  items.forEach((element, index) => {
    element.classList.add('motion-item');
    if (media.has(element)) element.classList.add('motion-media');
    element.style.setProperty('--reveal-delay', `${(index % 3) * (heritage ? 70 : 55)}ms`);
  });

  function setupReveal() {
    observer?.disconnect();
    if (reduced.matches || !('IntersectionObserver' in window)) {
      items.forEach(element => { element.dataset.motion = 'visible'; });
      return;
    }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.motion = 'visible';
        observer.unobserve(entry.target);
      });
    }, {threshold:0.08, rootMargin:'0px 0px -24px 0px'});
    items.forEach(element => {
      if (element.dataset.motion === 'visible') return;
      // Items restored above the viewport stay visible on browser back/refresh.
      element.dataset.motion = element.getBoundingClientRect().bottom <= 0 ? 'visible' : 'pending';
      if (element.dataset.motion === 'pending') observer.observe(element);
    });
  }

  function updateScroll() {
    frame = 0;
    const rect = hero.getBoundingClientRect();
    const drift = !reduced.matches && innerWidth > 700 && rect.bottom > 0
      ? Math.min(1, Math.max(0, -rect.top / rect.height)) * (heritage ? 16 : 12) : 0;
    hero.style.setProperty('--hero-drift', `${drift.toFixed(2)}px`);
  }
  function queueScroll() { if (!frame) frame = requestAnimationFrame(updateScroll); }
  window.addEventListener('scroll', queueScroll, {passive:true});
  window.addEventListener('resize', queueScroll, {passive:true});

  // A light, bounded response on pointer devices; touch targets never move.
  document.querySelectorAll('.text-link, .solid-button').forEach(link => {
    const reset = () => { link.style.removeProperty('--pointer-x'); link.style.removeProperty('--pointer-y'); };
    link.addEventListener('pointermove', event => {
      if (reduced.matches || !finePointer.matches) return;
      const rect = link.getBoundingClientRect();
      link.style.setProperty('--pointer-x', `${((event.clientX - rect.left - rect.width / 2) * .025).toFixed(2)}px`);
      link.style.setProperty('--pointer-y', `${((event.clientY - rect.top - rect.height / 2) * .07).toFixed(2)}px`);
    });
    link.addEventListener('pointerleave', reset);
    link.addEventListener('blur', reset);
  });

  // Animate native details while preserving their keyboard and no-JS behavior.
  document.querySelectorAll('details').forEach(details => {
    const summary = details.querySelector('summary');
    let animation;
    let targetOpen = details.open;
    summary.addEventListener('click', event => {
      if (reduced.matches || !details.animate) return;
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      const next = animation ? !targetOpen : !details.open;
      if (animation) { animation.cancel(); animation = null; }
      targetOpen = next;
      details.style.overflow = 'hidden';
      details.style.height = '';
      details.open = true;
      const end = next ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
      animation = animate(details, [{height:`${start}px`}, {height:`${end}px`}], {duration:heritage ? 520 : 400});
      const current = animation;
      current.finished.then(() => {
        if (animation !== current) return;
        details.open = targetOpen;
        details.style.removeProperty('height');
        details.style.removeProperty('overflow');
        animation = null;
      }).catch(() => {
        if (animation !== current) return;
        details.open = targetOpen;
        details.style.removeProperty('height');
        details.style.removeProperty('overflow');
        animation = null;
      });
    });
  });

  window.SiteMotion = {
    enterDialog(dialog) {
      animate(dialog, heritage
        ? [{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}]
        : [{opacity:0,transform:'translateY(38px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],
      {duration:heritage ? 650 : 480});
      dialog.querySelectorAll('nav > *, .product-info > *, .visit-dialog > h2').forEach((element,index) => {
        animate(element,[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],
          {duration:500,delay:70+index*45,fill:'backwards'});
      });
    },
    async exitDialog(dialog) {
      const animation = animate(dialog,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(16px)'}],{duration:200});
      if (animation) await animation.finished.catch(() => {});
    },
    confirm(element) {
      animate(element,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:400});
    }
  };

  // Never leave hidden content when preferences change or the page is restored.
  function applyPreference() {
    body.classList.toggle('motion-ready', !reduced.matches);
    if (reduced.matches) {
      running.forEach(animation => animation.cancel());
      clearTimeout(introTimer);
      body.classList.remove('intro-playing');
    }
    setupReveal();
    queueScroll();
  }
  reduced.addEventListener('change', applyPreference);
  document.addEventListener('focusin', event => {
    const element = event.target.closest('[data-motion="pending"]');
    if (element) { element.dataset.motion = 'visible'; observer?.unobserve(element); }
  });
  body.addEventListener('site:layout', () => { intro(); queueScroll(); });
  window.addEventListener('pageshow', event => { if (event.persisted) applyPreference(); });
  applyPreference();
  intro();
})();
