(() => {
  'use strict';
  const STORAGE_KEY = 'daymark-tasks-v1';
  const $ = (selector) => document.querySelector(selector);
  let tasks = readTasks();
  let activeView = 'all';
  let toastTimer;

  function readTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter(task => task && typeof task.id === 'string' && typeof task.title === 'string') : [];
    } catch { return []; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
    catch { showToast('Could not save. Browser storage may be full.'); }
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);
  }
  function localISODate(date = new Date()) {
    const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  function dateText(dateString) {
    if (!dateString) return '';
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    if (dateString === localISODate()) return 'Today';
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateString === localISODate(tomorrow)) return 'Tomorrow';
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  }
  function showToast(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }
  function isToday(task) { return task.due === localISODate() && !task.completed; }
  function isUpcoming(task) { return task.due > localISODate() && !task.completed; }
  function tasksForView() {
    const query = $('#search').value.trim().toLowerCase();
    const priority = $('#priorityFilter').value;
    let result = tasks.filter(task => {
      if (activeView === 'today' && !isToday(task)) return false;
      if (activeView === 'upcoming' && !isUpcoming(task)) return false;
      if (activeView === 'completed' && !task.completed) return false;
      if (activeView === 'all' && task.completed) return false;
      if (priority !== 'all' && task.priority !== priority) return false;
      return !query || `${task.title} ${task.notes || ''}`.toLowerCase().includes(query);
    });
    const sort = $('#sortOrder').value;
    if (sort === 'due') result.sort((a, b) => (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99') || b.createdAt - a.createdAt);
    else if (sort === 'priority') { const weight = { high: 0, medium: 1, low: 2 }; result.sort((a, b) => weight[a.priority] - weight[b.priority] || b.createdAt - a.createdAt); }
    else result.sort((a, b) => b.createdAt - a.createdAt);
    return result;
  }
  function render() {
    const active = tasks.filter(task => !task.completed);
    const completed = tasks.filter(task => task.completed);
    const todayCount = active.filter(isToday).length;
    const upcomingCount = active.filter(isUpcoming).length;
    $('#allCount').textContent = active.length;
    $('#todayCount').textContent = todayCount;
    $('#upcomingCount').textContent = upcomingCount;
    $('#completedCount').textContent = completed.length;
    $('#todoStat').textContent = active.length;
    $('#doneStat').textContent = completed.length;
    $('#dueStat').textContent = todayCount;
    $('#doneNote').textContent = completed.length ? 'Nice work, keep it up' : 'Ready when you are';

    const labels = {
      all: ['All tasks', 'Everything you want to get done.'],
      today: ['Today', 'Tasks with a due date of today.'],
      upcoming: ['Upcoming', 'Tasks scheduled for a later date.'],
      completed: ['Completed', 'A record of what you have finished.']
    };
    $('#viewTitle').textContent = labels[activeView][0];
    $('#viewSubtitle').textContent = labels[activeView][1];
    const visible = tasksForView();
    $('#taskList').innerHTML = visible.map(task => {
      const due = dateText(task.due);
      const overdue = task.due && task.due < localISODate() && !task.completed;
      return `<article class="task-row${task.completed ? ' is-complete' : ''}" data-id="${escapeHtml(task.id)}">
        <button class="check-button" data-action="toggle" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">${task.completed ? '✓' : ''}</button>
        <div class="task-copy"><div class="task-title">${escapeHtml(task.title)}</div>${task.notes ? `<div class="task-notes">${escapeHtml(task.notes)}</div>` : ''}</div>
        <div class="task-meta"><span class="priority ${escapeHtml(task.priority)}">${escapeHtml(task.priority[0].toUpperCase() + task.priority.slice(1))}</span>${due ? `<span class="due-date${overdue ? ' overdue' : ''}">${overdue ? 'Overdue · ' : ''}${escapeHtml(due)}</span>` : ''}</div>
        <div class="row-actions"><button class="row-action" data-action="edit" aria-label="Edit ${escapeHtml(task.title)}" title="Edit">✎</button><button class="row-action" data-action="delete" aria-label="Delete ${escapeHtml(task.title)}" title="Delete">×</button></div>
      </article>`;
    }).join('');
    const empty = $('#emptyState');
    empty.style.display = visible.length ? 'none' : 'block';
    if (!tasks.length) {
      $('#emptyTitle').textContent = 'Your list is a blank canvas';
      $('#emptyMessage').textContent = 'Add your first task and take one thing off your mind.';
      $('#emptyAdd').style.display = 'inline-flex';
    } else if (!visible.length && $('#search').value.trim()) {
      $('#emptyTitle').textContent = 'No matching tasks';
      $('#emptyMessage').textContent = 'Try a different search or change your filters.';
      $('#emptyAdd').style.display = 'none';
    } else if (!visible.length) {
      $('#emptyTitle').textContent = activeView === 'completed' ? 'Nothing completed yet' : 'Nothing here for now';
      $('#emptyMessage').textContent = activeView === 'completed' ? 'Finished tasks will appear here.' : 'Add a task or choose another view.';
      $('#emptyAdd').style.display = activeView === 'all' ? 'inline-flex' : 'none';
    }
    $('#listFooter').textContent = visible.length ? `${visible.length} ${visible.length === 1 ? 'task' : 'tasks'}` : '';
    $('#clearDone').disabled = completed.length === 0;
    $('#clearDone').style.opacity = completed.length ? '1' : '.55';
  }
  function openTaskDialog(task = null) {
    const form = $('#taskForm'); form.reset();
    form.dataset.editId = task?.id || '';
    $('#dialogTitle').textContent = task ? 'Edit task' : 'Create a task';
    $('#saveTask').innerHTML = task ? 'Save changes <span>→</span>' : 'Save task <span>→</span>';
    $('#taskTitle').value = task?.title || '';
    $('#taskNotes').value = task?.notes || '';
    $('#taskDue').value = task?.due || '';
    $('#taskPriority').value = task?.priority || 'medium';
    $('#taskDialog').showModal();
    setTimeout(() => $('#taskTitle').focus(), 30);
  }
  $('#dateToday').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  ['#topAdd', '#introAdd', '#emptyAdd'].forEach(selector => $(selector).addEventListener('click', () => openTaskDialog()));
  document.querySelectorAll('.nav-link').forEach(button => button.addEventListener('click', () => {
    activeView = button.dataset.view;
    document.querySelectorAll('.nav-link').forEach(item => item.classList.toggle('selected', item === button));
    render();
  }));
  ['#search', '#priorityFilter', '#sortOrder'].forEach(selector => $(selector).addEventListener(selector === '#search' ? 'input' : 'change', render));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $('#taskForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = $('#taskTitle').value.trim();
    if (!title) { $('#taskTitle').focus(); return; }
    const editId = form.dataset.editId;
    if (editId) {
      tasks = tasks.map(task => task.id === editId ? { ...task, title, notes: $('#taskNotes').value.trim(), due: $('#taskDue').value, priority: $('#taskPriority').value } : task);
    } else {
      tasks.push({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, title, notes: $('#taskNotes').value.trim(), due: $('#taskDue').value, priority: $('#taskPriority').value, completed: false, createdAt: Date.now() });
    }
    persist(); render(); $('#taskDialog').close(); showToast(editId ? 'Task updated.' : 'Task added.');
  });
  $('#taskList').addEventListener('click', event => {
    const row = event.target.closest('.task-row'); if (!row) return;
    const task = tasks.find(item => item.id === row.dataset.id); if (!task) return;
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'toggle') {
      task.completed = !task.completed;
      task.completedAt = task.completed ? Date.now() : null;
      persist(); render(); showToast(task.completed ? 'Task completed.' : 'Task marked incomplete.');
    } else if (action === 'edit') openTaskDialog(task);
    else if (action === 'delete' && confirm(`Delete “${task.title}”?`)) {
      tasks = tasks.filter(item => item.id !== task.id); persist(); render(); showToast('Task deleted.');
    }
  });
  $('#clearDone').addEventListener('click', () => {
    const count = tasks.filter(task => task.completed).length;
    if (!count) return;
    if (confirm(`Delete ${count} completed ${count === 1 ? 'task' : 'tasks'}?`)) {
      tasks = tasks.filter(task => !task.completed); persist(); render(); showToast('Completed tasks cleared.');
    }
  });
  $('#dataButton').addEventListener('click', () => $('#dataDialog').showModal());
  $('#deleteAll').addEventListener('click', () => {
    if (!tasks.length) { showToast('There are no tasks to delete.'); return; }
    if (confirm('Delete every task saved in this browser? This cannot be undone.')) {
      tasks = []; persist(); render(); $('#dataDialog').close(); showToast('All tasks deleted.');
    }
  });
  render();
})();
