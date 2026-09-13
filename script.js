// AI Premium positioning layer
// Keeps the static structure stable while aligning the homepage copy with the
// LF Soluções positioning: AI Engineering, automation, data and integrations.
function applyPremiumPositioning() {
  const isHome = document.getElementById('inicio') && document.querySelector('.hero .hero-grid');
  if (!isHome) return;

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };

  const setMeta = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.setAttribute('content', value);
  };

  const title = 'LF Soluções | AI Engineering, Automação e Dados para Empresas';
  const description = 'LF Soluções desenvolve soluções de AI Engineering, automação, integrações e inteligência de dados para operações B2B com governança, rastreabilidade e foco em resultado.';

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);

  setText('.hero .eyebrow', 'AI Engineering • Automação • Dados • Integrações');

  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    heroTitle.textContent = '';
    heroTitle.append('Engenharia e inteligência para transformar ');
    const accent = document.createElement('span');
    accent.textContent = 'operações em vantagem competitiva';
    heroTitle.appendChild(accent);
  }

  setText(
    '.hero-copy',
    'Projetamos e implementamos automações, integrações, plataformas de dados e soluções de IA que conectam tecnologia ao resultado do negócio — da arquitetura à operação em produção.'
  );

  const heroButtons = document.querySelectorAll('.hero .hero-cta .btn');
  if (heroButtons[0]) heroButtons[0].textContent = 'Agendar diagnóstico técnico';
  if (heroButtons[1]) heroButtons[1].textContent = 'Explorar oportunidades e ROI';

  const heroKpis = document.querySelectorAll('.hero-kpis li');
  const capabilityMessages = [
    ['AI Engineering', ' soluções de IA integradas à operação'],
    ['Automation', ' fluxos confiáveis e mensuráveis'],
    ['Data & APIs', ' integração, governança e inteligência']
  ];
  heroKpis.forEach((item, index) => {
    const message = capabilityMessages[index];
    if (!message) return;
    item.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = message[0];
    item.append(strong, message[1]);
  });

  setText('.hero-card h3', 'Engineering Discovery');
  setText(
    '.hero-card p',
    'Mapeamos arquitetura, processos, dados e oportunidades de IA para transformar problemas de negócio em um roadmap técnico executável.'
  );
  const discoveryItems = document.querySelectorAll('.hero-card li');
  const discoveryCopy = [
    'Arquitetura e diagnóstico do cenário atual',
    'Roadmap priorizado por impacto, risco e viabilidade',
    'Métricas, governança e critérios de sucesso'
  ];
  discoveryItems.forEach((item, index) => {
    if (!discoveryCopy[index]) return;
    const icon = item.querySelector('svg');
    item.textContent = '';
    if (icon) item.appendChild(icon);
    item.append(` ${discoveryCopy[index]}`);
  });

  const trustItems = document.querySelectorAll('.trust-grid p');
  const trustCopy = [
    ['Engenharia:', ' IA, APIs, automação e plataformas de dados'],
    ['Entrega:', ' discovery → arquitetura → implementação → evolução'],
    ['Princípios:', ' governança, observabilidade, segurança e ROI']
  ];
  trustItems.forEach((item, index) => {
    const content = trustCopy[index];
    if (!content) return;
    item.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = content[0];
    item.append(strong, content[1]);
  });

  setText('#servicos h2', 'Capacidades de engenharia');
  setText(
    '#servicos .section-copy',
    'Da estratégia à produção: soluções projetadas para integrar sistemas, automatizar operações e transformar dados em decisões.'
  );

  const serviceTitles = document.querySelectorAll('#servicos .icon-card h3');
  const serviceDescriptions = document.querySelectorAll('#servicos .icon-card p');
  const services = [
    ['Automation Engineering', 'Desenhamos fluxos automatizados, integrações e orquestrações com rastreabilidade, resiliência e métricas operacionais.'],
    ['Data & Intelligence', 'Estruturamos dados, indicadores e camadas analíticas para decisões confiáveis, governança e previsibilidade.'],
    ['AI Engineering', 'Construímos agentes, assistentes e serviços de IA integrados aos processos e sistemas da empresa, com controle e observabilidade.']
  ];
  services.forEach((service, index) => {
    const titleElement = serviceTitles[index];
    if (titleElement) {
      const icon = titleElement.querySelector('svg');
      titleElement.textContent = '';
      if (icon) titleElement.appendChild(icon);
      titleElement.append(` ${service[0]}`);
    }
    if (serviceDescriptions[index]) serviceDescriptions[index].textContent = service[1];
  });

  setText('#solucoes-especializadas h2', 'Soluções e aceleradores');
  setText(
    '#solucoes-especializadas .section-copy',
    'Produtos e soluções especializadas que combinam IA, dados públicos, automação e integrações para resolver problemas concretos de negócio.'
  );

  setText('#diferenciais h2', 'Engenharia com visão de negócio');
  const differentials = document.querySelectorAll('#diferenciais .card');
  const differentialCopy = [
    ['Arquitetura orientada a resultado', 'Decisões técnicas conectadas a impacto operacional, risco, custo e capacidade de evolução.'],
    ['Entrega incremental', 'Arquitetura suficiente para escalar, com ciclos curtos que colocam valor real em produção mais cedo.'],
    ['Production-first', 'Observabilidade, segurança, testes, documentação e operação fazem parte da solução desde o desenho.'],
    ['Governança transparente', 'Roadmap, critérios de aceite, indicadores, riscos e decisões arquiteturais ficam claros durante toda a evolução.']
  ];
  differentials.forEach((card, index) => {
    const copy = differentialCopy[index];
    if (!copy) return;
    const heading = card.querySelector('h3');
    const paragraph = card.querySelector('p');
    if (heading) heading.textContent = copy[0];
    if (paragraph) paragraph.textContent = copy[1];
  });

  setText('#processo h2', 'Do problema à produção');
  const processSteps = document.querySelectorAll('#processo .timeline > div');
  const processCopy = [
    ['1. Discovery', 'Contexto de negócio, arquitetura atual, dados, restrições e oportunidades.'],
    ['2. Solution Design', 'Arquitetura, trade-offs, prioridades e plano de entrega orientado a valor.'],
    ['3. Engineering', 'Implementação, integração, testes, observabilidade e validação em ciclos curtos.'],
    ['4. Operação & Evolução', 'Métricas, melhoria contínua, otimização de custos e expansão das capacidades.']
  ];
  processSteps.forEach((step, index) => {
    const copy = processCopy[index];
    if (!copy) return;
    step.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = copy[0];
    const paragraph = document.createElement('p');
    paragraph.textContent = copy[1];
    step.append(strong, paragraph);
  });

  setText('#diagnostico-roi h2', 'Descubra onde tecnologia gera mais impacto');
  setText(
    '#diagnostico-roi > .container > .section-copy',
    'Mapeie rapidamente gargalos da operação e estime onde automação, dados ou IA podem gerar maior retorno para priorizar o próximo investimento.'
  );

  setText('#sobre h2', 'Engenharia de software e IA aplicada ao negócio');
  const aboutParagraphs = document.querySelectorAll('#sobre .about-grid .card:first-child p');
  if (aboutParagraphs[0]) {
    aboutParagraphs[0].textContent = 'A LF Soluções atua na interseção entre engenharia de software, inteligência artificial, automação e dados, construindo soluções B2B que precisam funcionar de verdade em produção.';
  }
  if (aboutParagraphs[1]) {
    aboutParagraphs[1].textContent = 'Combinamos arquitetura, engenharia e agentes de IA em um modelo de execução orientado por governança, rastreabilidade, qualidade técnica e resultado mensurável.';
  }

  setText('#contato h2', 'Qual problema de engenharia ou operação você precisa resolver?');
  setText(
    '#contato .cta-box > p',
    'Compartilhe o contexto. A primeira conversa é focada em entender o problema, avaliar viabilidade e identificar o caminho técnico de maior impacto.'
  );
}

applyPremiumPositioning();

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
// Para usar GA4: inclua o snippet do gtag no <head> e defina window.LFSiteConfig.gaMeasurementId.
const siteConfig = window.LFSiteConfig || {};
const GA_MEASUREMENT_ID = typeof siteConfig.gaMeasurementId === 'string' ? siteConfig.gaMeasurementId.trim() : '';
const analyticsEnabled = GA_MEASUREMENT_ID.length > 0;

function trackEvent(eventName, payload = {}) {
  if (analyticsEnabled && window.gtag) {
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
  if (analyticsEnabled && window.gtag) {
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
