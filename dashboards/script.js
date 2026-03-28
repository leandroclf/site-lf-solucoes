let kanbanData = null;
window.__analyticsCache = window.__analyticsCache || {};
const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;
const SAVE_DATA = Boolean(navigator.connection && navigator.connection.saveData);
const AUTO_REFRESH_MS = SAVE_DATA ? 900000 : (IS_MOBILE ? 600000 : 300000);
const DATA_CACHE_TTL_MS = 60000;
const DATA_CACHE = new Map();
let autoRefreshTimer = null;
let kanbanRenderToken = 0;
let kanbanBoardHydrated = false;

function scheduleLowPriority(fn, delayMs = 0) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => fn(), { timeout: 1200 });
    return;
  }
  window.setTimeout(fn, delayMs);
}

function debounce(fn, waitMs = 150) {
  let timer = null;
  return (...args) => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), waitMs);
  };
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

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

for (const link of document.querySelectorAll('a[href^="#"]')) {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!link.hasAttribute('data-dashboard-action')) {
      trackDashboardSignal('navigation', targetId.replace('#', ''), {
        label: link.textContent.trim(),
      });
    }
  });
}

function priorityClass(priority) {
  if (priority === 'Alta') return 'priority-high';
  if (priority === 'Média') return 'priority-medium';
  return 'priority-low';
}

function normalize(text) {
  return String(text || '').toLowerCase();
}

function extractUpdatedAt(data) {
  return data?.updatedAt || data?.updated_at || data?.last_updated_utc || data?.last_updated || null;
}

