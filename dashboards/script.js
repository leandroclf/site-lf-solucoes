async function loadKanban() {
  const board = document.getElementById('kanban-board');
  const stamp = document.getElementById('kanban-updated-at');

  try {
    const response = await fetch('./data/kanban.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar kanban.json');

    const data = await response.json();
    board.innerHTML = '';

    for (const column of data.columns || []) {
      const col = document.createElement('article');
      col.className = 'kanban-col';

      const title = document.createElement('h3');
      title.textContent = column.title;
      col.appendChild(title);

      const tasks = column.tasks || [];
      if (!tasks.length) {
        const empty = document.createElement('p');
        empty.className = 'task-meta';
        empty.textContent = 'Sem itens no momento.';
        col.appendChild(empty);
      }

      for (const task of tasks) {
        const card = document.createElement('div');
        card.className = 'task';

        card.innerHTML = `
          <p class="task-title">${task.title || '-'}</p>
          <p class="task-desc">${task.description || ''}</p>
          <p class="task-meta">Responsável: ${task.owner || '-'} • Status: ${task.status || '-'}</p>
        `;

        col.appendChild(card);
      }

      board.appendChild(col);
    }

    if (data.updatedAt) {
      const dt = new Date(data.updatedAt);
      stamp.textContent = `Atualizado em: ${dt.toLocaleString('pt-BR', { timeZone: 'UTC' })} UTC`;
    } else {
      stamp.textContent = 'Atualizado em: n/d';
    }
  } catch (error) {
    board.innerHTML = '<article class="kanban-col"><h3>Erro</h3><p class="task-meta">Não foi possível carregar o kanban.</p></article>';
    stamp.textContent = 'Atualizado em: erro de leitura';
  }
}

loadKanban();
