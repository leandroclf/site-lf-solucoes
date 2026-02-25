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

function updateMetrics(tasks) {
  const humanTasks = tasks.filter((t) => t.mode === 'HUMAN');
  const blockedHuman = humanTasks.filter((t) => !Array.isArray(t.runbookSteps) || t.runbookSteps.length === 0);

  const humanMetric = document.getElementById('metric-human');
  const blockedMetric = document.getElementById('metric-blocked');
  if (humanMetric) humanMetric.textContent = String(humanTasks.length);
  if (blockedMetric) blockedMetric.textContent = String(blockedHuman.length);
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
document.getElementById('download-weekly-report').addEventListener('click', downloadWeeklyReport);

document.getElementById('kanban-autorefresh').textContent = `Auto-refresh: ativo (a cada ${Math.round(AUTO_REFRESH_MS / 60000)} min)`;

loadKanban();
setInterval(loadKanban, AUTO_REFRESH_MS);
