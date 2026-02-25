let kanbanData = null;

function priorityClass(priority) {
  if (priority === 'Alta') return 'priority-high';
  if (priority === 'Média') return 'priority-medium';
  return 'priority-low';
}

function normalize(text) {
  return String(text || '').toLowerCase();
}

function matchesSearch(task, searchTerm) {
  if (!searchTerm) return true;
  const haystack = `${task.title || ''} ${task.description || ''} ${task.owner || ''} ${task.status || ''} ${task.project || ''} ${task.mode || ''}`.toLowerCase();
  return haystack.includes(searchTerm);
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

  const top = Object.entries(owners)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

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

function renderKanban(data) {
  const board = document.getElementById('kanban-board');
  const summary = document.getElementById('kanban-summary');
  const ownerFilter = document.getElementById('filter-owner').value;
  const projectFilter = document.getElementById('filter-project').value;
  const modeFilter = document.getElementById('filter-mode').value;
  const priorityFilter = document.getElementById('filter-priority').value;
  const searchTerm = normalize(document.getElementById('filter-search').value.trim());

  board.innerHTML = '';

  let totalShown = 0;
  const shownTasks = [];

  for (const column of data.columns || []) {
    const tasks = (column.tasks || []).filter((task) => {
      const ownerOk = !ownerFilter || task.owner === ownerFilter;
      const projectOk = !projectFilter || task.project === projectFilter;
      const modeOk = !modeFilter || task.mode === modeFilter;
      const priorityOk = !priorityFilter || task.priority === priorityFilter;
      const searchOk = matchesSearch(task, searchTerm);
      return ownerOk && projectOk && modeOk && priorityOk && searchOk;
    });

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

      const runbookHtml = task.mode === 'HUMAN' && Array.isArray(task.runbookSteps)
        ? `
          <details class="runbook">
            <summary>Passo a passo (HUMAN)</summary>
            <ol>${task.runbookSteps.map((s) => `<li>${s}</li>`).join('')}</ol>
            ${Array.isArray(task.expectedEvidence) ? `<p class="task-meta"><strong>Evidências:</strong> ${task.expectedEvidence.join(' • ')}</p>` : ''}
          </details>
        `
        : '';

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

async function loadKanban() {
  const board = document.getElementById('kanban-board');
  const stamp = document.getElementById('kanban-updated-at');

  try {
    const response = await fetch('./data/kanban.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar kanban.json');

    kanbanData = await response.json();
    populateSelect(kanbanData, 'filter-owner', (task) => task.owner);
    populateSelect(kanbanData, 'filter-project', (task) => task.project);
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

document.getElementById('filter-owner').addEventListener('change', () => {
  if (kanbanData) renderKanban(kanbanData);
});

document.getElementById('filter-project').addEventListener('change', () => {
  if (kanbanData) renderKanban(kanbanData);
});

document.getElementById('filter-mode').addEventListener('change', () => {
  if (kanbanData) renderKanban(kanbanData);
});

document.getElementById('filter-priority').addEventListener('change', () => {
  if (kanbanData) renderKanban(kanbanData);
});

document.getElementById('filter-search').addEventListener('input', () => {
  if (kanbanData) renderKanban(kanbanData);
});

loadKanban();