function formatBrtTimestamp(value) {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

const DASHBOARD_SIGNAL_STORE = 'lf-dashboard-signals-v1';

function loadDashboardSignals() {
  try {
    const raw = window.localStorage.getItem(DASHBOARD_SIGNAL_STORE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDashboardSignals(events) {
  try {
    window.localStorage.setItem(DASHBOARD_SIGNAL_STORE, JSON.stringify((events || []).slice(-120)));
  } catch {
    // Storage is best-effort only.
  }
}

function trackDashboardSignal(family, action, detail = {}) {
  if (!family || !action) return;
  const events = loadDashboardSignals();
  events.push({
    at: new Date().toISOString(),
    family,
    action,
    detail,
  });
  saveDashboardSignals(events);
}

function getDashboardSignalCoverage() {
  return [
    { family: 'navigation', active: document.querySelectorAll('.dashboard-shortcuts a[href^="#"]').length > 0 },
    { family: 'cta', active: document.querySelectorAll('[data-dashboard-action]').length > 0 },
    { family: 'filter', active: Boolean(document.getElementById('filter-owner') && document.getElementById('filter-project') && document.getElementById('filter-mode') && document.getElementById('filter-priority')) },
    { family: 'view', active: Boolean(document.getElementById('view-executive') && document.getElementById('view-operational')) },
    { family: 'export', active: Boolean(document.getElementById('download-weekly-report') && document.getElementById('download-handoff')) },
    { family: 'chart-goal', active: document.querySelectorAll('#tendencias .goal-line').length >= 5 },
    { family: 'signal-panel', active: Boolean(document.getElementById('dashboard-signals-panel') && document.getElementById('dashboard-signal-list') && document.getElementById('dashboard-signal-families')) },
    { family: 'autonomy-panel', active: Boolean(document.getElementById('autonomy-supervisor') && document.getElementById('autonomy-actions') && document.getElementById('autonomy-candidates') && document.getElementById('autonomy-alerts')) },
  ];
}

function renderDashboardSignals() {
  const qualityEl = document.getElementById('dashboard-signal-quality');
  const summaryEl = document.getElementById('dashboard-signal-summary');
  const eventsEl = document.getElementById('dashboard-signal-events');
  const topEl = document.getElementById('dashboard-signal-top');
  const lastEl = document.getElementById('dashboard-signal-last');
  const recencyEl = document.getElementById('dashboard-signal-recency');
  const badgeEl = document.getElementById('dashboard-signal-quality-badge');
  const familiesEl = document.getElementById('dashboard-signal-families');
  const listEl = document.getElementById('dashboard-signal-list');
  if (!qualityEl || !summaryEl || !eventsEl || !topEl || !lastEl || !recencyEl || !badgeEl || !familiesEl || !listEl) return;

  const coverage = getDashboardSignalCoverage();
  const covered = coverage.filter((item) => item.active).length;
  const coverageScore = Math.round((covered / Math.max(coverage.length, 1)) * 100);

  const now = Date.now();
  const events7d = loadDashboardSignals().filter((event) => {
    const ts = new Date(event.at || '').getTime();
    return Number.isFinite(ts) && ts >= (now - (7 * 24 * 36e5));
  });
  const counts = events7d.reduce((acc, event) => {
    const key = String(event.family || 'unknown');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topAction = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || null;
  const lastEvent = events7d[events7d.length - 1] || null;

  qualityEl.textContent = `${coverageScore}%`;
  summaryEl.textContent = `Cobertura ativa: ${covered}/${coverage.length} famílias de sinal`;
  eventsEl.textContent = `${events7d.length}`;
  topEl.textContent = topAction ? `Família mais ativa: ${topAction[0]} (${topAction[1]})` : 'Família mais ativa: n/d';
  lastEl.textContent = lastEvent ? `Último sinal: ${lastEvent.family || 'signal'}/${lastEvent.action || 'n/d'}` : 'Último sinal: —';
  recencyEl.textContent = lastEvent
    ? `Recência: ${Math.round((now - new Date(lastEvent.at).getTime()) / 60000)} min`
    : 'Recência: n/d';
  badgeEl.className = 'badge';
  if (coverageScore >= 90) {
    badgeEl.classList.add('signal-green');
    badgeEl.textContent = 'Cobertura forte';
  } else if (coverageScore >= 60) {
    badgeEl.classList.add('signal-yellow');
    badgeEl.textContent = 'Cobertura parcial';
  } else {
    badgeEl.classList.add('signal-red');
    badgeEl.textContent = 'Cobertura baixa';
  }

  familiesEl.innerHTML = coverage.map((item) => {
    const status = item.active ? 'ativo' : 'pendente';
    const statusClass = item.active ? 'signal-family-active' : 'signal-family-idle';
    return `<li><strong>${item.family}</strong><span class="${statusClass}">${status}</span></li>`;
  }).join('');

  listEl.innerHTML = events7d.slice(-5).reverse().map((event) => {
    const stamp = formatBrtTimestamp(event.at) || event.at || 'n/d';
    const detail = event.detail?.label ? ` — ${event.detail.label}` : '';
    return `<li><strong>${event.family || 'signal'}</strong> — ${event.action || 'n/d'}${detail} <span class="task-meta">${stamp}</span></li>`;
  }).join('') || '<li class="task-meta">Sem sinais rastreados ainda.</li>';
}

function bindDashboardActionTracking() {
  document.querySelectorAll('[data-dashboard-action]').forEach((el) => {
    if (el.dataset.signalBound === 'true') return;
    el.dataset.signalBound = 'true';
    el.addEventListener('click', () => {
      trackDashboardSignal(el.dataset.dashboardFamily || 'cta', el.dataset.dashboardAction || 'click', {
        label: el.textContent.trim().replace(/\s+/g, ' '),
        href: el.getAttribute('href') || null,
      });
      renderDashboardSignals();
    });
  });
}

function renderCommitReference(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const sha = parsed.pathname.split('/').pop() || url;
    const shortSha = sha.slice(0, 7);
    return `<a href="${url}" target="_blank" rel="noreferrer"><code>${shortSha}</code></a>`;
  } catch {
    return `<a href="${url}" target="_blank" rel="noreferrer">commit</a>`;
  }
}

function extractIssueCode(text) {
  const match = String(text || '').match(/\[(ISSUE-\d+)\]/);
  return match ? match[1] : null;
}

function extractIssueNumber(text) {
  const code = extractIssueCode(text);
  if (!code) return Number.POSITIVE_INFINITY;
  const numeric = Number(code.replace(/[^\d]/g, ''));
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function isWaveActiveStatus(status) {
  const normalized = normalize(status);
  return normalized.includes('em progresso') || normalized.includes('em valida');
}

function isIssue022Wave(task) {
  return /\[ISSUE-022\]/.test(String(task?.title || '')) ||
    normalize(task?.description || '').includes('issue-022-dataset-scout-v1');
}

function getFilters() {
  return {
    owner: document.getElementById('filter-owner').value,
    project: document.getElementById('filter-project').value,
    mode: document.getElementById('filter-mode').value,
    priority: document.getElementById('filter-priority').value,
    search: document.getElementById('filter-search').value.trim(),
  };
}

function applyFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  const map = {
    owner: 'filter-owner',
    project: 'filter-project',
    mode: 'filter-mode',
    priority: 'filter-priority',
    search: 'filter-search',
  };

  for (const [key, elId] of Object.entries(map)) {
    const val = params.get(key);
    if (val !== null) {
      const el = document.getElementById(elId);
      if (el) el.value = val;
    }
  }
}

function persistFiltersToURL() {
  const filters = getFilters();
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });

  const newUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
  window.history.replaceState({}, '', newUrl);
}

function filterTasks(tasks) {
  const { owner, project, mode, priority, search } = getFilters();
  const searchTerm = normalize(search);

  return tasks.filter((task) => {
    const ownerOk = !owner || task.owner === owner;
    const projectOk = !project || task.project === project;
    const modeOk = !mode || task.mode === mode;
    const priorityOk = !priority || task.priority === priority;
    const haystack = `${task.title || ''} ${task.description || ''} ${task.owner || ''} ${task.status || ''} ${task.project || ''} ${task.mode || ''}`.toLowerCase();
    const searchOk = !searchTerm || haystack.includes(searchTerm);
    return ownerOk && projectOk && modeOk && priorityOk && searchOk;
  });
}

function pct(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

function setStackedBar(containerId, segments) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  for (const seg of segments) {
    const d = document.createElement('div');
    d.className = seg.className;
    d.style.width = `${seg.percentage}%`;
    d.title = `${seg.label}: ${seg.value}`;
    el.appendChild(d);
  }
}

function renderOwnerBars(tasks) {
  const owners = {};
  tasks.forEach((t) => {
    owners[t.owner || 'Sem responsável'] = (owners[t.owner || 'Sem responsável'] || 0) + 1;
  });

  const top = Object.entries(owners).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const max = top.length ? top[0][1] : 1;
  const target = document.getElementById('chart-owners');
  target.innerHTML = '';

  if (!top.length) {
    target.innerHTML = '<p class="task-meta">Sem dados no filtro atual.</p>';
    return;
  }

  top.forEach(([owner, count]) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    const width = Math.max(8, Math.round((count / max) * 100));

    row.innerHTML = `
      <span class="task-meta">${owner}</span>
      <div class="bar" style="width:${width}%"></div>
      <span class="task-meta">${count}</span>
    `;
    target.appendChild(row);
  });
}

function renderCharts(tasks) {
  const total = tasks.length;

  const auto = tasks.filter((t) => t.mode === 'AUTO').length;
  const human = tasks.filter((t) => t.mode === 'HUMAN').length;
  setStackedBar('chart-mode', [
    { className: 'seg-auto', percentage: pct(auto, total), label: 'AUTO', value: auto },
    { className: 'seg-human', percentage: pct(human, total), label: 'HUMAN', value: human },
  ]);
  document.getElementById('chart-mode-label').textContent = `AUTO ${auto} • HUMAN ${human}`;

  const high = tasks.filter((t) => t.priority === 'Alta').length;
  const med = tasks.filter((t) => t.priority === 'Média').length;
  const low = tasks.filter((t) => (t.priority || 'Baixa') === 'Baixa').length;
  setStackedBar('chart-priority', [
    { className: 'seg-high', percentage: pct(high, total), label: 'Alta', value: high },
    { className: 'seg-medium', percentage: pct(med, total), label: 'Média', value: med },
    { className: 'seg-low', percentage: pct(low, total), label: 'Baixa', value: low },
  ]);
  document.getElementById('chart-priority-label').textContent = `Alta ${high} • Média ${med} • Baixa ${low}`;

  renderOwnerBars(tasks);
}

function updateSlaPanel(tasks) {
  const reviewEl = document.getElementById('sla-review');
  const execEl = document.getElementById('sla-exec');
  const unblockEl = document.getElementById('sla-unblock');
  if (!reviewEl || !execEl || !unblockEl) return;

  const overdue = tasks.filter((t) => String(t.status || '').toLowerCase().includes('atras')).length;
  const blocked = tasks.filter((t) => t.mode === 'HUMAN' && (!Array.isArray(t.runbookSteps) || t.runbookSteps.length === 0)).length;

  reviewEl.textContent = overdue ? 'Atenção' : 'Dentro do alvo';
  execEl.textContent = blocked ? 'Atenção' : 'Dentro do alvo';
  unblockEl.textContent = (overdue || blocked) ? 'Monitorar' : 'Dentro do alvo';
}

function setKpiState(elId, state) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.remove('kpi-green', 'kpi-yellow', 'kpi-red', 'kpi-gray');
  el.classList.add(`kpi-${state}`);
}

function fmtVar(current, previous, suffix = '') {
  if (previous === null || previous === undefined || previous === 0) return 'Variação: n/d';
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const arrow = delta > 0 ? '↑' : (delta < 0 ? '↓' : '→');
  return `Variação: ${arrow} ${Math.abs(delta).toFixed(1)}%${suffix}`;
}

function renderStrategicKpis(tasks, deployData, autopilotData, activities) {
  const totalJobs = Number((window.__handoffData?.automation?.activeJobCount) || 0);
  const delayedJobs = (deployData?.repos || []).filter((r) => {
    const c = String(r.conclusion || '').toLowerCase();
    return ['failure', 'cancelled', 'timed_out'].includes(c) || r.status === 'error';
  }).length;
  const sla = Number(autopilotData?.kpis?.cycleCompletionPct || 0);

  const done = (activities || []).filter((a) => a.status === 'done' && a.createdAt && a.completedAt);
  const tmr = done.length ? (done.reduce((s, a) => s + ((new Date(a.completedAt) - new Date(a.createdAt)) / 36e5), 0) / done.length) : null;

  const weeklyCut = Date.now() - (7 * 24 * 36e5);
  const prevWeeklyCut = Date.now() - (14 * 24 * 36e5);
  const throughput = done.filter((a) => new Date(a.completedAt).getTime() >= weeklyCut).length;
  const throughputPrev = done.filter((a) => {
    const t = new Date(a.completedAt).getTime();
    return t >= prevWeeklyCut && t < weeklyCut;
  }).length;

  const prevSla = Number(autopilotData?.history?.previousCycleCompletionPct || 0) || null;
  const prevTmr = Number(window.__analyticsCache?.leadTimePrev || 0) || null;
  const prevDayJobs = Number(window.__analyticsCache?.prevDayJobs || 0) || null;
  const prevDayDelayed = Number(window.__analyticsCache?.prevDayDelayed || 0) || null;

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set('metric-jobs', String(totalJobs));
  set('metric-jobs-delayed', String(delayedJobs));
  set('metric-sla-current', `${sla.toFixed(1)}%`);
  set('metric-tmr', tmr === null ? 'n/d' : `${tmr.toFixed(1)}h`);
  set('metric-throughput', `${throughput}/sem`);

  const varJobs = document.getElementById('metric-jobs-var');
  const varDelayed = document.getElementById('metric-jobs-delayed-var');
  const varSla = document.getElementById('metric-sla-var');
  const varTmr = document.getElementById('metric-tmr-var');
  const varThroughput = document.getElementById('metric-throughput-var');
  if (varJobs) varJobs.textContent = fmtVar(totalJobs, prevDayJobs);
  if (varDelayed) varDelayed.textContent = fmtVar(delayedJobs, prevDayDelayed);
  if (varSla) varSla.textContent = fmtVar(sla, prevSla);
  if (varTmr) varTmr.textContent = fmtVar(tmr || 0, prevTmr, '');
  if (varThroughput) varThroughput.textContent = fmtVar(throughput, throughputPrev);

  const stateByTarget = (value, target, inverse = false) => {
    if (value === null || Number.isNaN(value)) return 'gray';
    const deviationPct = inverse ? ((value - target) / target) * 100 : ((target - value) / target) * 100;
    if (deviationPct >= 0) return 'green';
    if (Math.abs(deviationPct) <= 10) return 'yellow';
    return 'red';
  };

  const states = {
    jobs: totalJobs >= 8 ? 'green' : 'yellow',
    delayed: delayedJobs === 0 ? 'green' : (delayedJobs <= 1 ? 'yellow' : 'red'),
    sla: stateByTarget(sla, 95),
    tmr: stateByTarget(tmr, 24, true),
    throughput: throughput >= 6 ? 'green' : (throughput >= 5 ? 'yellow' : 'red'),
  };
  setKpiState('kpi-jobs-ativos', states.jobs);
  setKpiState('kpi-jobs-atrasados', states.delayed);
  setKpiState('kpi-sla', states.sla);
  setKpiState('kpi-tmr', states.tmr);
  setKpiState('kpi-throughput', states.throughput);

  const badge = document.getElementById('immediate-action-badge');
  const primaryCta = document.getElementById('dashboard-immediate-cta');
  const secondaryCta = document.getElementById('dashboard-secondary-cta');
  const tertiaryCta = document.getElementById('dashboard-tertiary-cta');
  const ctaHint = document.getElementById('dashboard-cta-guidance');
  if (badge) {
    const vals = Object.values(states);
    const red = vals.filter((x) => x === 'red').length;
    const yellow = vals.filter((x) => x === 'yellow').length;
    badge.classList.remove('badge-green', 'badge-yellow', 'badge-red');
    if (red > 0) {
      badge.classList.add('badge-red');
      badge.textContent = `Ação imediata: ${red} KPI(s) críticos`;
    } else if (yellow > 0) {
      badge.classList.add('badge-yellow');
      badge.textContent = `Atenção: ${yellow} KPI(s) em alerta`;
    } else {
      badge.classList.add('badge-green');
      badge.textContent = 'Operação sob controle';
    }

    if (primaryCta && secondaryCta && tertiaryCta && ctaHint) {
      const plan = red > 0
        ? {
            href: '#alertas-gargalos',
            label: 'Abrir alertas críticos',
            hint: 'Prioridade: zerar bloqueios e atrasos antes de expandir o restante do painel.',
          }
        : (yellow > 0
          ? {
              href: '#tendencias',
              label: 'Revisar tendências',
              hint: 'Prioridade: estabilizar os sinais amarelos e revisar as metas visuais.',
            }
          : {
              href: '#commercial-funnel',
              label: 'Acelerar funil comercial',
              hint: 'Prioridade: explorar receita e manter a operação saudável.',
            });

      primaryCta.href = plan.href;
      primaryCta.textContent = plan.label;
      ctaHint.textContent = plan.hint;
      secondaryCta.href = '#commercial-funnel';
      tertiaryCta.href = '#metrics-history';
    }
  }

  const autonomyAction = window.__autonomyData?.recommendedNextAction;
  if (autonomyAction && primaryCta && ctaHint) {
    primaryCta.href = autonomyAction.href || '#autonomy-supervisor';
    primaryCta.textContent = autonomyAction.ctaLabel || autonomyAction.label || 'Abrir autonomia';
    ctaHint.textContent = autonomyAction.reason || ctaHint.textContent || 'Acompanhamento autônomo ativo.';
  }

  window.__analyticsCache.prevDayJobs = totalJobs;
  window.__analyticsCache.prevDayDelayed = delayedJobs;
}

function renderAutonomyState(data) {
  const stampEl = document.getElementById('autonomy-stamp');
  const summaryEl = document.getElementById('autonomy-summary');
  const actionEl = document.getElementById('autonomy-action');
  const actionMetaEl = document.getElementById('autonomy-action-meta');
  const signalEl = document.getElementById('autonomy-signal');
  const signalMetaEl = document.getElementById('autonomy-signal-meta');
  const healthEl = document.getElementById('autonomy-health');
  const healthMetaEl = document.getElementById('autonomy-health-meta');
  const actionsEl = document.getElementById('autonomy-actions');
  const candidatesEl = document.getElementById('autonomy-candidates');
  const alertsEl = document.getElementById('autonomy-alerts');
  if (!stampEl || !summaryEl || !actionEl || !actionMetaEl || !signalEl || !signalMetaEl || !healthEl || !healthMetaEl || !actionsEl || !candidatesEl || !alertsEl) return;

  window.__autonomyData = data || {};

  const updated = data?.updatedAt ? formatBrtTimestamp(data.updatedAt) : null;
  stampEl.textContent = updated ? `Atualizado em: ${updated}` : 'Atualizado em: n/d';
  summaryEl.textContent = data?.summary || 'Sem recomendação autônoma disponível.';
  actionEl.textContent = data?.recommendedNextAction?.label || 'Monitorar autonomia';
  actionMetaEl.textContent = data?.recommendedNextAction?.reason || 'Sem motivo registrado.';
  signalEl.textContent = data?.overallStatusLabel || 'Autonomia ativa';
  signalMetaEl.textContent = `AUTO ativo: ${data?.stats?.activeAuto ?? 0} | prontos: ${data?.stats?.readyAuto ?? 0} | planejados: ${data?.stats?.plannedAuto ?? 0}`;
  healthEl.textContent = `${Number(data?.autonomyScore || 0)}%`;
  healthMetaEl.textContent = `Bloqueios: ${data?.stats?.blockers ?? 0} | Fila: ${data?.stats?.actionQueue ?? 0} | Repos em alerta: ${Number(data?.stats?.yellowRepos || 0) + Number(data?.stats?.redRepos || 0)}`;

  const actions = Array.isArray(data?.recommendedActions) ? data.recommendedActions.slice(0, 5) : [];
  actionsEl.innerHTML = '';
  if (actions.length) {
    for (const item of actions) {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = item.label || item.kind || 'Ação';
      const span = document.createElement('span');
      span.className = 'task-meta';
      span.textContent = `${item.kind || 'n/d'} | ${item.reason || 'sem motivo registrado'}`;
      li.append(strong, ' — ', span);
      actionsEl.appendChild(li);
    }
  } else {
    const li = document.createElement('li');
    li.className = 'task-meta';
    li.textContent = 'Nenhuma ação sugerida no momento.';
    actionsEl.appendChild(li);
  }

  const candidates = Array.isArray(data?.rankedCandidates) ? data.rankedCandidates.slice(0, 5) : [];
  candidatesEl.innerHTML = '';
  if (candidates.length) {
    for (const item of candidates) {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = item.issueId || 'ISSUE';
      const span = document.createElement('span');
      span.className = 'task-meta';
      const repo = item.repo ? ` • repo: ${item.repo}` : '';
      const owner = item.owner ? ` • owner: ${item.owner}` : '';
      li.append(strong, ` — ${item.title || 'sem título'} `, span);
      span.textContent = `${item.statusKind || 'n/d'}${owner}${repo}`;
      candidatesEl.appendChild(li);
    }
  } else {
    const li = document.createElement('li');
    li.className = 'task-meta';
    li.textContent = 'Nenhum candidato AUTO elegível.';
    candidatesEl.appendChild(li);
  }

  alertsEl.innerHTML = '';
  for (const blocker of Array.isArray(data?.blockers) ? data.blockers.slice(0, 5) : []) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = 'BLOCKER';
    li.append(strong, ` — ${blocker.source || 'n/d'}: ${blocker.details || 'n/d'}`);
    alertsEl.appendChild(li);
  }
  for (const warning of Array.isArray(data?.warnings) ? data.warnings.slice(0, 5) : []) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = 'ALERTA';
    li.append(strong, ` — ${warning.source || 'n/d'}: ${warning.details || 'n/d'}`);
    alertsEl.appendChild(li);
  }
  for (const advisory of Array.isArray(data?.advisories) ? data.advisories.slice(0, 5) : []) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = 'REPO';
    li.append(strong, ` — ${advisory.repo || 'n/d'}: ${advisory.status || 'n/d'} (${advisory.ageHours ?? 'n/d'}h)`);
    alertsEl.appendChild(li);
  }
  if (!alertsEl.children.length) {
    const li = document.createElement('li');
    li.className = 'task-meta';
    li.textContent = 'Nenhum alerta ou bloqueio ativo.';
    alertsEl.appendChild(li);
  }
}

