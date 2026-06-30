/* =============================================
   NARRATIVA TEXTIL — cotizador.js
   ============================================= */
(() => {
  'use strict';

  /* ----------------------------------------
     THEME
  ---------------------------------------- */
  const html      = document.documentElement;
  const themeBtn  = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const saved     = localStorage.getItem('nt-theme');
  if (saved) {
    html.dataset.theme    = saved;
    themeIcon.textContent = saved === 'dark' ? 'light_mode' : 'dark_mode';
  }
  themeBtn?.addEventListener('click', () => {
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme    = isDark ? 'light' : 'dark';
    themeIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
    localStorage.setItem('nt-theme', html.dataset.theme);
  });

  /* ----------------------------------------
     NAVBAR — burger
  ---------------------------------------- */
  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobileMenu');
  burger?.addEventListener('click', () => {
    const open = mobile.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    mobile.setAttribute('aria-hidden', String(!open));
  });
  mobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobile.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  }));

  /* ----------------------------------------
     FADE-UP OBSERVER
  ---------------------------------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      setTimeout(() => e.target.classList.add('visible'), +(e.target.dataset.delay || 0));
      io.unobserve(e.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

  /* ----------------------------------------
     "OTRO" TOGGLE
  ---------------------------------------- */
  const otroRadio = document.getElementById('tipo-otro');
  const otroWrap  = document.getElementById('otroWrap');
  document.querySelectorAll('input[name="tipo"]').forEach(r =>
    r.addEventListener('change', () => {
      otroWrap.classList.toggle('visible', otroRadio.checked);
      syncAll();
    })
  );

  /* ----------------------------------------
     LABELS MAP
  ---------------------------------------- */
  const labels = {
    tipo:     { polo:'Polo', sudadera:'Sudadera', otro:'Otro' },
    cantidad: { '1-10':'1–10 piezas','11-50':'11–50 piezas','51-100':'51–100 piezas','100+':'+100 piezas' },
    person:   { dtf:'DTF', sublimado:'Sublimado', bordado:'Bordado', sin:'Sin personalizar' },
    urgencia: { normal:'Normal', express:'Express (+20%)' },
    area:     { carta:'Carta ~21×28 cm', media:'Media carta ~14×21 cm', cuarto:'¼ carta ~10×14 cm' },
  };

  function getVal(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value ?? null;
  }

  /* ----------------------------------------
     SYNC — summary sidebar + sticky bar
  ---------------------------------------- */
  function syncAll() {
    const tipoVal = getVal('tipo');
    const cantVal = getVal('cantidad');
    const persVal = getVal('person');
    const urgVal  = getVal('urgencia');
    const areaVal = getVal('area');

    // Sidebar rows
    const set = (id, val, map) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = val ? (map[val] || val) : '—';
      el.className   = 'summary-row__value' + (val ? '' : ' empty');
    };

    const tipoLabel = tipoVal === 'otro'
      ? (document.getElementById('otroInput')?.value.trim() || 'Otro')
      : (labels.tipo[tipoVal] || null);

    const sumTipo = document.getElementById('sum-tipo');
    if (sumTipo) {
      sumTipo.textContent = tipoLabel || '—';
      sumTipo.className   = 'summary-row__value' + (tipoLabel ? '' : ' empty');
    }
    set('sum-cantidad', cantVal, labels.cantidad);
    set('sum-person',   persVal, labels.person);
    set('sum-urgencia', urgVal,  labels.urgencia);
    set('sum-area',     areaVal, labels.area);

    // Express note
    const note = document.getElementById('expressNote');
    if (note) note.style.display = urgVal === 'express' ? 'block' : 'none';

    // Progress
    const answered = [tipoVal, cantVal, persVal, urgVal, areaVal].filter(Boolean).length;
    const pct      = (answered / 5) * 100;

    document.getElementById('progressFill')?.style.setProperty('width', `${pct}%`);
    document.getElementById('miniFill')?.style.setProperty('width', `${pct}%`);

    // Button enable
    const ready = answered === 5;
    const btnDesktop = document.getElementById('btnSubmit');
    const btnMobile  = document.getElementById('stickySubmit');
    if (btnDesktop) btnDesktop.disabled = !ready;
    if (btnMobile)  btnMobile.disabled  = !ready;

    // Sticky bar label
    const stickyLabel = document.getElementById('stickyLabel');
    const stickySteps = document.getElementById('stickySteps');
    if (stickySteps) stickySteps.textContent = `${answered} / 5 completados`;
    if (stickyLabel) {
      if (ready) {
        stickyLabel.textContent = '¡Listo para enviar!';
      } else {
        const pending = ['tipo','cantidad','person','urgencia','area']
          .filter(n => !getVal(n));
        const nextName = { tipo:'tipo de prenda', cantidad:'cantidad', person:'personalización', urgencia:'urgencia', area:'área' };
        stickyLabel.textContent = `Falta: ${nextName[pending[0]] || ''}`;
      }
    }
  }

  document.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', syncAll));
  document.getElementById('otroInput')?.addEventListener('input', syncAll);
  syncAll();

  /* ----------------------------------------
     SUBMIT — mailto + success overlay
  ---------------------------------------- */
  const overlay  = document.getElementById('successOverlay');
  const closeBtn = document.getElementById('closeSuccess');
  function doSubmit() {
  const tipoVal  = getVal('tipo');
  const otroSpec = document.getElementById('otroInput')?.value.trim() || '';

  const tipoText = tipoVal === 'otro'
    ? `Otro: ${otroSpec || 'sin especificar'}`
    : (labels.tipo[tipoVal] || tipoVal);

  const message = [
    'Hola, me gustaría solicitar una cotización con los siguientes detalles:',
    '',
    `• Tipo de prenda: ${tipoText}`,
    `• Cantidad de piezas: ${labels.cantidad[getVal('cantidad')] || '—'}`,
    `• Personalización: ${labels.person[getVal('person')] || '—'}`,
    `• Urgencia: ${labels.urgencia[getVal('urgencia')] || '—'}`,
    `• Área a personalizar: ${labels.area[getVal('area')] || '—'}`,
    '',
    'Quedo en espera de su respuesta. Gracias.'
  ].join('\n');

  const whatsappNumber = '5212218875017'; // Cambiar por el número real

  const whatsappUrl =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, '_blank');

  setTimeout(() => overlay?.classList.add('visible'), 450);
}
  // Desktop submit
  document.getElementById('cotizadorForm')?.addEventListener('submit', e => {
    e.preventDefault();
    doSubmit();
  });

  // Mobile sticky button
  document.getElementById('stickySubmit')?.addEventListener('click', doSubmit);

  // Close overlay
  closeBtn?.addEventListener('click', () => overlay?.classList.remove('visible'));
  overlay?.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('visible'); });

})();