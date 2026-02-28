document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('main-menu');
if (menuToggle && menu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Smooth scroll for anchor links
for (const link of document.querySelectorAll('a[href^="#"]')) {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// Tracking hook
// Para usar GA4: inclua o snippet do gtag no <head> e defina seu Measurement ID.
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

function trackEvent(eventName, payload = {}) {
  if (window.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    window.gtag('event', eventName, payload);
  }
}

window.LFSiteTrack = function LFSiteTrack(eventName, payload = {}) {
  trackEvent(eventName, payload);
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...payload });
  }
};

function trackCTA(label) {
  if (window.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    window.gtag('event', 'cta_click', {
      event_category: 'engagement',
      event_label: label,
      value: 1,
    });
  }
  console.log('[CTA]', label);
}

document.querySelectorAll('.btn').forEach((button) => {
  button.addEventListener('click', () => trackCTA(button.textContent.trim()));
});

document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
  link.addEventListener('click', () => trackCTA('whatsapp_click'));
});

if (document.getElementById('diagnostic-form')) {
  import('./scripts/diagnostic.js').catch(() => {
    console.warn('Falha ao carregar modulo de diagnostico.');
  });
}

if (document.getElementById('roi-form')) {
  import('./scripts/roi-simulator.js').catch(() => {
    console.warn('Falha ao carregar modulo de ROI.');
  });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const sections = Array.from(document.querySelectorAll('.section'));
  sections.forEach((section) => section.classList.add('reveal-init'));

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal-in');
      entry.target.classList.remove('reveal-init');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  sections.forEach((section) => observer.observe(section));
}