function renderOperationalAlerts(tasks, deployData) {
  const bottlenecksEl = document.getElementById('bottlenecks-list');
  const criticalJobsEl = document.getElementById('critical-jobs-bars');
  const slaViolEl = document.getElementById('sla-violations-list');
  const blockedTypeEl = document.getElementById('blocked-by-type');
  const heatEl = document.getElementById('heatmap-categories');
  if (!bottlenecksEl || !criticalJobsEl || !slaViolEl || !heatEl || !blockedTypeEl) return;

  const score = (t) => {
    const p = t.priority === 'Alta' ? 3 : (t.priority === 'Média' ? 2 : 1);
    const blocked = String(t.status || '').toLowerCase().includes('blocked') ? 3 : 0;
    const human = t.mode === 'HUMAN' ? 1 : 0;
    return p + blocked + human;
  };

  const top = [...tasks].sort((a, b) => score(b) - score(a)).slice(0, 5);
  bottlenecksEl.innerHTML = top.map((t, idx) => `<li><button class="btn btn-secondary drill-task" data-task-title="${String(t.title || '').replace(/"/g, '&quot;')}">#${idx + 1} ${t.title}</button> — ${t.status || 'n/d'} (${t.ownerPrimary || t.owner || 'n/d'})</li>`).join('') || '<li>Sem gargalos relevantes.</li>';
  bottlenecksEl.querySelectorAll('.drill-task').forEach((btn) => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('data-task-title') || '';
      const search = document.getElementById('filter-search');
      if (search) search.value = title;
      if (kanbanData) renderKanban(kanbanData);
      document.getElementById('kanban-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const repos = deployData?.repos || [];
  const critical = repos.map((r) => {
    const c = String(r.conclusion || '').toLowerCase();
    let weight = 1;
    if (['failure', 'cancelled', 'timed_out'].includes(c)) weight = 3;
    else if (r.status === 'error') weight = 2;
    return { name: r.repo, weight, c };
  }).sort((a, b) => b.weight - a.weight);

  criticalJobsEl.innerHTML = '';
  critical.forEach((j) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    const width = Math.max(10, (j.weight / 3) * 100);
    row.innerHTML = `<span class='task-meta'>${j.name}</span><div class='bar' style='width:${width}%;'></div><span class='task-meta'>${j.c || 'n/d'}</span>`;
    criticalJobsEl.appendChild(row);
  });

  const threshold = Number(document.getElementById('alert-threshold-hours')?.value || 24);
  const now = Date.now();
  const slaViol = tasks
    .map((t) => {
      if (!t.openedAt) return null;
      const elapsed = (now - new Date(t.openedAt).getTime()) / 36e5;
      const slaHours = Number(t.slaDecisionHours || threshold);
      const violation = elapsed - slaHours;
      return { task: t, elapsed, slaHours, violation };
    })
    .filter((x) => x && x.elapsed > threshold)
    .sort((a, b) => b.violation - a.violation)
    .slice(0, 5);
  slaViolEl.innerHTML = slaViol.map(({ task, violation }) => `<li><strong>${task.title}</strong> — violação ${violation.toFixed(1)}h</li>`).join('') || '<li>Nenhum SLA vencido nas últimas 24h.</li>';

  const blockedByType = {
    onboarding: tasks.filter((t) => String(t.status || '').includes('BLOCKED_ONBOARDING')).length,
    human: tasks.filter((t) => t.mode === 'HUMAN' && String(t.status || '').toLowerCase().includes('blocked')).length,
    technical: tasks.filter((t) => String(t.status || '').toLowerCase().includes('blocked') && t.mode !== 'HUMAN').length,
  };
  blockedTypeEl.innerHTML = `
    <li><strong>Onboarding</strong>: ${blockedByType.onboarding}</li>
    <li><strong>HUMAN</strong>: ${blockedByType.human}</li>
    <li><strong>Técnico</strong>: ${blockedByType.technical}</li>
  `;

  const byCat = {};
  tasks.forEach((t) => {
    const cat = t.categoryPrimary || 'sem-categoria';
    const isBlocked = String(t.status || '').toLowerCase().includes('blocked');
    byCat[cat] = byCat[cat] || { total: 0, blocked: 0 };
    byCat[cat].total += 1;
    if (isBlocked) byCat[cat].blocked += 1;
  });
  heatEl.innerHTML = Object.entries(byCat).map(([cat, v]) => {
    const ratio = v.total ? (v.blocked / v.total) : 0;
    const bg = ratio > 0.4 ? 'rgba(239,68,68,.25)' : (ratio > 0.15 ? 'rgba(245,158,11,.25)' : 'rgba(16,185,129,.2)');
    return `<div class='heat-cell' style='background:${bg}'><strong>${cat}</strong><div>Bloq: ${v.blocked}/${v.total}</div></div>`;
  }).join('');
}

function drawSparkline(containerId, values, suffix = '', goal = null, goalLabel = '', goalDirection = 'gte') {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!values.length) {
    el.innerHTML = '<p class="task-meta">Dados insuficientes</p>';
    return;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 280; const h = 100;
  const pts = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * (w - 20) + 10;
    const y = h - (((v - min) / range) * (h - 20) + 10);
    return `${x},${y}`;
  }).join(' ');
  const delta = values.length > 1 ? ((values[values.length - 1] - values[0]) / (Math.abs(values[0]) || 1)) * 100 : 0;
  const arrow = delta > 0 ? '↑' : (delta < 0 ? '↓' : '→');
  const latest = values[values.length - 1];

  let goalSvg = '';
  let goalNote = '';
  if (Number.isFinite(goal)) {
    const rawGoalY = h - (((goal - min) / range) * (h - 20) + 10);
    const goalY = Math.max(10, Math.min(h - 10, rawGoalY));
    const goalMet = goalDirection === 'lte' ? latest <= goal : latest >= goal;
    const goalStroke = goalMet ? '#10b981' : '#f59e0b';
    const goalFill = goalMet ? '#10b981' : '#fbbf24';
    goalSvg = `
      <line x1="10" y1="${goalY}" x2="${w - 10}" y2="${goalY}" stroke="${goalStroke}" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.9"></line>
      <text x="${w - 12}" y="${Math.max(12, goalY - 4)}" text-anchor="end" fill="${goalFill}" font-size="10">${goalLabel || `Meta ${goal}`}</text>
    `;
    goalNote = `<p class="task-meta goal-line ${goalMet ? 'goal-hit' : 'goal-miss'}">${goalLabel || `Meta: ${goal}`} — ${goalMet ? 'meta atingida' : 'fora do alvo'}</p>`;
  }

  el.innerHTML = `<svg width='100%' viewBox='0 0 ${w} ${h}'>${goalSvg}<polyline fill='none' stroke='#2563eb' stroke-width='3' points='${pts}'/></svg><p class='task-meta'>${arrow} ${Math.abs(delta).toFixed(1)}%${suffix}</p>${goalNote}`;
}

function renderAnalyticalLayer(tasks, activities) {
  const period = Number(document.getElementById('trend-period')?.value || 7);
  const team = document.getElementById('trend-team')?.value || '';

  const filteredTasks = team ? tasks.filter((t) => t.categoryPrimary === team) : tasks;
  const now = Date.now();
  const cutoff = now - (period * 24 * 36e5);
  const filteredAct = (activities || []).filter((a) => {
    const t = new Date(a.createdAt || a.completedAt || Date.now()).getTime();
    return t >= cutoff;
  });

  const byDay = {};
  filteredAct.forEach((a) => {
    const d = new Date(a.createdAt || a.completedAt).toISOString().slice(0, 10);
    byDay[d] = byDay[d] || { total: 0, done: 0, tmr: [] };
    byDay[d].total += 1;
    if (a.status === 'done') {
      byDay[d].done += 1;
      if (a.createdAt && a.completedAt) byDay[d].tmr.push((new Date(a.completedAt) - new Date(a.createdAt)) / 36e5);
    }
  });

  const days = Object.keys(byDay).sort();
  const vol = days.map((d) => byDay[d].total);
  const sla = days.map((d) => byDay[d].total ? (byDay[d].done / byDay[d].total) * 100 : 0);
  const tmr = days.map((d) => byDay[d].tmr.length ? (byDay[d].tmr.reduce((s, v) => s + v, 0) / byDay[d].tmr.length) : 0);
  const rework = days.map((d) => {
    const arr = filteredAct.filter((a) => (new Date(a.createdAt || a.completedAt).toISOString().slice(0, 10) === d) && a.status === 'done');
    const reopened = arr.filter((a) => Number(a.reopened || 0) > 0).length;
    return arr.length ? (reopened / arr.length) * 100 : 0;
  });
  const humanRisk = days.map((d) => {
    const openDay = filteredAct.filter((a) => a.mode === 'HUMAN' && a.status !== 'done' && (new Date(a.createdAt || Date.now()).toISOString().slice(0, 10) === d)).length;
    return Math.min(100, openDay * 15);
  });

  drawSparkline('trend-volume', vol, ' atividades', 6, 'Meta visual: >= 6 atividades/dia', 'gte');
  drawSparkline('trend-sla', sla, ' SLA', 95, 'Meta visual: >= 95%', 'gte');
  drawSparkline('trend-tmr', tmr, ' TMR', 24, 'Meta visual: <= 24h', 'lte');
  drawSparkline('trend-rework', rework, ' rework', 5, 'Meta visual: <= 5%', 'lte');
  drawSparkline('trend-human-risk', humanRisk, ' risco', 40, 'Meta visual: <= 40', 'lte');

  const statuses = {
    aberto: filteredTasks.filter((t) => String(t.status).toLowerCase().includes('revisar') || String(t.status).toLowerCase().includes('autoriz')).length,
    andamento: filteredTasks.filter((t) => String(t.status).toLowerCase().includes('progresso')).length,
    bloqueado: filteredTasks.filter((t) => String(t.status).toLowerCase().includes('blocked')).length,
    concluido: filteredTasks.filter((t) => String(t.status).toLowerCase().includes('conclu')).length,
  };
  const total = Object.values(statuses).reduce((s, v) => s + v, 0) || 1;
  setStackedBar('trend-status-stacked', [
    { className: 'seg-low', percentage: pct(statuses.aberto, total), label: 'Aberto', value: statuses.aberto },
    { className: 'seg-auto', percentage: pct(statuses.andamento, total), label: 'Em andamento', value: statuses.andamento },
    { className: 'seg-high', percentage: pct(statuses.bloqueado, total), label: 'Bloqueado', value: statuses.bloqueado },
    { className: 'seg-human', percentage: pct(statuses.concluido, total), label: 'Concluído', value: statuses.concluido },
  ]);
  const lbl = document.getElementById('trend-status-label');
  if (lbl) lbl.textContent = `Aberto ${statuses.aberto} • Andamento ${statuses.andamento} • Bloqueado ${statuses.bloqueado} • Concluído ${statuses.concluido} • Meta: bloqueados = 0`;

  const outEl = document.getElementById('tmr-outliers');
  const out = (activities || [])
    .filter((a) => a.status === 'done' && a.createdAt && a.completedAt)
    .map((a) => ({ title: a.title || a.id, tmr: (new Date(a.completedAt) - new Date(a.createdAt)) / 36e5 }))
    .sort((a, b) => b.tmr - a.tmr)
    .slice(0, 5);
  if (outEl) outEl.innerHTML = out.map((o) => `<li><strong>${o.title}</strong> — ${o.tmr.toFixed(1)}h</li>`).join('') || '<li>Sem outliers relevantes.</li>';
  renderDashboardSignals();
}

function applyViewMode(mode, recordSignal = false) {
  const sections = document.querySelectorAll('[data-view]');
  sections.forEach((s) => {
    const val = s.getAttribute('data-view') || '';
    const show = val.includes(mode) || val.includes('executive operational');
    s.classList.toggle('view-hidden', !show);
  });

  const execBtn = document.getElementById('view-executive');
  const opBtn = document.getElementById('view-operational');
  if (execBtn && opBtn) {
    execBtn.setAttribute('aria-pressed', String(mode === 'executive'));
    opBtn.setAttribute('aria-pressed', String(mode === 'operational'));
  }

  if (recordSignal) {
    trackDashboardSignal('view', `toggle-${mode}`, { mode });
    renderDashboardSignals();
  }
}

function updateMetrics(tasks) {
  const humanTasks = tasks.filter((t) => t.mode === 'HUMAN');
  const blockedHuman = humanTasks.filter((t) => !Array.isArray(t.runbookSteps) || t.runbookSteps.length === 0);

  updateTrafficLight(tasks, humanTasks.length, blockedHuman.length);
  updateSlaPanel(tasks);
}

function updateTrafficLight(tasks, humanCount, blockedCount) {
  const dot = document.getElementById('traffic-dot');
  const label = document.getElementById('traffic-label');
  const reason = document.getElementById('traffic-reason');
  if (!dot || !label || !reason) return;

  const overdue = tasks.filter((t) => String(t.status || '').toLowerCase().includes('atras')).length;

  dot.classList.remove('traffic-green', 'traffic-yellow', 'traffic-red');

  if (blockedCount > 0 || overdue > 0) {
    dot.classList.add('traffic-red');
    label.textContent = 'Vermelho — Atenção imediata';
    reason.textContent = `Bloqueios HUMAN: ${blockedCount} | Itens atrasados: ${overdue}`;
    return;
  }

  if (humanCount >= 3) {
    dot.classList.add('traffic-yellow');
    label.textContent = 'Amarelo — Monitorar capacidade';
    reason.textContent = `Pendências HUMAN altas (${humanCount}). Recomenda-se priorizar desbloqueio.`;
    return;
  }

  dot.classList.add('traffic-green');
  label.textContent = 'Verde — Operação saudável';
  reason.textContent = 'Sem bloqueios críticos no filtro atual.';
}

