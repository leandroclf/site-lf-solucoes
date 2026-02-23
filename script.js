document.getElementById('year').textContent = new Date().getFullYear();

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
