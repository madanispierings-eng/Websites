(() => {
  const nf = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
  const aed = (n) => 'AED ' + nf.format(Math.round(n));
  const eur = (n) => '€ ' + nf.format(Math.round(n));
  const parseNum = (s) => Number(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;

  /* ---------- menu (phone) ---------- */
  const menuBtn = document.querySelector('.bar__menu');
  const menu = document.getElementById('menu');
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Sluiten' : 'Menu';
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- dialog ---------- */
  const dialog = document.getElementById('gesprek');
  const message = dialog.querySelector('textarea[name="bericht"]');
  document.querySelectorAll('[data-open-dialog]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (typeof dialog.showModal !== 'function') return;
      e.preventDefault();
      if (el.hasAttribute('data-from-calc') && !message.value) message.value = calcSummary();
      dialog.showModal();
    });
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  /* ---------- forms: post to Netlify without leaving the page ---------- */
  document.querySelectorAll('form[data-ajax]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('.form-status');
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      status.textContent = 'Versturen…';
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = form.name === 'marktupdates'
          ? 'Dank je. Je staat op de lijst.'
          : 'Dank je. We nemen binnen één werkdag contact met je op.';
      } catch {
        status.textContent = 'Dat lukte niet. Mail ons gerust op info@astrumuae.com.';
      } finally {
        btn.disabled = false;
      }
    });
  });

  /* ---------- the cost calculator ---------- */
  const calc = document.querySelector('[data-calc]');
  const priceInput = calc.querySelector('[name="price"]');
  const range = calc.querySelector('[name="priceRange"]');
  const ltv = calc.querySelector('[name="ltv"]');
  const rate = calc.querySelector('[name="rate"]');
  const rowsEl = calc.querySelector('[data-rows]');
  const totalEl = calc.querySelector('[data-total]');
  const eurEl = calc.querySelector('[data-eur]');
  const visaEl = calc.querySelector('[data-visa]');
  const loanField = calc.querySelector('.field--loan');
  const descEl = document.querySelector('[data-desc]');
  const tabs = document.querySelectorAll('.tabs [role="tab"]');
  const mailLink = document.querySelector('[data-mail]');
  let mode = 'ready';
  let lastTotal = 0;

  const desc = {
    ready: 'Een woning die al af is. Kies een koopprijs en zie welke kosten er in Dubai bovenop komen.',
    offplan: 'Kopen bij de ontwikkelaar, vóór oplevering. Je betaalt in termijnen; de bijkomende kosten zijn lager.',
    mortgage: 'Een bestaande woning met een hypotheek van een bank in de Emiraten. De bank vraagt eigen kosten.',
  };

  // Gangbare tarieven in Dubai; indicatief.
  function costs(price) {
    const vat = 0.05;
    const list = [['Overdrachtsbelasting DLD', '4% van de koopprijs', price * 0.04]];
    if (mode === 'offplan') {
      list.push(['Registratie bij de ontwikkelaar (Oqood)', 'vast bedrag', 1150]);
      return list;
    }
    list.push(['Administratie DLD en eigendomsakte', 'vast bedrag', 580]);
    list.push(['Trustee-kantoor', 'vast bedrag, incl. btw', (price >= 500000 ? 4000 : 2000) * (1 + vat)]);
    list.push(['Makelaarscourtage', '2% + 5% btw', price * 0.02 * (1 + vat)]);
    if (mode === 'mortgage') {
      const loan = price * Number(ltv.value);
      list.push(['Hypotheekregistratie DLD', '0,25% van de lening', loan * 0.0025 + 290]);
      list.push(['Taxatie door de bank', 'ongeveer', 3000 * (1 + vat)]);
      list.push(['Afsluitkosten bank', 'tot 1% van de lening', loan * 0.01]);
    }
    return list;
  }

  function render() {
    const price = Math.min(Math.max(parseNum(priceInput.value), 0), 1e9);
    const list = costs(price);
    const total = list.reduce((s, r) => s + r[2], 0);
    rowsEl.innerHTML = list.map(([name, note, amount]) =>
      `<tr><th scope="row">${name}<small>${note}</small></th><td>${aed(amount)}</td></tr>`).join('');
    animateNumber(totalEl, lastTotal, total, aed);
    lastTotal = total;
    const r = parseNum(rate.value) || 4.25;
    eurEl.textContent = eur(total / r);
    visaEl.hidden = price < 2000000;
    if (mode === 'mortgage') {
      const own = price - price * Number(ltv.value);
      descEl.textContent = desc.mortgage + ` Eigen inbreng: ${aed(own)} plus de kosten hieronder.`;
    } else {
      descEl.textContent = desc[mode];
    }
    mailLink.href = 'mailto:?subject=' + encodeURIComponent('Kosten kopen in Dubai') +
      '&body=' + encodeURIComponent(calcSummary());
  }

  function calcSummary() {
    const price = parseNum(priceInput.value);
    const label = { ready: 'Bestaande woning', offplan: 'Off-plan', mortgage: 'Met hypotheek' }[mode];
    const lines = costs(price).map(([n, , a]) => `- ${n}: ${aed(a)}`);
    const total = costs(price).reduce((s, r) => s + r[2], 0);
    return `${label}, koopprijs ${aed(price)}\n${lines.join('\n')}\nTotaal bovenop de koopprijs: ${aed(total)}\n\nIndicatief, berekend op astrumuae.com`;
  }

  function animateNumber(el, from, to, fmt) {
    if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(to); return; }
    const o = { v: from };
    gsap.to(o, { v: to, duration: 0.5, ease: 'power2.out', overwrite: true, onUpdate: () => { el.textContent = fmt(o.v); } });
  }

  priceInput.addEventListener('input', () => {
    const v = parseNum(priceInput.value);
    range.value = String(Math.min(Math.max(v, 500000), 10000000));
    render();
  });
  priceInput.addEventListener('blur', () => { priceInput.value = nf.format(parseNum(priceInput.value)); });
  range.addEventListener('input', () => { priceInput.value = nf.format(Number(range.value)); render(); });
  ltv.addEventListener('change', render);
  rate.addEventListener('input', render);

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });
  function selectTab(tab) {
    tabs.forEach((t) => { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
    mode = tab.dataset.mode;
    loanField.hidden = mode !== 'mortgage';
    render();
  }
  tabs.forEach((t, i) => { t.tabIndex = i === 0 ? 0 : -1; });
  render();

  /* ---------- stage: the fixed photograph follows the chapter ---------- */
  const stageImgs = document.querySelectorAll('.stage__img');
  const caption = document.querySelector('.stage__caption');
  const captions = {
    hero: 'Pim en Denise in een sales gallery in Dubai',
    diensten: 'Dubai Marina bij nacht',
    werkwijze: 'Meeuwen boven de Dubai Creek',
  };
  function showStage(key) {
    stageImgs.forEach((img) => {
      const on = img.dataset.stage === key;
      img.classList.toggle('is-active', on);
      if (img.tagName === 'VIDEO') {
        if (on && !matchMedia('(prefers-reduced-motion: reduce)').matches) img.play().catch(() => {});
        else img.pause();
      }
    });
    caption.textContent = captions[key];
  }

  /* ---------- motion ---------- */
  if (!window.gsap || !window.ScrollTrigger) {
    // Without GSAP the page is complete; only the stage needs a fallback.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) showStage(en.target.dataset.chapter); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('[data-chapter]').forEach((s) => io.observe(s));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('[data-chapter]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) showStage(section.dataset.chapter); },
    });
  });

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // signature: the name grows heavy as the first screen leaves
    gsap.fromTo('.wordmark__word', { scale: 1 }, {
      scale: 0.93, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.from('.wordmark__word', { yPercent: 18, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.1 });
    gsap.from('.hero .r', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.35 });
    if (matchMedia('(min-width: 861px)').matches) {
      gsap.from('.stage__frame', { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'expo.inOut' });
    }

    // the photograph drifts slowly
    gsap.utils.toArray('.stage__img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 14, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    // entrances: heading, text, picture, staggered
    gsap.utils.toArray('[data-reveal]').forEach((block) => {
      const items = block.querySelectorAll(':scope .r');
      if (!items.length) return;
      gsap.from(items, {
        y: 28, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.075,
        scrollTrigger: { trigger: block, start: 'top 82%', once: true },
      });
    });
    gsap.from('.contact .r', {
      y: 28, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.contact', start: 'top 80%', once: true },
    });

    // pictures that move with the scroll
    gsap.fromTo('.calc__crop img', { scale: 1.12 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.calc', start: 'top bottom', end: 'center center', scrub: true },
    });
    gsap.fromTo('.faq__square', { y: 60 }, {
      y: -20, ease: 'none',
      scrollTrigger: { trigger: '.faq', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
})();