function dotClassByStatus(status) {
  if (status === 'red') return 'dot-red';
  if (status === 'yellow') return 'dot-yellow';
  return 'dot-green';
}

function renderTrend(days) {
  const trend = document.getElementById('traffic-trend');
  const label = document.getElementById('traffic-trend-label');
  if (!trend || !label) return;

  const total = days.length || 1;
  const green = days.filter((d) => d.status === 'green').length;
  const yellow = days.filter((d) => d.status === 'yellow').length;
  const red = days.filter((d) => d.status === 'red').length;

  trend.innerHTML = '';
  const segments = [
    { cls: 'seg-trend-green', p: Math.round((green / total) * 100), title: `Green: ${green}` },
    { cls: 'seg-trend-yellow', p: Math.round((yellow / total) * 100), title: `Yellow: ${yellow}` },
    { cls: 'seg-trend-red', p: Math.round((red / total) * 100), title: `Red: ${red}` },
  ];

  segments.forEach((s) => {
    const el = document.createElement('div');
    el.className = s.cls;
    el.style.width = `${s.p}%`;
    el.title = s.title;
    trend.appendChild(el);
  });

  label.textContent = `Green ${green} • Yellow ${yellow} • Red ${red}`;
}

async function loadSemaphoreState() {
  const el = document.getElementById('traffic-consecutive');
  const historyEl = document.getElementById('traffic-history');
  if (!el) return;

  try {
    const state = await fetchJson('./data/semaphore-state.json');
    const days = Number(state.consecutiveRed || 0);
    el.textContent = `Dias consecutivos em vermelho: ${days}`;
  } catch {
    el.textContent = 'Dias consecutivos em vermelho: n/d';
  }

  if (!historyEl) return;
  try {
    const history = await fetchJson('./data/semaphore-history.json');
    const days = (history.days || []).slice(-7).map((d) => ({
      date: d.date,
      status: String(d.status || 'green').toLowerCase(),
    }));

    historyEl.innerHTML = '';
    days.forEach((d) => {
      const date = String(d.date || '').slice(5);
      const item = document.createElement('div');
      item.className = 'traffic-day';
      item.innerHTML = `<div class="dot ${dotClassByStatus(d.status)}"></div><div>${date}</div><div>${d.status.toUpperCase()}</div>`;
      historyEl.appendChild(item);
    });

    renderTrend(days);
  } catch {
    historyEl.innerHTML = '<div class="traffic-day">n/d</div>';
    renderTrend([]);
  }
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task';

  let runbookHtml = '';
  if (task.mode === 'HUMAN') {
    if (Array.isArray(task.runbookSteps) && task.runbookSteps.length > 0) {
      runbookHtml = `
        <details class="runbook">
          <summary>Passo a passo (HUMAN)</summary>
          <ol>${task.runbookSteps.map((s) => `<li>${s}</li>`).join('')}</ol>
          ${Array.isArray(task.expectedEvidence) && task.expectedEvidence.length > 0 ? `<p class="task-meta"><strong>Evidências:</strong> ${task.expectedEvidence.join(' • ')}</p>` : '<p class="task-meta"><strong>Evidências:</strong> não informadas</p>'}
        </details>
      `;
    } else {
      runbookHtml = `
        <div class="runbook-alert">
          ⚠️ Runbook ausente — atividade HUMAN bloqueada até detalhar passo a passo e evidências.
        </div>
      `;
    }
  }

  card.innerHTML = `
    <p class="task-title">${task.title || '-'}</p>
    <p class="task-desc">${task.description || ''}</p>
    <p class="task-meta">Projeto: ${task.project || '-'} • Responsável: ${task.owner || '-'} • Modo: ${task.mode || '-'}</p>
    <p class="task-meta">Status: ${task.status || '-'}</p>
    <p class="priority ${priorityClass(task.priority)}">Prioridade: ${task.priority || 'Baixa'}</p>
    ${runbookHtml}
  `;
  return card;
}

function appendTaskCardsIncremental(col, tasks, renderToken) {
  const batchSize = 10;
  let index = 0;

  function appendBatch() {
    if (renderToken !== kanbanRenderToken) return;
    const fragment = document.createDocumentFragment();
    const limit = Math.min(index + batchSize, tasks.length);
    for (; index < limit; index += 1) {
      fragment.appendChild(createTaskCard(tasks[index]));
    }
    col.appendChild(fragment);
    if (index < tasks.length) {
      window.requestAnimationFrame(appendBatch);
    }
  }

  appendBatch();
}

function renderKanban(data) {
  const board = document.getElementById('kanban-board');
  const summary = document.getElementById('kanban-summary');
  if (!board || !summary) return;

  kanbanRenderToken += 1;
  const currentRenderToken = kanbanRenderToken;
  board.innerHTML = '';

  let totalShown = 0;
  const shownTasks = [];
  const boardFragment = document.createDocumentFragment();

  for (const column of data.columns || []) {
    const tasks = filterTasks(column.tasks || []);
    shownTasks.push(...tasks);
    totalShown += tasks.length;

    const col = document.createElement('article');
    col.className = 'kanban-col';

    const title = document.createElement('h3');
    title.textContent = `${column.title} (${tasks.length})`;
    col.appendChild(title);

    if (!tasks.length) {
      const empty = document.createElement('p');
      empty.className = 'task-meta';
      empty.textContent = 'Sem itens no filtro atual.';
      col.appendChild(empty);
      boardFragment.appendChild(col);
      continue;
    }

    if (tasks.length > 12) {
      appendTaskCardsIncremental(col, tasks, currentRenderToken);
    } else {
      const taskFragment = document.createDocumentFragment();
      tasks.forEach((task) => taskFragment.appendChild(createTaskCard(task)));
      col.appendChild(taskFragment);
    }

    boardFragment.appendChild(col);
  }

  board.appendChild(boardFragment);
  summary.textContent = `Resumo: ${totalShown} atividade(s) visível(is) no filtro atual.`;
  renderCharts(shownTasks);
  updateMetrics(shownTasks);
  persistFiltersToURL();
}

function collectFilteredTasks(data) {
  const filtered = [];
  for (const column of data.columns || []) {
    filtered.push(...filterTasks(column.tasks || []));
  }
  return filtered;
}

function renderKanbanSummaryOnly(data) {
  const summary = document.getElementById('kanban-summary');
  const tasks = collectFilteredTasks(data);
  if (summary) summary.textContent = `Resumo: ${tasks.length} atividade(s) visível(is) no filtro atual.`;
  renderCharts(tasks);
  updateMetrics(tasks);
  renderWaveMonitor(data);
  persistFiltersToURL();
}

function renderWaveMonitor(data) {
  const summaryEl = document.getElementById('wave-monitor-summary');
  const focusEl = document.getElementById('wave-monitor-focus');
  const listEl = document.getElementById('wave-monitor-list');
  const stampEl = document.getElementById('wave-monitor-stamp');
  if (!summaryEl || !focusEl || !listEl || !stampEl) return;

  const tasks = (data.columns || []).flatMap((col) => col.tasks || []);
  const active = tasks.filter((task) => isWaveActiveStatus(task.status));
  const progressCount = active.filter((task) => normalize(task.status).includes('em progresso')).length;
  const validationCount = active.filter((task) => normalize(task.status).includes('em valida')).length;
  const focus = active.find((task) => isIssue022Wave(task)) || null;

  summaryEl.textContent = active.length
    ? `Ondas ativas: ${active.length} | Em progresso: ${progressCount} | Em validação: ${validationCount}`
    : 'Nenhuma wave ativa foi encontrada no kanban atual.';
  focusEl.textContent = focus
    ? `${extractIssueCode(focus.title) || 'ISSUE'} — ${focus.description || focus.title || 'Wave em foco'}`
    : 'Nenhuma wave em foco específico no momento.';
  stampEl.textContent = data.updatedAt
    ? `Atualizado em: ${formatBrtTimestamp(data.updatedAt) || 'n/d'}`
    : 'Atualizado em: n/d';

  const sorted = [...active].sort((a, b) => {
    const aFocus = isIssue022Wave(a) ? -1 : 0;
    const bFocus = isIssue022Wave(b) ? -1 : 0;
    if (aFocus !== bFocus) return aFocus - bFocus;
    return extractIssueNumber(a.title) - extractIssueNumber(b.title);
  });

  window.__waveMonitorData = {
    updatedAt: data.updatedAt || null,
    activeCount: active.length,
    progressCount,
    validationCount,
    focus: focus ? extractIssueCode(focus.title) : null,
  };

  if (!sorted.length) {
    listEl.innerHTML = '<li class="task-meta">Nenhuma wave ativa para acompanhar.</li>';
    return;
  }

  listEl.innerHTML = sorted.slice(0, 8).map((task) => {
    const issueCode = extractIssueCode(task.title) || 'ISSUE';
    const focusClass = isIssue022Wave(task) ? ' wave-focus' : '';
    const statusLabel = normalize(task.status).includes('valida') ? 'EM VALIDAÇÃO' : 'EM PROGRESSO';
    const owner = task.ownerPrimary || task.owner || '-';
    const project = task.project || '-';
    const kpi = task.valueKpi || 'n/d';
    const description = task.description || 'Sem descrição disponível.';

    return `
      <li class="wave-card${focusClass}">
        <div class="wave-card-head">
          <div>
            <p class="wave-card-title">${issueCode} · ${task.title || ''}</p>
            <p class="task-meta">Projeto: ${project} · Owner: ${owner}</p>
          </div>
          <span class="wave-pill">${statusLabel}${isIssue022Wave(task) ? ' • MONITORADA' : ''}</span>
        </div>
        <div class="wave-card-meta">
          <span class="wave-pill">KPI: ${kpi}</span>
          <span class="wave-pill">Categoria: ${task.categoryPrimary || 'n/d'}</span>
          <span class="wave-pill">Modo: ${task.mode || 'n/d'}</span>
        </div>
        <p class="wave-card-desc">${description}</p>
      </li>
    `;
  }).join('');
}

