let kanbanData = null;
const AUTO_REFRESH_MS = 180000;

function priorityClass(priority) {
  if (priority === 'Alta') return 'priority-high';
  if (priority === 'Média') return 'priority-medium';
  return 'priority-low';
}

function normalize(text) {
  return String(text || '').toLowerCase();
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

function updateMetrics(tasks) {
  const humanTasks = tasks.filter((t) => t.mode === 'HUMAN');
  const blockedHuman = humanTasks.filter((t) => !Array.isArray(t.runbookSteps) || t.runbookSteps.length === 0);

  const humanMetric = document.getElementById('metric-human');
  const blockedMetric = document.getElementById('metric-blocked');
  if (humanMetric) humanMetric.textContent = String(humanTasks.length);
  if (blockedMetric) blockedMetric.textContent = String(blockedHuman.length);

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
    const response = await fetch('./data/semaphore-state.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar semaphore-state.json');

    const state = await response.json();
    const days = Number(state.consecutiveRed || 0);
    el.textContent = `Dias consecutivos em vermelho: ${days}`;
  } catch {
    el.textContent = 'Dias consecutivos em vermelho: n/d';
  }

  if (!historyEl) return;
  try {
    const response = await fetch('./data/semaphore-history.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar semaphore-history.json');
    const history = await response.json();
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

function renderKanban(data) {
  const board = document.getElementById('kanban-board');
  const summary = document.getElementById('kanban-summary');
  board.innerHTML = '';

  let totalShown = 0;
  const shownTasks = [];

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
    }

    for (const task of tasks) {
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

      col.appendChild(card);
    }

    board.appendChild(col);
  }

  summary.textContent = `Resumo: ${totalShown} atividade(s) visível(is) no filtro atual.`;
  renderCharts(shownTasks);
  updateMetrics(shownTasks);
  persistFiltersToURL();
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
  if (kanbanData) renderKanban(kanbanData);
}

function downloadWeeklyReport() {
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

async function loadKanban() {
  const board = document.getElementById('kanban-board');
  const stamp = document.getElementById('kanban-updated-at');

  try {
    const response = await fetch('./data/kanban.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar kanban.json');

    const incoming = await response.json();
    const firstLoad = !kanbanData;
    kanbanData = incoming;

    if (firstLoad) {
      populateSelect(kanbanData, 'filter-owner', (task) => task.owner);
      populateSelect(kanbanData, 'filter-project', (task) => task.project);
      applyFiltersFromURL();
    }

    renderKanban(kanbanData);

    if (kanbanData.updatedAt) {
      const dt = new Date(kanbanData.updatedAt);
      stamp.textContent = `Atualizado em: ${dt.toLocaleString('pt-BR', { timeZone: 'UTC' })} UTC`;
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
    if (kanbanData) renderKanban(kanbanData);
  });
});

document.getElementById('filter-search').addEventListener('input', () => {
  if (kanbanData) renderKanban(kanbanData);
});

