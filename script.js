const scriptUrl = document.currentScript ? new URL(document.currentScript.src, window.location.href) : new URL('./script.js', window.location.href);
const siteRoot = new URL('./', scriptUrl);

if (!document.querySelector('link[href*="brand-system.css"]')) {
  const brandCss = document.createElement('link');
  brandCss.rel = 'stylesheet';
  brandCss.href = new URL('brand-system.css', siteRoot).href;
  document.head.appendChild(brandCss);
}

const brand = document.querySelector('.brand');
if (brand && !brand.querySelector('.brand-lockup')) {
  brand.innerHTML = '';
  const logo = document.createElement('img');
  logo.src = new URL('assets/lf-logo-horizontal.svg', siteRoot).href;
  logo.alt = 'LF Soluções';
  logo.className = 'brand-lockup';
  brand.appendChild(logo);
}

// Normalize legacy labels without rewriting valid section anchors.
// The current home intentionally keeps the established IDs (#servicos,
// #solucoes-especializadas, #mini-cases, #sobre and #faq), so changing those
// hrefs at runtime breaks navigation and can make menu items disappear.
document.querySelectorAll('.menu a').forEach((link) => {
  const label = link.textContent.trim();
  if (label === 'Serviços') link.textContent = 'Capacidades';
  if (label === 'Cases') link.textContent = 'Como atuamos';
  if (label === 'Sobre') link.textContent = 'Empresa';
  if (label === 'Falar agora') link.textContent = 'Conversar';
});

if (!document.getElementById('conteudo') && document.querySelector('main')) {
  document.querySelector('main').id = document.querySelector('main').id || 'conteudo';
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const menuToggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('main-menu');
if (menuToggle && menu) {
  menuToggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
});

function plausibleEvent(name, props) {
  if (typeof window.plausible === 'function') window.plausible(name, props ? { props } : undefined);
}

document.querySelectorAll('a[href*="wa.me"]').forEach((link) => link.addEventListener('click', () => plausibleEvent('WhatsAppClick')));
document.querySelectorAll('.btn-primary').forEach((button) => button.addEventListener('click', () => plausibleEvent('PrimaryCTAClick', { label: button.textContent.trim().slice(0, 60) })));

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = contactForm.querySelector('button[type="submit"]');
    const success = document.getElementById('form-success');
    if (submit) submit.disabled = true;
    try {
      const response = await fetch(contactForm.action, { method: 'POST', body: new FormData(contactForm), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('form submission failed');
      contactForm.reset();
      if (success) { success.hidden = false; success.textContent = 'Mensagem enviada. Retornaremos pelo contato informado.'; }
      plausibleEvent('ContactFormSubmit');
    } catch (error) {
      if (success) { success.hidden = false; success.textContent = 'Não foi possível enviar agora. Use o WhatsApp ou e-mail acima.'; }
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}