function renderCommercialFunnel(data) {
  const summaryEl = document.getElementById('commercial-funnel-summary');
  const metaEl = document.getElementById('commercial-funnel-meta');
  const stampEl = document.getElementById('commercial-funnel-stamp');
  const stagesEl = document.getElementById('commercial-funnel-stages');
  const actionsEl = document.getElementById('commercial-funnel-actions');
  const insightsEl = document.getElementById('icp-insights-list');
  const primaryCta = document.getElementById('commercial-funnel-primary-cta');
  const secondaryCta = document.getElementById('commercial-funnel-secondary-cta');
  if (!summaryEl || !metaEl || !stagesEl || !actionsEl || !insightsEl) return;

  const funnel = data?.commercialFunnel || {};
  const kpis = data?.kpis || {};
  const coverage = Number(kpis.funnelAndJtbdCoveragePct || 0);
  const eligibleAutoTasks = Number(kpis.eligibleAutoTasks || 0);

  const formatStamp = (value) => {
    if (!value) return 'Atualizado em: n/d';
    const dt = new Date(value);
    return Number.isNaN(dt.getTime())
      ? 'Atualizado em: n/d'
      : `Atualizado em: ${dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`;
  };

  summaryEl.textContent = funnel.summary || 'Carregando leitura comercial...';
  metaEl.textContent = `Cobertura JTBD: ${coverage.toFixed(0)}% • Ações automáticas elegíveis: ${eligibleAutoTasks}`;
  if (stampEl) stampEl.textContent = formatStamp(data?.updatedAt);

  const primary = funnel.primaryCta || {};
  const secondary = funnel.secondaryCta || {};
  if (primaryCta) {
    primaryCta.href = primary.href || '../index.html#diagnostico-roi';
    primaryCta.textContent = primary.label || 'Abrir diagnostico 60s';
  }
  if (secondaryCta) {
    secondaryCta.href = secondary.href || '../index.html#solucoes-especializadas';
    secondaryCta.textContent = secondary.label || 'Ver solucoes';
  }

  const stages = Array.isArray(funnel.stages) && funnel.stages.length > 0
    ? funnel.stages
    : [
        {
          label: 'Descoberta',
          detail: 'Identificar o ICP com dor mais clara e sinal de urgencia.',
          signal: 'Alinhar a leitura do problema antes da proposta.',
        },
        {
          label: 'Qualificacao',
          detail: 'Priorizar a oportunidade com base em JTBD, fit e volume.',
          signal: 'Reduzir ruido e focar o tempo do analista.',
        },
        {
          label: 'Proposta',
          detail: 'Encaminhar o proximo passo com CTA e contexto suficientes.',
          signal: 'Encurtar o caminho ate contato e decisao.',
        },
      ];

  stagesEl.innerHTML = '';
  stages.forEach((stage) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = stage.label || 'Etapa';
    item.appendChild(title);

    if (stage.detail) {
      const detail = document.createElement('span');
      detail.textContent = stage.detail;
      item.appendChild(detail);
    }

    const signal = document.createElement('span');
    signal.className = 'funnel-stage-signal';
    signal.textContent = stage.signal || 'Sem sinal adicional.';
    item.appendChild(signal);
    stagesEl.appendChild(item);
  });

  const nextActions = Array.isArray(data?.nextActions) && data.nextActions.length > 0
    ? data.nextActions
    : [
        'Atualizar sintese JTBD com as entrevistas da semana.',
        'Revisar a variacao de conversao por ICP no proximo ciclo.',
      ];

  actionsEl.innerHTML = '';
  nextActions.forEach((action) => {
    const item = document.createElement('li');
    item.textContent = action;
    actionsEl.appendChild(item);
  });

  const icpInsights = Array.isArray(funnel.icpInsights) && funnel.icpInsights.length > 0
    ? funnel.icpInsights
    : [
        {
          label: 'Automacao de WhatsApp',
          summary: 'ICP com alto volume de atendimento e follow-up manual.',
          ctaLabel: 'Ver solucao',
          href: '../solucoes/whatsapp-automation.html',
        },
        {
          label: 'Enrichment B2B',
          summary: 'ICP com base de leads incompleta e baixa priorizacao.',
          ctaLabel: 'Ver solucao',
          href: '../solucoes/openalex-enrichment.html',
        },
        {
          label: 'BI executivo',
          summary: 'ICP que precisa de previsibilidade e decisao por KPI.',
          ctaLabel: 'Ver solucao',
          href: '../solucoes/business-intelligence.html',
        },
      ];

  insightsEl.innerHTML = '';
  icpInsights.forEach((insight) => {
    const card = document.createElement('article');
    card.className = 'icp-card';

    const title = document.createElement('h4');
    title.textContent = insight.label || 'ICP';
    card.appendChild(title);

    const summary = document.createElement('p');
    summary.textContent = insight.summary || '';
    card.appendChild(summary);

    const link = document.createElement('a');
    link.className = 'btn btn-secondary';
    link.href = insight.href || '../index.html#contato';
    link.textContent = insight.ctaLabel || 'Ver detalhe';
    card.appendChild(link);

    insightsEl.appendChild(card);
  });
}

async function loadCommercialFunnel() {
  const summaryEl = document.getElementById('commercial-funnel-summary');
  const metaEl = document.getElementById('commercial-funnel-meta');
  const stampEl = document.getElementById('commercial-funnel-stamp');

  try {
    const data = await fetchJson('./data/jtbd-weekly-kpis.json');
    renderCommercialFunnel(data);
  } catch {
    renderCommercialFunnel({});
    if (summaryEl) summaryEl.textContent = 'Nao foi possivel carregar a leitura comercial.';
    if (metaEl) metaEl.textContent = 'Cobertura JTBD: n/d';
    if (stampEl) stampEl.textContent = 'Atualizado em: erro de leitura';
  }
}

function populateSelect(data, selectId, valueSelector) {
  const select = document.getElementById(selectId);
  const values = new Set();

  for (const col of data.columns || []) {
    for (const task of col.tasks || []) {
      const value = valueSelector(task);
      if (value) values.add(value);
    }
  }

  for (const value of [...values].sort()) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  }
}

function clearFilters() {
  document.getElementById('filter-owner').value = '';
  document.getElementById('filter-project').value = '';
  document.getElementById('filter-mode').value = '';
  document.getElementById('filter-priority').value = '';
  document.getElementById('filter-search').value = '';
  trackDashboardSignal('filter', 'clear-filters', { source: 'kanban' });
  renderCurrentKanban();
  renderDashboardSignals();
}