document.getElementById('clear-filters').addEventListener('click', clearFilters);
async function loadHandoff() {
  const target = document.getElementById('handoff-content');
  const updated = document.getElementById('handoff-updated');
  if (!target || !updated) return;

  try {
    const response = await fetch('./data/handoff.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar handoff.json');
    const data = await response.json();

    updated.textContent = `Atualizado em: ${new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'UTC' })} UTC`;

    const projects = (data.projects || []).map((p) => `<li><strong>${p.name}</strong> — ${p.status}${p.repo ? ` — <a href="${p.repo}" target="_blank" rel="noreferrer">repo</a>` : ''}</li>`).join('');
    const team = (data.team?.roles || []).map((r) => `<li>${r}</li>`).join('');
    const categoriesObj = data.team?.categories || {};
    const categories = Object.keys(categoriesObj).length
      ? Object.entries(categoriesObj).map(([name, roles]) => `<li><strong>${name}</strong><ul>${(roles || []).map((r) => `<li>${r}</li>`).join('')}</ul></li>`).join('')
      : '';
    const daily = (data.automation?.daily || []).map((x) => `<li>${x}</li>`).join('');
    const weekly = (data.automation?.weekly || []).map((x) => `<li>${x}</li>`).join('');
    const checklist = (data.handoffChecklist || []).map((x) => `<li>${x}</li>`).join('');
    const capability = data.team?.capabilityControl || {};
    const requiredFields = (capability.requiredTaskFields || []).map((f) => `<li>${f}</li>`).join('');

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
        <h3>Equipe especialista</h3>
        <ul>${team}</ul>
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
    `;

    window.__handoffData = data;
  } catch {
    updated.textContent = 'Atualizado em: erro de leitura';
    target.innerHTML = '<div class="handoff-block"><p class="task-meta">Não foi possível carregar o contexto de handoff.</p></div>';
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
    const [opsRes, histRes] = await Promise.all([
      fetch('./data/ops-analytics.json', { cache: 'no-store' }),
      fetch('./data/activities-history.json', { cache: 'no-store' })
    ]);
    if (!opsRes.ok) throw new Error('Falha ao carregar ops-analytics.json');
    const data = await opsRes.json();
    const history = histRes.ok ? await histRes.json() : { activities: [] };

    if (updated) {
      updated.textContent = `Atualizado em: ${new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'UTC' })} UTC`;
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
    const response = await fetch('./data/autopilot-sla.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar autopilot-sla.json');
    const data = await response.json();
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
    if (updatedEl) updatedEl.textContent = `Atualizado em: ${new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'UTC' })} UTC`;
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
    const response = await fetch('./data/deploy-status.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar deploy-status.json');
    const data = await response.json();
    if (updatedEl) updatedEl.textContent = `Atualizado em: ${new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'UTC' })} UTC`;
    if (aggregateEl) aggregateEl.textContent = `Semáforo agregado: ${String(data.aggregate?.status || 'n/d').toUpperCase()}`;

    listEl.innerHTML = (data.repos || []).map((r) => {
      const concl = r.conclusion || r.status || 'n/d';
      const lower = String(concl).toLowerCase();
      const ok = lower === 'success';
      const warn = ['failure','cancelled','timed_out'].includes(lower) || r.status === 'error';
      const badge = r.consecutiveFailures ? '🔴' : (ok ? '🟢' : (warn ? '🟡' : '⚪'));
      const run = r.runUrl ? `<a href="${r.runUrl}" target="_blank" rel="noreferrer">run</a>` : 'run n/d';
      const extra = r.consecutiveFailures ? ' | 2 falhas seguidas' : '';
      return `<li><strong>${badge} ${r.repo}</strong> — ${concl}${extra} (${run})</li>`;
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
    const response = await fetch('./data/kanban.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar kanban.json');
    const data = await response.json();

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

function downloadHandoff() {
  const data = window.__handoffData;
  if (!data) return;

  const lines = [];
  lines.push('HANDOFF OPERACIONAL - LF SOLUÇÕES');
  lines.push(`Gerado em UTC: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Objetivo: ${data.program?.objective || '-'}`);
  lines.push('');
  lines.push('Projetos:');
  (data.projects || []).forEach((p) => {
    lines.push(`- ${p.name} | Status: ${p.status} | Repo: ${p.repo || 'n/d'}`);
  });
  lines.push('');
  lines.push('Equipe especialista:');
  (data.team?.roles || []).forEach((r) => lines.push(`- ${r}`));
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

loadKanban();
loadSemaphoreState();
loadHandoff();
loadOpsAnalytics();
loadAutopilotSla();
loadDeployStatus();
loadHumanDecisionSla();
setInterval(() => {
  loadKanban();
  loadSemaphoreState();
  loadHandoff();
  loadOpsAnalytics();
  loadAutopilotSla();
  loadDeployStatus();
  loadHumanDecisionSla();
}, AUTO_REFRESH_MS);
