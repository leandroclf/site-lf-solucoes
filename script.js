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

// Simple CTA tracking hook (plug GA4/Pixel later)
function trackCTA(label) {
  // Example:
  // window.gtag?.('event', 'cta_click', { label });
  console.log('[CTA]', label);
}

document.querySelectorAll('.btn').forEach((button) => {
  button.addEventListener('click', () => trackCTA(button.textContent.trim()));
});