function downloadWeeklyReport() {
  trackDashboardSignal('export', 'weekly-report', { scope: 'kanban' });
  renderDashboardSignals();
  if (!kanbanData) return;
  const lines = [];
  lines.push('LF Soluções - Resumo Semanal de Atividades');
  lines.push(`Gerado em UTC: ${new Date().toISOString()}`);
  lines.push('');

  for (const col of kanbanData.columns || []) {
    const tasks = filterTasks(col.tasks || []);
    lines.push(`## ${col.title} (${tasks.length})`);
    tasks.forEach((t, i) => {
      lines.push(`${i + 1}. ${t.title}`);
      lines.push(`   Projeto: ${t.project || '-'} | Responsável: ${t.owner || '-'} | Modo: ${t.mode || '-'} | Prioridade: ${t.priority || 'Baixa'} | Status: ${t.status || '-'}`);
    });
    if (!tasks.length) lines.push('   (Sem itens no filtro atual)');
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resumo-semanal-kanban-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchJson(path) {
  const now = Date.now();
  const cached = DATA_CACHE.get(path);
  if (cached && (now - cached.ts) < DATA_CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Falha ao carregar ${path}`);
  const data = await response.json();
  DATA_CACHE.set(path, { ts: now, data });
  return data;
}

function getAllKanbanTasks() {
  return (kanbanData?.columns || []).flatMap((c) => c.tasks || []);
}

function renderCurrentKanban() {
  if (!kanbanData) return;
  renderKanban(kanbanData);
  renderWaveMonitor(kanbanData);
  kanbanBoardHydrated = true;
}

async function refreshDecisionLayers(tasks, options = {}) {
  const deferAnalytics = options.deferAnalytics !== false;
  try {
    const [deployData, autopilotData, autonomyData, activitiesData] = await Promise.all([
      fetchJson('./data/deploy-status.json'),
      fetchJson('./data/autopilot-sla.json'),
      fetchJson('./data/autonomy-state.json').catch(() => ({})),
      fetchJson('./data/activities-history.json'),
    ]);

    const activities = activitiesData.activities || [];
    renderAutonomyState(autonomyData);
    renderStrategicKpis(tasks, deployData, autopilotData, activities);
    renderOperationalAlerts(tasks, deployData);
    if (deferAnalytics) {
      scheduleLowPriority(() => renderAnalyticalLayer(tasks, activities), 150);
    } else {
      renderAnalyticalLayer(tasks, activities);
    }

    const lu = document.getElementById('last-updated-global');
    if (lu) {
      const ts = [autopilotData.updatedAt, deployData.updatedAt, autonomyData.updatedAt, activitiesData.updatedAt].filter(Boolean).sort().slice(-1)[0];
      lu.textContent = ts ? `Última atualização: ${new Date(ts).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT` : 'Última atualização: n/d';
    }
    renderDashboardSignals();
  } catch {
    const lu = document.getElementById('last-updated-global');
    if (lu) lu.textContent = 'Última atualização: erro de leitura';
    renderAutonomyState({});
  }
}

async function loadKanban(options = {}) {
  const shouldRenderBoard = options.renderBoard !== false;
  const board = document.getElementById('kanban-board');
  const stamp = document.getElementById('kanban-updated-at');

  try {
    const incoming = await fetchJson('./data/kanban.json');
    const firstLoad = !kanbanData;
    kanbanData = incoming;

    if (firstLoad) {
      populateSelect(kanbanData, 'filter-owner', (task) => task.owner);
      populateSelect(kanbanData, 'filter-project', (task) => task.project);
      applyFiltersFromURL();
    }

    if (shouldRenderBoard || kanbanBoardHydrated) {
      renderCurrentKanban();
    } else {
      renderKanbanSummaryOnly(kanbanData);
    }
    await refreshDecisionLayers(getAllKanbanTasks());

    if (kanbanData.updatedAt) {
      const dt = new Date(kanbanData.updatedAt);
      stamp.textContent = `Atualizado em: ${dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`;
    } else {
      stamp.textContent = 'Atualizado em: n/d';
    }
  } catch (error) {
    board.innerHTML = '<article class="kanban-col"><h3>Erro</h3><p class="task-meta">Não foi possível carregar o kanban.</p></article>';
    stamp.textContent = 'Atualizado em: erro de leitura';
  }
}

['filter-owner', 'filter-project', 'filter-mode', 'filter-priority'].forEach((id) => {
  document.getElementById(id).addEventListener('change', () => {
    trackDashboardSignal('filter', `kanban-${id}`, { value: document.getElementById(id).value });
    renderCurrentKanban();
    renderDashboardSignals();
  });
});

document.getElementById('filter-search').addEventListener('input', debounce(() => {
  const search = document.getElementById('filter-search');
  trackDashboardSignal('filter', 'kanban-search', { value: search ? search.value.trim().slice(0, 80) : '' });
  renderCurrentKanban();
  renderDashboardSignals();
}, 130));

document.getElementById('clear-filters').addEventListener('click', clearFilters);

const execBtn = document.getElementById('view-executive');
const opBtn = document.getElementById('view-operational');
if (execBtn && opBtn) {
  execBtn.addEventListener('click', () => applyViewMode('executive', true));
  opBtn.addEventListener('click', () => applyViewMode('operational', true));
  applyViewMode('operational');
}

const trendPeriodEl = document.getElementById('trend-period');
const trendTeamEl = document.getElementById('trend-team');
if (trendPeriodEl) trendPeriodEl.addEventListener('change', () => {
  trackDashboardSignal('filter', 'trend-period', { value: trendPeriodEl.value });
  if (kanbanData) refreshDecisionLayers(getAllKanbanTasks());
  renderDashboardSignals();
});
if (trendTeamEl) trendTeamEl.addEventListener('change', () => {
  trackDashboardSignal('filter', 'trend-team', { value: trendTeamEl.value });
  if (kanbanData) refreshDecisionLayers(getAllKanbanTasks());
  renderDashboardSignals();
});
const thresholdEl = document.getElementById('alert-threshold-hours');
if (thresholdEl) thresholdEl.addEventListener('change', () => {
  trackDashboardSignal('filter', 'alert-threshold-hours', { value: thresholdEl.value });
  if (kanbanData) refreshDecisionLayers(getAllKanbanTasks());
  renderDashboardSignals();
});

async function loadHandoff() {
  const target = document.getElementById('handoff-content');
  const updated = document.getElementById('handoff-updated');
  if (!target || !updated) return;

  try {
    const data = await fetchJson('./data/handoff.json');

    updated.textContent = `Atualizado em: ${formatBrtTimestamp(extractUpdatedAt(data)) || 'n/d'}`;

    const jobsMetric = document.getElementById('metric-jobs');
    if (jobsMetric) {
      const n = Number(data.automation?.activeJobCount || (data.automation?.supportJobs || []).length || 0);
      jobsMetric.textContent = String(n);
    }

    const projects = (data.projects || []).map((p) => {
      const repoLink = p.repo ? ` — <a href="${p.repo}" target="_blank" rel="noreferrer">repo</a>` : '';
      const latestCommit = p.latestCommit ? ` — último commit ${renderCommitReference(p.latestCommit)}` : '';
      return `<li><strong>${p.name}</strong> — ${p.status}${repoLink}${latestCommit}</li>`;
    }).join('');
    // const team = (data.team?.roles || []).map((r) => `<li>${r}</li>`).join(''); // REMOVED
    const categoriesObj = data.team?.categories || {};
    const categories = Object.keys(categoriesObj).length
      ? Object.entries(categoriesObj).map(([name, roles]) => `<li><strong>${name}</strong><ul>${(roles || []).map((r) => `<li>${r}</li>`).join('')}</ul></li>`).join('')
      : '';
    const daily = (data.automation?.daily || []).map((x) => `<li>${x}</li>`).join('');
    const weekly = (data.automation?.weekly || []).map((x) => `<li>${x}</li>`).join('');
    const checklist = (data.handoffChecklist || []).map((x) => `<li>${x}</li>`).join('');
    const capability = data.team?.capabilityControl || {};
    const requiredFields = (capability.requiredTaskFields || []).map((f) => `<li>${f}</li>`).join('');
    const recentAdvances = Array.isArray(data.recentAdvances) ? data.recentAdvances.slice(0, 4) : [];
    const recentAdvancesHtml = recentAdvances.length
      ? recentAdvances.map((entry) => {
          const stamp = formatBrtTimestamp(entry.at) || entry.at || 'n/d';
          const items = Array.isArray(entry.items) ? entry.items : [];
          return `<li><strong>${stamp}</strong><ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul></li>`;
        }).join('')
      : '<li class="task-meta">Sem avanços recentes registrados.</li>';

    target.innerHTML = `
      <div class="handoff-block">
        <h3>Objetivo do programa</h3>
        <p class="task-meta">${data.program?.objective || '-'}</p>
      </div>
      <div class="handoff-block">
        <h3>Projetos e status</h3>
        <ul>${projects}</ul>
      </div>
      <div class="handoff-block">
        <h3>Especialistas por categoria</h3>
        ${categories ? `<ul>${categories}</ul>` : '<p class="task-meta">Sem categorização disponível.</p>'}
      </div>
      <div class="handoff-block">
        <h3>Rotinas automáticas</h3>
        <p class="task-meta"><strong>Diárias</strong></p>
        <ul>${daily}</ul>
        <p class="task-meta" style="margin-top:8px;"><strong>Semanais</strong></p>
        <ul>${weekly}</ul>
      </div>
      <div class="handoff-block">
        <h3>Controle de capacidade e função</h3>
        <ul>
          <li>Matriz: ${capability.matrix || 'n/d'}</li>
          <li>Alocação ativa: ${capability.allocation || 'n/d'}</li>
          <li>Roteamento: ${capability.routing || 'n/d'}</li>
        </ul>
        <p class="task-meta"><strong>Campos obrigatórios por task</strong></p>
        <ul>${requiredFields}</ul>
      </div>
      <div class="handoff-block">
        <h3>Checklist de transição</h3>
        <ul>${checklist}</ul>
      </div>
      <div class="handoff-block">
        <h3>Últimos avanços</h3>
        <ul>${recentAdvancesHtml}</ul>
      </div>
    `;

    window.__handoffData = data;
  } catch {
    updated.textContent = 'Atualizado em: erro de leitura';
    target.innerHTML = '<div class="handoff-block"><p class="task-meta">Não foi possível carregar o contexto de handoff.</p></div>';
  }
}

async function loadRepoProgress() {
  const summaryEl = document.getElementById('repo-sync-summary');
  const listEl = document.getElementById('repo-sync-list');
  const stampEl = document.getElementById('repo-sync-stamp');
  if (!summaryEl || !listEl || !stampEl) return;

  try {
    const data = await fetchJson('./data/product-code-progress.json');
    const repos = Array.isArray(data.repos) ? data.repos : [];
    const okCount = repos.filter((r) => r.status === 'ok').length;
    const staleCount = repos.filter((r) => r.status !== 'ok').length;
    const ts = extractUpdatedAt(data);

    summaryEl.textContent = `Repos monitorados: ${repos.length} | OK: ${okCount} | Com atraso: ${staleCount}`;
    stampEl.textContent = ts ? `Atualizado em: ${formatBrtTimestamp(ts)}` : 'Atualizado em: n/d';

    listEl.innerHTML = repos.map((repo) => {
      const status = String(repo.status || 'n/d');
      const badge = status === 'ok' ? '🟢' : (status === 'stale' ? '🟡' : '🔴');
      const commit = repo.last_commit || {};
      const shortSha = commit.sha ? commit.sha.slice(0, 7) : 'n/d';
      const age = typeof commit.age_hours === 'number' ? `${commit.age_hours.toFixed(1)}h` : 'n/d';
      const branch = repo.branch ? `branch ${repo.branch}` : 'branch n/d';
      const commits48h = typeof repo.commits_48h === 'number' ? `${repo.commits_48h}/48h` : 'n/d';
      const ahead = typeof repo.ahead_main === 'number' && typeof repo.behind_main === 'number'
        ? `${repo.ahead_main}/${repo.behind_main}`
        : 'n/d';
      const worktree = typeof repo.worktree_changes === 'number'
        ? (repo.worktree_changes === 0 ? 'clean' : `dirty:${repo.worktree_changes}`)
        : 'n/d';
      const prs = typeof repo.open_prs === 'number' ? `${repo.open_prs}` : 'n/d';
      const subject = commit.subject || '';
      return `<li><strong>${badge} ${repo.repo}</strong> — ${status} | ${branch} | <code>${shortSha}</code> ${subject} | age ${age} | 48h ${commits48h} | ahead/behind ${ahead} | PRs ${prs} | worktree ${worktree}</li>`;
    }).join('');

    if (!listEl.innerHTML) {
      listEl.innerHTML = '<li>Sem dados de progresso dos repositórios.</li>';
    }
  } catch {
    summaryEl.textContent = 'Erro ao carregar progresso dos repositórios.';
    stampEl.textContent = 'Atualizado em: erro de leitura';
    listEl.innerHTML = '<li>Não foi possível carregar o snapshot de repositórios.</li>';
  }
}

function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function renderSlaWeeklyBars(weekStats, targetPct) {
  const container = document.getElementById('sla-weekly-bars');
  if (!container) return;
  container.innerHTML = '';

  const keys = Object.keys(weekStats).sort().slice(-4);
  keys.forEach((wk) => {
    const stat = weekStats[wk];
    const pctVal = Number(stat.pct || 0);
    const row = document.createElement('div');
    row.className = 'sla-week-row';
    row.innerHTML = `
      <span class="task-meta">${wk}</span>
      <div class="sla-week-bar-wrap"><div class="sla-week-bar" style="width:${Math.min(100, Math.max(0, pctVal))}%"></div></div>
      <span class="task-meta">${pctVal.toFixed(0)}%</span>
    `;
    container.appendChild(row);
  });

  if (!keys.length) {
    container.innerHTML = '<p class="task-meta">Sem histórico suficiente.</p>';
  }
}

function renderMetricsHistory(data) {
  const summaryEl = document.getElementById('metrics-history-summary');
  const listEl = document.getElementById('metrics-history-list');
  const stampEl = document.getElementById('metrics-history-stamp');
  const openEl = document.getElementById('metrics-history-open');
  const openDeltaEl = document.getElementById('metrics-history-open-delta');
  const completedEl = document.getElementById('metrics-history-completed');
  const completedDeltaEl = document.getElementById('metrics-history-completed-delta');
  const greenEl = document.getElementById('metrics-history-green');
  const greenDeltaEl = document.getElementById('metrics-history-green-delta');
  const alertsEl = document.getElementById('metrics-history-alerts');
  const alertsDeltaEl = document.getElementById('metrics-history-alerts-delta');
  const healthEl = document.getElementById('metrics-history-health');
  const humanOpenEl = document.getElementById('metrics-history-human-open');
  const humanOpenDeltaEl = document.getElementById('metrics-history-human-open-delta');

  const snapshots = Array.isArray(data?.snapshots) ? data.snapshots : [];
  if (stampEl) {
    stampEl.textContent = data?.updatedAt
      ? `${new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`
      : 'n/d';
  }

  if (!snapshots.length) {
    if (summaryEl) summaryEl.textContent = 'Sem histórico persistido ainda.';
    if (listEl) listEl.innerHTML = '<li>Sem snapshots disponíveis.</li>';
    if (openEl) openEl.textContent = '—';
    if (completedEl) completedEl.textContent = '—';
    if (greenEl) greenEl.textContent = '—';
    if (alertsEl) alertsEl.textContent = '—';
    if (healthEl) healthEl.textContent = '—';
    if (humanOpenEl) humanOpenEl.textContent = '—';
    return;
  }

  const latest = snapshots[0];
  const previous = snapshots[1] || null;
  const board = latest.board || {};
  const deploy = latest.deploy || {};
  const alertRepos = Number(deploy.yellowRepos || 0) + Number(deploy.redRepos || 0);

  if (summaryEl) {
    summaryEl.textContent = `Snapshot atual: ${Number(board.openIssues || 0)} abertas | ${Number(board.completedIssues || 0)} concluídas | ${Number(deploy.greenRepos || 0)} verdes | ${alertRepos} em alerta`;
  }

  if (openEl) openEl.textContent = String(Number(board.openIssues || 0));
  if (completedEl) completedEl.textContent = String(Number(board.completedIssues || 0));
  if (greenEl) greenEl.textContent = String(Number(deploy.greenRepos || 0));
  if (alertsEl) alertsEl.textContent = String(alertRepos);
  if (healthEl) healthEl.textContent = `${Number(deploy.healthPct || 0).toFixed(1)}%`;
  if (humanOpenEl) humanOpenEl.textContent = String(Number(board.humanOpenIssues || 0));

  const prevBoard = previous?.board || {};
  const prevDeploy = previous?.deploy || {};
  const prevAlertRepos = Number(prevDeploy.yellowRepos || 0) + Number(prevDeploy.redRepos || 0);

  if (openDeltaEl) openDeltaEl.textContent = previous ? `Δ ${Number(board.openIssues || 0) - Number(prevBoard.openIssues || 0)}` : 'Δ baseline';
  if (completedDeltaEl) completedDeltaEl.textContent = previous ? `Δ ${Number(board.completedIssues || 0) - Number(prevBoard.completedIssues || 0)}` : 'Δ baseline';
  if (greenDeltaEl) greenDeltaEl.textContent = previous ? `Δ ${Number(deploy.greenRepos || 0) - Number(prevDeploy.greenRepos || 0)}` : 'Δ baseline';
  if (alertsDeltaEl) alertsDeltaEl.textContent = previous ? `Δ ${alertRepos - prevAlertRepos}` : 'Δ baseline';
  if (humanOpenDeltaEl) humanOpenDeltaEl.textContent = previous ? `Δ ${Number(board.humanOpenIssues || 0) - Number(prevBoard.humanOpenIssues || 0)}` : 'Δ baseline';

  if (listEl) {
    listEl.innerHTML = snapshots.slice(0, 5).map((snapshot, index) => {
      const boardSnap = snapshot.board || {};
      const deploySnap = snapshot.deploy || {};
      const nextSnap = snapshots[index + 1] || null;
      const open = Number(boardSnap.openIssues || 0);
      const completed = Number(boardSnap.completedIssues || 0);
      const green = Number(deploySnap.greenRepos || 0);
      const red = Number(deploySnap.redRepos || 0);
      const humanOpen = Number(boardSnap.humanOpenIssues || 0);
      const deltaOpen = nextSnap ? open - Number(nextSnap.board?.openIssues || 0) : 0;
      const deltaCompleted = nextSnap ? completed - Number(nextSnap.board?.completedIssues || 0) : 0;
      const deltaGreen = nextSnap ? green - Number(nextSnap.deploy?.greenRepos || 0) : 0;
      const deltaRed = nextSnap ? red - Number(nextSnap.deploy?.redRepos || 0) : 0;
      const captured = snapshot.capturedAt
        ? new Date(snapshot.capturedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : 'n/d';
      return `
        <li class="metrics-history-item">
          <div class="metrics-history-head">
            <strong>${captured}</strong>
            <span class="badge">${snapshot.commit || 'WORKTREE'}</span>
          </div>
          <p class="task-meta">
            Abertas: ${open} (${deltaOpen >= 0 ? '+' : ''}${deltaOpen}) |
            Concluídas: ${completed} (${deltaCompleted >= 0 ? '+' : ''}${deltaCompleted}) |
            Verdes: ${green} (${deltaGreen >= 0 ? '+' : ''}${deltaGreen}) |
            Vermelhos: ${red} (${deltaRed >= 0 ? '+' : ''}${deltaRed}) |
            HUMAN open: ${humanOpen}
          </p>
          <div class="stacked-bar metrics-history-bar" aria-hidden="true">
            <span class="seg-trend-green" style="width:${Math.min(100, Math.max(0, Number(boardSnap.completionPct || 0)))}%"></span>
            <span class="seg-trend-yellow" style="width:${Math.max(0, 100 - Math.min(100, Math.max(0, Number(boardSnap.completionPct || 0))))}%"></span>
          </div>
        </li>
      `;
    }).join('');
  }
}

function computeSlaFromHistory(historyActivities, targetPct) {
  const doneHuman = (historyActivities || []).filter((a) => a.mode === 'HUMAN' && a.status === 'done' && a.createdAt && a.completedAt);
  const weekStats = {};

  doneHuman.forEach((a) => {
    const created = new Date(a.createdAt);
    const completed = new Date(a.completedAt);
    const hours = (completed - created) / 36e5;
    const within = hours <= Number(a.slaHours || 0);
    const wk = isoWeekKey(completed);
    if (!weekStats[wk]) weekStats[wk] = { total: 0, within: 0, pct: 0 };
    weekStats[wk].total += 1;
    if (within) weekStats[wk].within += 1;
    weekStats[wk].pct = weekStats[wk].total ? (weekStats[wk].within / weekStats[wk].total) * 100 : 0;
  });

  const latestWeek = Object.keys(weekStats).sort().slice(-1)[0];
  const actual = latestWeek ? Number(weekStats[latestWeek].pct) : 0;
  const status = actual >= targetPct ? '✅ Meta atingida' : '⚠️ Abaixo da meta';

  return { actual, status, weekStats, doneHuman };
}

function computeFlowFromHistory(historyActivities) {
  const doneHuman = (historyActivities || []).filter((a) => a.mode === 'HUMAN' && a.status === 'done' && a.createdAt && a.completedAt);
  const last7Cutoff = Date.now() - (7 * 24 * 36e5);

  const leadTimes = doneHuman.map((a) => (new Date(a.completedAt) - new Date(a.createdAt)) / 36e5);
  const leadAvg = leadTimes.length ? leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length : 0;

  const throughput7d = doneHuman.filter((a) => new Date(a.completedAt).getTime() >= last7Cutoff).length;

  const reopenedSum = doneHuman.reduce((s, a) => s + Number(a.reopened || 0), 0);
  const reworkPct = doneHuman.length ? (reopenedSum / doneHuman.length) * 100 : 0;

  const blockedAvg = doneHuman.length
    ? doneHuman.reduce((s, a) => s + Number(a.blockedHours || 0), 0) / doneHuman.length
    : 0;

  return { leadAvg, throughput7d, reworkPct, blockedAvg, doneHuman };
}

function computeHumanRisk(historyActivities) {
  const now = Date.now();
  const human = (historyActivities || []).filter((a) => a.mode === 'HUMAN');
  const openHuman = human.filter((a) => a.status === 'open' && a.createdAt);
  const doneHuman = human.filter((a) => a.status === 'done' && a.createdAt && a.completedAt);

  // Fator 1: proximidade de SLA (0-100)
  const nearSlaCount = openHuman.filter((a) => {
    const elapsed = (now - new Date(a.createdAt).getTime()) / 36e5;
    const ratio = Number(a.slaHours || 1) > 0 ? elapsed / Number(a.slaHours) : 0;
    return ratio >= 0.8;
  }).length;
  const f1 = openHuman.length ? (nearSlaCount / openHuman.length) * 100 : 0;

  // Fator 2: volume aberto acima da média diária histórica (últimos 14d)
  const cutoff14 = now - (14 * 24 * 36e5);
  const done14 = doneHuman.filter((a) => new Date(a.completedAt).getTime() >= cutoff14).length;
  const avgPerDay = done14 / 14;
  const volumeRatio = avgPerDay > 0 ? openHuman.length / avgPerDay : openHuman.length;
  const f2 = Math.min(100, Math.max(0, (volumeRatio - 1) * 100));

  // Fator 3: concentração crítica (prioridade alta em aberto)
  const criticalOpen = openHuman.filter((a) => String(a.priority || '').toLowerCase() === 'alta').length;
  const f3 = openHuman.length ? (criticalOpen / openHuman.length) * 100 : 0;

  // Fator 4: reincidência de incidentes (reaberturas)
  const reopenedSum = doneHuman.reduce((s, a) => s + Number(a.reopened || 0), 0);
  const f4 = doneHuman.length ? Math.min(100, (reopenedSum / doneHuman.length) * 100) : 0;

  const score = Math.round((0.30 * f1) + (0.25 * f2) + (0.25 * f3) + (0.20 * f4));

  // tendência simples: comparar 7d recente vs 7d anterior (lead time)
  const recentCut = now - (7 * 24 * 36e5);
  const prevCut = now - (14 * 24 * 36e5);
  const recent = doneHuman.filter((a) => new Date(a.completedAt).getTime() >= recentCut);
  const previous = doneHuman.filter((a) => {
    const t = new Date(a.completedAt).getTime();
    return t >= prevCut && t < recentCut;
  });
  const avg = (arr) => arr.length ? arr.reduce((s, a) => s + ((new Date(a.completedAt) - new Date(a.createdAt)) / 36e5), 0) / arr.length : 0;
  const recentAvg = avg(recent);
  const prevAvg = avg(previous);
  const trend = prevAvg > 0 && recentAvg > prevAvg * 1.1 ? 'degrading' : (recentAvg > 0 ? 'stable' : 'insufficient-data');

  return { score, trend, factors: { f1, f2, f3, f4 } };
}

async function loadOpsAnalytics() {
  const updated = document.getElementById('ops-analytics-updated');
  try {
    const [data, history] = await Promise.all([
      fetchJson('./data/ops-analytics.json'),
      fetchJson('./data/activities-history.json').catch(() => ({ activities: [] })),
    ]);

    if (updated) {
      updated.textContent = `Atualizado em: ${new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`;
    }

    const flow = computeFlowFromHistory(history.activities || []);
    document.getElementById('ops-lead-time').textContent = `${Number(flow.leadAvg || 0).toFixed(1)}h`;
    document.getElementById('ops-throughput').textContent = `${flow.throughput7d || 0}/7d`;
    document.getElementById('ops-rework').textContent = `${Number(flow.reworkPct || 0).toFixed(1)}%`;

    const risk = computeHumanRisk(history.activities || []);
    document.getElementById('ops-risk-score').textContent = `${risk.score}/100`;
    document.getElementById('ops-risk-trend').textContent = `Tendência: ${risk.trend}`;

    document.getElementById('ops-cognitive').textContent = `${data.diagnostic?.cognitiveLoad?.weightedEffortTotal || 0} pts`;
    const doneHuman = flow.doneHuman || [];
    const reopenedAny = doneHuman.filter((a) => Number(a.reopened || 0) > 0).length;
    const reopenRate = doneHuman.length ? (reopenedAny / doneHuman.length) * 100 : 0;
    document.getElementById('ops-quality').textContent = `${reopenRate.toFixed(1)}% reopen | bloqueio médio ${flow.blockedAvg.toFixed(1)}h`;

    const target = Number(data.sla?.targetWeeklyPct || 85);
    const computed = computeSlaFromHistory(history.activities || [], target);
    const slaEl = document.getElementById('sla-weekly');
    if (slaEl) {
      slaEl.textContent = `Cumprimento semanal: ${computed.actual.toFixed(1)}% | Meta: ${target.toFixed(1)}% — ${computed.status}`;
    }
    renderSlaWeeklyBars(computed.weekStats, target);

    const alertsEl = document.getElementById('ops-predictive-alerts');
    const alerts = data.predictive?.alerts || [];
    const predictiveDerived = [];
    if (risk.score >= 70) predictiveDerived.push('Risco humano composto alto (>=70): revisar capacidade e WIP imediatamente.');
    else if (risk.score >= 40) predictiveDerived.push('Risco humano composto moderado (>=40): monitorar SLA e reduzir carga crítica.');
    if (flow.leadAvg > 24) predictiveDerived.push('Lead time médio acima de 24h: revisar gargalos de aprovação e validação.');
    const corrective = data.sla?.correctiveRule ? [`Regra corretiva: ${data.sla.correctiveRule}`] : [];
    const merged = [...alerts, ...predictiveDerived, ...corrective];
    alertsEl.innerHTML = merged.length
      ? merged.map((a) => `<li>${a}</li>`).join('')
      : '<li>Sem alertas preditivos no momento.</li>';
  } catch {
    if (updated) updated.textContent = 'Atualizado em: erro de leitura';
    const alertsEl = document.getElementById('ops-predictive-alerts');
    if (alertsEl) alertsEl.innerHTML = '<li>Não foi possível carregar analytics avançado.</li>';
  }
}

async function loadAutopilotSla() {
  try {
    const data = await fetchJson('./data/autopilot-sla.json');
    const k = data.kpis || {};

    const completionEl = document.getElementById('autopilot-completion');
    const runsEl = document.getElementById('autopilot-runs');
    const durationEl = document.getElementById('autopilot-duration');
    const interruptionsEl = document.getElementById('autopilot-interruptions');
    const humanEl = document.getElementById('autopilot-human');
    const updatedEl = document.getElementById('autopilot-updated');

    if (completionEl) completionEl.textContent = `${Number(k.cycleCompletionPct || 0).toFixed(1)}%`;
    if (runsEl) runsEl.textContent = `Runs: ${k.cyclesRun || 0} | Concluídos: ${k.cyclesCompleted || 0}`;
    if (durationEl) durationEl.textContent = `${Number(k.avgCycleDurationMinutes || 0).toFixed(1)} min`;
    if (interruptionsEl) interruptionsEl.textContent = `Interrupções: ${k.cyclesInterrupted || 0}`;
    if (humanEl) humanEl.textContent = `${k.humanInterventionCount || 0}`;
    if (updatedEl) updatedEl.textContent = `Atualizado em: ${new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`;
  } catch {
    const completionEl = document.getElementById('autopilot-completion');
    const runsEl = document.getElementById('autopilot-runs');
    const durationEl = document.getElementById('autopilot-duration');
    const interruptionsEl = document.getElementById('autopilot-interruptions');
    const humanEl = document.getElementById('autopilot-human');
    const updatedEl = document.getElementById('autopilot-updated');

    if (completionEl) completionEl.textContent = '—';
    if (runsEl) runsEl.textContent = 'Runs: n/d';
    if (durationEl) durationEl.textContent = '—';
    if (interruptionsEl) interruptionsEl.textContent = 'Interrupções: n/d';
    if (humanEl) humanEl.textContent = '—';
    if (updatedEl) updatedEl.textContent = 'Atualizado em: erro de leitura';
  }
}

async function loadDeployStatus() {
  const updatedEl = document.getElementById('deploy-status-updated');
  const aggregateEl = document.getElementById('deploy-aggregate');
  const listEl = document.getElementById('deploy-status-list');
  if (!listEl) return;
  try {
    const data = await fetchJson('./data/deploy-status.json');
    const updatedAt = data.updatedAt || data.last_updated_utc || data.updated_at;
    if (updatedEl && updatedAt) {
      updatedEl.textContent = `Atualizado em: ${new Date(updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} BRT`;
    }

    const aggregateStatus =
      data.aggregate?.status ||
      data.aggregate_semaphore ||
      data.aggregateSemaphore ||
      data.regressionWatchdog?.status ||
      'n/d';
    if (aggregateEl) aggregateEl.textContent = `Semáforo agregado: ${String(aggregateStatus).toUpperCase()}`;

    const repoEntries = Array.isArray(data.repos)
      ? data.repos
      : data.repos && typeof data.repos === 'object'
        ? Object.entries(data.repos).map(([repo, payload]) => ({ repo, ...payload }))
        : data.repositories && typeof data.repositories === 'object'
          ? Object.entries(data.repositories).map(([repo, payload]) => ({
              repo,
              conclusion: payload.latestRun?.conclusion || payload.latest_run?.conclusion || 'n/d',
              status: payload.latestRun?.status || payload.latest_run?.status || 'n/d',
              runUrl: payload.latestRun?.html_url || payload.latest_run?.html_url || '',
              consecutiveFailures: payload.consecutiveFailures ?? payload.consecutive_failures ?? 0,
              consecutiveSuccesses: payload.consecutiveSuccesses ?? payload.consecutive_successes ?? 0,
            }))
          : [];

    listEl.innerHTML = repoEntries.map((r) => {
      const repoName = r.repo || r.name || r.repository || 'n/d';
      const concl = r.conclusion || r.latestRun?.conclusion || r.latest_run?.conclusion || r.status || 'n/d';
      const lower = String(concl).toLowerCase();
      const ok = lower === 'success';
      const warn = ['failure', 'cancelled', 'timed_out'].includes(lower) || r.status === 'error';
      const consecutive = Number(r.consecutiveFailures ?? r.consecutive_failures ?? 0) || 0;
      const successStreak = Number(r.consecutiveSuccesses ?? r.consecutive_successes ?? 0) || 0;
      const badge = consecutive ? '🔴' : (ok ? (successStreak >= 5 ? '🎯' : '🟢') : (warn ? '🟡' : '⚪'));
      const runUrl = r.runUrl || r.latestRun?.html_url || r.latest_run?.html_url || '';
      const run = runUrl ? `<a href="${runUrl}" target="_blank" rel="noreferrer">run</a>` : 'run n/d';
      const extra = consecutive
        ? ` | ${consecutive} falhas seguidas`
        : (successStreak ? ` | ${successStreak} sucessos seguidos` : '');
      return `<li><strong>${badge} ${repoName}</strong> — ${concl}${extra} (${run})</li>`;
    }).join('');
    if (!listEl.innerHTML) listEl.innerHTML = '<li>Sem dados de deploy no momento.</li>';
  } catch {
    if (updatedEl) updatedEl.textContent = 'Atualizado em: erro de leitura';
    if (aggregateEl) aggregateEl.textContent = 'Semáforo agregado: erro';
    listEl.innerHTML = '<li>Não foi possível carregar status de deploy/CI.</li>';
  }
}

async function loadHumanDecisionSla() {
  const summaryEl = document.getElementById('human-sla-summary');
  const listEl = document.getElementById('human-sla-list');
  if (!summaryEl || !listEl) return;

  try {
    const data = await fetchJson('./data/kanban.json');

    const items = [];
    for (const col of (data.columns || [])) {
      for (const task of (col.tasks || [])) {
        const t = task.title || '';
        if (t.includes('ISSUE-011') || t.includes('ISSUE-012')) {
          const openedAt = task.openedAt ? new Date(task.openedAt) : null;
          const now = new Date();
          const decisionHours = Number(task.slaDecisionHours || 48);
          const finalHours = Number(task.slaFinalHours || 120);
          const elapsed = openedAt ? (now - openedAt) / 36e5 : 0;
          const remainDecision = Math.max(0, decisionHours - elapsed);
          const remainFinal = Math.max(0, finalHours - elapsed);
          const stage = col.title || col.id || 'n/d';
          const risk = elapsed > finalHours ? '🔴' : (elapsed > decisionHours ? '🟡' : '🟢');
          items.push({ title: t, stage, risk, remainDecision, remainFinal, elapsed });
        }
      }
    }

    const cardEl = document.getElementById('human-sla-card');
    if (!items.length) {
      summaryEl.textContent = 'Nenhuma pendência HUMAN 011/012 encontrada.';
      listEl.innerHTML = '<li>Sem itens.</li>';
      if (cardEl) {
        cardEl.classList.remove('sla-yellow', 'sla-red');
        cardEl.classList.add('sla-green');
      }
      return;
    }

    const critical = items.filter((i) => i.elapsed > 120).length;
    const warning = items.filter((i) => i.elapsed > 48 && i.elapsed <= 120).length;
    summaryEl.textContent = `Itens monitorados: ${items.length} | Atenção: ${warning} | Crítico: ${critical}`;

    if (cardEl) {
      cardEl.classList.remove('sla-green', 'sla-yellow', 'sla-red');
      if (critical > 0) cardEl.classList.add('sla-red');
      else if (warning > 0) cardEl.classList.add('sla-yellow');
      else cardEl.classList.add('sla-green');
    }

    listEl.innerHTML = items.map((i) => {
      return `<li><strong>${i.risk} ${i.title}</strong> — Stage: ${i.stage} | Triagem em: ${i.remainDecision.toFixed(1)}h | Parecer final em: ${i.remainFinal.toFixed(1)}h</li>`;
    }).join('');
  } catch {
    const cardEl = document.getElementById('human-sla-card');
    summaryEl.textContent = 'Erro ao calcular SLA de decisões HUMAN.';
    listEl.innerHTML = '<li>Falha de leitura do kanban.</li>';
    if (cardEl) {
      cardEl.classList.remove('sla-green', 'sla-yellow');
      cardEl.classList.add('sla-red');
    }
  }
}

function freshnessStatusFromAge(ageMin) {
  if (ageMin === null || Number.isNaN(ageMin)) return 'red';
  if (ageMin > 240) return 'red';
  if (ageMin > 90) return 'yellow';
  return 'green';
}

function freshnessFactor(status) {
  if (status === 'green') return 1;
  if (status === 'yellow') return 0.5;
  return 0;
}

async function loadDashboardFreshness() {
  const summaryEl = document.getElementById('freshness-summary');
  const listEl = document.getElementById('freshness-list');
  const stampEl = document.getElementById('freshness-stamp');
  const scoreEl = document.getElementById('freshness-score');
  const criticalOkEl = document.getElementById('freshness-critical-ok');
  const criticalAlertsEl = document.getElementById('freshness-critical-alerts');
  const auxEl = document.getElementById('freshness-aux');
  const cardEl = document.getElementById('freshness-card');
  if (!summaryEl || !listEl) return;

  const criticalSources = [
    { label: 'Kanban', path: './data/kanban.json', weight: 35, detail: 'fila, prioridade e status de execução' },
    { label: 'Autopilot SLA', path: './data/autopilot-sla.json', weight: 30, detail: 'cadência autônoma e intervenções' },
    { label: 'Deploy status', path: './data/deploy-status.json', weight: 20, detail: 'saúde de CI/CD e watchdog' },
    { label: 'Handoff', path: './data/handoff.json', weight: 15, detail: 'memória operacional e avanços recentes' },
  ];
  const auxiliarySources = [
    { label: 'Metrics history', path: './data/metrics-history.json', detail: 'comparativos persistidos' },
    { label: 'Repo progress', path: './data/product-code-progress.json', detail: 'sincronização dos repositórios' },
  ];
  const sources = [
    ...criticalSources.map((src) => ({ ...src, critical: true })),
    ...auxiliarySources.map((src) => ({ ...src, critical: false, weight: 0 })),
  ];

  try {
    const now = Date.now();
    const results = await Promise.all(sources.map(async (src) => {
      try {
        const data = await fetchJson(src.path);
        const updatedAtValue = extractUpdatedAt(data);
        const updatedAt = updatedAtValue ? new Date(updatedAtValue).getTime() : null;
        const ageMin = updatedAt ? (now - updatedAt) / 60000 : null;
        const status = freshnessStatusFromAge(ageMin);
        const factor = src.critical ? freshnessFactor(status) : null;
        return {
          ...src,
          updatedAt,
          ageMin,
          status,
          factor,
          scorePart: src.critical ? src.weight * factor : 0,
        };
      } catch {
        return {
          ...src,
          updatedAt: null,
          ageMin: null,
          status: 'red',
          factor: src.critical ? 0 : null,
          scorePart: 0,
        };
      }
    }));

    const criticalResults = results.filter((r) => r.critical);
    const auxiliaryResults = results.filter((r) => !r.critical);
    const score = Math.max(0, Math.min(100, Math.round(criticalResults.reduce((sum, r) => sum + Number(r.scorePart || 0), 0))));
    const criticalGreen = criticalResults.filter((r) => r.status === 'green').length;
    const criticalYellow = criticalResults.filter((r) => r.status === 'yellow').length;
    const criticalRed = criticalResults.filter((r) => r.status === 'red').length;
    const auxGreen = auxiliaryResults.filter((r) => r.status === 'green').length;
    const newestUpdatedAt = results.reduce((max, r) => {
      if (typeof r.updatedAt === 'number' && (!max || r.updatedAt > max)) return r.updatedAt;
      return max;
    }, null);

    if (stampEl) {
      stampEl.textContent = newestUpdatedAt
        ? `Atualizado em: ${formatBrtTimestamp(newestUpdatedAt)}`
        : 'Atualizado em: n/d';
    }
    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (criticalOkEl) criticalOkEl.textContent = `${criticalGreen}/${criticalResults.length}`;
    if (criticalAlertsEl) criticalAlertsEl.textContent = `Alertas: ${criticalYellow + criticalRed}`;
    if (auxEl) auxEl.textContent = `${auxGreen}/${auxiliaryResults.length}`;

    summaryEl.textContent = `Score ponderado: ${score}% | Críticas verdes: ${criticalGreen}/${criticalResults.length} | Alertas críticos: ${criticalYellow + criticalRed} | Complementares verdes: ${auxGreen}/${auxiliaryResults.length}`;

    listEl.innerHTML = results.map((r) => {
      const dot = r.status === 'red' ? '🔴' : (r.status === 'yellow' ? '🟡' : '🟢');
      const age = r.ageMin === null ? 'n/d' : `${r.ageMin.toFixed(1)} min`;
      const weight = r.critical ? `peso ${r.weight}%` : 'complementar';
      const contribution = r.critical ? ` | aporte ${Number(r.scorePart || 0).toFixed(1)} pts` : '';
      const detail = r.detail ? ` | ${r.detail}` : '';
      return `<li><strong>${dot} ${r.label}</strong> — ${weight}${contribution} | idade: ${age}${detail}</li>`;
    }).join('');

    if (cardEl) {
      cardEl.classList.remove('sla-green', 'sla-yellow', 'sla-red');
      if (criticalRed > 0 || score < 60) cardEl.classList.add('sla-red');
      else if (criticalYellow > 0 || score < 85) cardEl.classList.add('sla-yellow');
      else cardEl.classList.add('sla-green');
    }
  } catch {
    if (stampEl) stampEl.textContent = 'Atualizado em: erro de leitura';
    if (scoreEl) scoreEl.textContent = '—';
    if (criticalOkEl) criticalOkEl.textContent = '—';
    if (criticalAlertsEl) criticalAlertsEl.textContent = 'Alertas: —';
    if (auxEl) auxEl.textContent = '—';
    summaryEl.textContent = 'Erro ao calcular confiabilidade ponderada.';
    listEl.innerHTML = '<li>Falha ao ler fontes críticas e complementares.</li>';
    if (cardEl) {
      cardEl.classList.remove('sla-green', 'sla-yellow');
      cardEl.classList.add('sla-red');
    }
  }
}

async function loadMetricsHistory() {
  try {
    const data = await fetchJson('./data/metrics-history.json');
    renderMetricsHistory(data);
  } catch {
    renderMetricsHistory({ snapshots: [] });
  }
}

function downloadHandoff() {
  const data = window.__handoffData;
  trackDashboardSignal('export', 'handoff', { scope: 'workspace' });
  renderDashboardSignals();
  if (!data) return;

  const lines = [];
  lines.push('HANDOFF OPERACIONAL - LF SOLUÇÕES');
  lines.push(`Gerado em UTC: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Objetivo: ${data.program?.objective || '-'}`);
  lines.push('');
  lines.push('Projetos:');
  (data.projects || []).forEach((p) => {
    const commit = p.latestCommit ? ` | Commit: ${p.latestCommit}` : '';
    lines.push(`- ${p.name} | Status: ${p.status} | Repo: ${p.repo || 'n/d'}${commit}`);
  });
  lines.push('');
  // lines.push('Equipe especialista:'); // REMOVED
  // (data.team?.roles || []).forEach((r) => lines.push(`- ${r}`)); // REMOVED
  lines.push('');
  lines.push('Especialistas por categoria:');
  const categories = data.team?.categories || {};
  Object.entries(categories).forEach(([cat, roles]) => {
    lines.push(`- ${cat}:`);
    (roles || []).forEach((r) => lines.push(`  - ${r}`));
  });
  lines.push('');
  lines.push('Controle de capacidade e função:');
  const capability = data.team?.capabilityControl || {};
  lines.push(`- Matriz: ${capability.matrix || 'n/d'}`);
  lines.push(`- Alocação: ${capability.allocation || 'n/d'}`);
  lines.push(`- Roteamento: ${capability.routing || 'n/d'}`);
  (capability.requiredTaskFields || []).forEach((f) => lines.push(`- Campo obrigatório: ${f}`));
  lines.push('');
  lines.push('Rotinas diárias:');
  (data.automation?.daily || []).forEach((r) => lines.push(`- ${r}`));
  lines.push('');
  lines.push('Rotinas semanais:');
  (data.automation?.weekly || []).forEach((r) => lines.push(`- ${r}`));
  lines.push('');
  lines.push('Checklist de handoff:');
  (data.handoffChecklist || []).forEach((r) => lines.push(`- ${r}`));
  lines.push('');
  lines.push('Últimos avanços:');
  (data.recentAdvances || []).forEach((entry) => {
    lines.push(`- ${entry.at || 'n/d'}`);
    (entry.items || []).forEach((item) => lines.push(`  - ${item}`));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `handoff-operacional-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('download-weekly-report').addEventListener('click', downloadWeeklyReport);
document.getElementById('download-handoff').addEventListener('click', downloadHandoff);

document.getElementById('kanban-autorefresh').textContent = `Auto-refresh: ativo (a cada ${Math.round(AUTO_REFRESH_MS / 60000)} min)`;

function refreshAll() {
  bindDashboardActionTracking();
  Promise.all([loadKanban({ renderBoard: false }), loadSemaphoreState()]).catch(() => {});

  scheduleLowPriority(() => {
    loadDeployStatus();
    loadAutopilotSla();
  }, 120);

  scheduleLowPriority(() => {
    renderCurrentKanban();
    loadCommercialFunnel();
    loadHandoff();
    loadRepoProgress();
    loadOpsAnalytics();
    loadHumanDecisionSla();
    loadMetricsHistory();
    loadDashboardFreshness();
    renderDashboardSignals();
  }, 360);
}

function scheduleAutoRefresh() {
  if (autoRefreshTimer) clearTimeout(autoRefreshTimer);
  autoRefreshTimer = setTimeout(() => {
    if (!document.hidden) refreshAll();
    scheduleAutoRefresh();
  }, AUTO_REFRESH_MS);
}

window.addEventListener('load', () => {
  refreshAll();
  scheduleAutoRefresh();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshAll();
});
