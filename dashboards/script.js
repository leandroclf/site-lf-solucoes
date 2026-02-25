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
  const haystack = `${task.title || ''} ${task.description || ''} ${task.owner || ''} ${task.status || ''}`.toLowerCase();
  return haystack.includes(searchTerm);
}

function renderKanban(data) {
  const board = document.getElementById('kanban-board');
  const summary = document.getElementById('kanban-summary');
  const ownerFilter = document.getElementById('filter-owner').value;
  const priorityFilter = document.getElementById('filter-priority').value;
  const searchTerm = normalize(document.getElementById('filter-search').value.trim());

  board.innerHTML = '';

  let totalShown = 0;

  for (const column of data.columns || []) {
    const tasks = (column.tasks || []).filter((task) => {
      const ownerOk = !ownerFilter || task.owner === ownerFilter;
      const priorityOk = !priorityFilter || task.priority === priorityFilter;
      const searchOk = matchesSearch(task, searchTerm);
      return ownerOk && priorityOk && searchOk;
    });

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

      card.innerHTML = `
        <p class="task-title">${task.title || '-'}</p>
        <p class="task-desc">${task.description || ''}</p>
        <p class="task-meta">Responsável: ${task.owner || '-'} • Status: ${task.status || '-'}</p>
        <p class="priority ${priorityClass(task.priority)}">Prioridade: ${task.priority || 'Baixa'}</p>
      `;

      col.appendChild(card);
    }

    board.appendChild(col);
  }

  summary.textContent = `Resumo: ${totalShown} atividade(s) visível(is) no filtro atual.`;
}

function populateOwnerFilter(data) {
  const ownerSelect = document.getElementById('filter-owner');
  const owners = new Set();

  for (const col of data.columns || []) {
    for (const task of col.tasks || []) {
      if (task.owner) owners.add(task.owner);
    }
  }

  for (const owner of [...owners].sort()) {
    const opt = document.createElement('option');
    opt.value = owner;
    opt.textContent = owner;
    ownerSelect.appendChild(opt);
  }
}

async function loadKanban() {
  const board = document.getElementById('kanban-board');
  const stamp = document.getElementById('kanban-updated-at');

  try {
    const response = await fetch('./data/kanban.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar kanban.json');

    kanbanData = await response.json();
    populateOwnerFilter(kanbanData);
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

document.getElementById('filter-priority').addEventListener('change', () => {
  if (kanbanData) renderKanban(kanbanData);
});

document.getElementById('filter-search').addEventListener('input', () => {
  if (kanbanData) renderKanban(kanbanData);
});

loadKanban();
