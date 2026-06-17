/* =============================================
   NARRATIVA TEXTIL — main.js
   ============================================= */
(() => {
  'use strict';

  /* ----------------------------------------
     THEME TOGGLE
  ---------------------------------------- */
  const html      = document.documentElement;
  const themeBtn  = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const saved     = localStorage.getItem('nt-theme');
  if (saved) {
    html.dataset.theme = saved;
    themeIcon.textContent = saved === 'dark' ? 'light_mode' : 'dark_mode';
  }
  themeBtn?.addEventListener('click', () => {
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme    = isDark ? 'light' : 'dark';
    themeIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
    localStorage.setItem('nt-theme', html.dataset.theme);
  });

  /* ----------------------------------------
     NAVBAR — scroll state + burger
  ---------------------------------------- */
  const navbar = document.getElementById('navbar');
  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobileMenu');

  const updateNav = () => navbar?.classList.toggle('scrolled', window.scrollY > 50);
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  burger?.addEventListener('click', () => {
    const isOpen = mobile.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(isOpen));
    mobile.setAttribute('aria-hidden', String(!isOpen));
  });
  mobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobile.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  }));

  /* ----------------------------------------
     INTERSECTION OBSERVER — fade-up
  ---------------------------------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = +(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

  /* ----------------------------------------
     PARALLAX — rAF loop (passive, perf-safe)
  ---------------------------------------- */
  const heroBg      = document.getElementById('heroBg');
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  let   scrollY     = 0;
  let   rafId       = 0;
  let   dirty       = false;

  function applyParallax() {
    // Hero background drifts upward as user scrolls
    if (heroBg) {
      heroBg.style.transform = `scale(1.14) translateY(${scrollY * 0.28}px)`;
    }
    // Historia decorative panels
    parallaxEls.forEach(el => {
      const dir    = el.dataset.parallax === 'up' ? -1 : 1;
      const rect   = el.parentElement.getBoundingClientRect();
      const offset = -rect.top * 0.1 * dir;
      el.style.transform = `translateY(${offset}px)`;
    });
    dirty = false;
  }

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    if (!dirty) {
      dirty = true;
      rafId = requestAnimationFrame(applyParallax);
    }
  }, { passive: true });

  /* ----------------------------------------
     HERO SVG — "Narrativa Textil" clip-path
  ---------------------------------------- */
  function buildHeroSVG() {
    const container = document.querySelector('.hero__brand-reveal');
    if (!container) return;

    const W   = window.innerWidth;
    const H   = container.offsetHeight || 220;
    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
    svg.setAttribute('aria-hidden', 'true');

    const defs = document.createElementNS(ns, 'defs');
    const clip = document.createElementNS(ns, 'clipPath');
    clip.setAttribute('id', 'brandClip');

    const fs = Math.min(W * 0.13, 165);

    [['Narrativa', '52%'], ['Textil', '90%']].forEach(([word, y]) => {
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', '50%');
      t.setAttribute('y', y);
      t.setAttribute('dominant-baseline', 'middle');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-family', "'Space Grotesk', sans-serif");
      t.setAttribute('font-weight', '700');
      t.setAttribute('font-size', `${fs}px`);
      t.setAttribute('letter-spacing', '-0.04em');
      t.textContent = word;
      clip.appendChild(t);
    });

    defs.appendChild(clip);
    svg.appendChild(defs);

    const img = document.createElementNS(ns, 'image');
    img.setAttribute('href', 'https://images.pexels.com/photos/27572738/pexels-photo-27572738.jpeg?auto=compress&cs=tinysrgb&w=1920');
    img.setAttribute('x', '0'); img.setAttribute('y', '0');
    img.setAttribute('width', '100%'); img.setAttribute('height', '100%');
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    img.setAttribute('clip-path', 'url(#brandClip)');

    const tint = document.createElementNS(ns, 'rect');
    tint.setAttribute('x', '0'); tint.setAttribute('y', '0');
    tint.setAttribute('width', '100%'); tint.setAttribute('height', '100%');
    tint.setAttribute('fill', 'rgba(90,138,110,0.15)');
    tint.setAttribute('clip-path', 'url(#brandClip)');

    svg.appendChild(img);
    svg.appendChild(tint);
    container.innerHTML = '';
    container.appendChild(svg);

    // Drift the clip text slightly on scroll
    const texts = clip.querySelectorAll('text');
    window.addEventListener('scroll', () => {
      const drift = window.scrollY * 0.07;
      texts.forEach(t => {
        t.style.transform = `translateY(-${drift}px)`;
        t.style.transformOrigin = 'center';
      });
    }, { passive: true });
  }

  (document.fonts?.ready ?? Promise.resolve()).then(buildHeroSVG);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildHeroSVG, 200);
  });

  /* ----------------------------------------
     CAROUSELS
  ---------------------------------------- */
  document.querySelectorAll('.categoria').forEach(cat => {
    const track  = cat.querySelector('.cat-track');
    const slides = [...cat.querySelectorAll('.slide')];
    const dotsC  = cat.querySelector('.cat-dots');
    const prev   = cat.querySelector('.cat-prev');
    const next   = cat.querySelector('.cat-next');
    if (!track || !slides.length) return;

    let current = 0;

    // Build dots
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Slide ${i + 1}`);
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => goTo(i));
      dotsC?.appendChild(b);
    });

    function slidesVisible() {
      const w   = track.parentElement.offsetWidth;
      const gap = 19;
      // Match CSS breakpoints
      if (w >= 1024) return 3;
      if (w >= 640)  return 2;
      return 1;
    }

    function goTo(idx) {
      const vis = slidesVisible();
      const max = Math.max(0, slides.length - vis);
      current   = Math.min(Math.max(idx, 0), max);
      const sw  = slides[0].offsetWidth + 19;
      track.style.transform = `translateX(-${current * sw}px)`;
      dotsC?.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === current));
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current >= max;
    }

    prev?.addEventListener('click', () => goTo(current - 1));
    next?.addEventListener('click', () => goTo(current + 1));

    // Swipe
    let startX = 0;
    track.addEventListener('pointerdown',  e => { startX = e.clientX; track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointerup',    e => {
      const diff = startX - e.clientX;
      if (Math.abs(diff) > 48) goTo(current + (diff > 0 ? 1 : -1));
    });

    goTo(0);
    window.addEventListener('resize', () => goTo(current), { passive: true });
  });

  /* ----------------------------------------
     CONTACT FORM
  ---------------------------------------- */
const contactForm = document.getElementById('contactForm');

if (contactForm) {
contactForm.addEventListener('submit', (e) => {
e.preventDefault();

const nombre = document.getElementById('nombre').value.trim();
const mensaje = document.getElementById('mensaje').value.trim();

const whatsappNumber = '521XXXXXXXXXX'; // Reemplazar con el número real

const text = [
  'Hola, vengo desde el sitio web de Narrativa Textil.',
  '',
  `Mi nombre es: ${nombre}`,
  '',
  'Mi idea o proyecto:',
  mensaje
].join('\n');

window.open(
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,
  '_blank'
);

const btn = contactForm.querySelector('button[type="submit"]');

if (btn) {
  btn.innerHTML =
    '<span class="material-symbols-rounded">check</span> WhatsApp abierto';
  btn.disabled = true;
  btn.style.opacity = '0.7';
}

});
}
})();
