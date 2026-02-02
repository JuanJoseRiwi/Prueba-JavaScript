import JsonService from '../services/jsonService.js';
import { getCurrentUser } from '../services/authService.js';
import { LoadingView } from '../components/Loading.js';

const taskService = new JsonService();

export async function TasksView() {
    const user = getCurrentUser();

    const main = document.createElement('main');
    main.classList.add('layout');

    // Header
    const header = document.createElement('div');
    header.classList.add('section-header');
    header.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;width:100%">
            <div>
                <h1 class="page-title">Task Management</h1>
                <p class="subtitle">View, edit, and organize all tasks in one place.</p>
            </div>
            <div>
                ${user && user.role === 'admin' ? '<button class="button primary" id="newTaskBtn">+ New Task</button>' : ''}
            </div>
        </div>
    `;

    // Metrics and controls
    const metrics = document.createElement('div');
    metrics.classList.add('metrics');
    metrics.innerHTML = LoadingView();

    const controls = document.createElement('div');
    controls.classList.add('tasks-controls');
    controls.style.display = 'flex';
    controls.style.justifyContent = 'space-between';
    controls.style.alignItems = 'center';
    controls.style.gap = '1rem';
    controls.innerHTML = `
        <div style="flex:1;max-width:640px;">
            <input id="tasksSearchFull" class="search" placeholder="Search by title, assignee, priority, status...">
        </div>
        <div style="display:flex;gap:0.5rem;">
            <button class="tab-button active" data-status="All">All</button>
            <button class="tab-button" data-status="inprogress">In Progress</button>
            <button class="tab-button" data-status="pending_review">Pending Review</button>
            <button class="tab-button" data-status="completed">Completed</button>
        </div>
    `;

    const tableWrap = document.createElement('div');
    tableWrap.classList.add('table-container');
    tableWrap.style.marginTop = '1rem';
    tableWrap.innerHTML = `
        <table class="table task-list">
            <thead>
                <tr>
                    <th style="width:40px;"><input type="checkbox" id="selectAllTasks" title="Select all"></th>
                    <th>TASK NAME</th>
                    <th>CATEGORY</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>DUE DATE</th>
                    <th style="width:120px;text-align:right;">ACTIONS</th>
                </tr>
            </thead>
            <tbody id="tasks-table-body">
            </tbody>
        </table>
    `;

    main.appendChild(header);
    main.appendChild(metrics);
    main.appendChild(controls);
    main.appendChild(tableWrap);

    async function renderMetrics() {
        try {
            const tasks = await taskService.getTasks();
            const total = tasks.length;
            const inProgress = tasks.filter(t => ['preparing','in_progress','working'].includes((t.status||'').toString())).length;
            const completed = tasks.filter(t => ['delivered','completed'].includes((t.status||'').toString())).length;
            const pendingReview = tasks.filter(t => ['ready','review'].includes((t.status||'').toString())).length;

            metrics.innerHTML = `
                <div class="metric-card" data-status="All"><div class="metric-left"><div class="metric-icon primary">📋</div><div class="metric-info"><p class="metric-label">Total Tasks</p><p class="metric-value">${total}</p></div></div></div>
                <div class="metric-card" data-status="inprogress"><div class="metric-left"><div class="metric-icon warning">🔧</div><div class="metric-info"><p class="metric-label">In Progress</p><p class="metric-value">${inProgress}</p></div></div></div>
                <div class="metric-card" data-status="completed"><div class="metric-left"><div class="metric-icon success">✅</div><div class="metric-info"><p class="metric-label">Completed</p><p class="metric-value">${completed}</p></div></div></div>
                <div class="metric-card" data-status="pending_review"><div class="metric-left"><div class="metric-icon primary">⏱️</div><div class="metric-info"><p class="metric-label">Pending Review</p><p class="metric-value">${pendingReview}</p></div></div></div>
            `;

            // make metric cards clickable to filter the table
            const cards = metrics.querySelectorAll('.metric-card');
            cards.forEach(card => {
                card.style.cursor = 'pointer';
                card.addEventListener('click', async () => {
                    const status = card.dataset.status || 'All';
                    currentFilter = status;
                    // update tab active state
                    controls.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    const tab = Array.from(controls.querySelectorAll('.tab-button')).find(b => b.dataset.status === status);
                    if (tab) tab.classList.add('active');
                    // apply filter
                    const q = main.querySelector('#tasksSearchFull')?.value || '';
                    await renderTable(currentFilter, q);
                });
            });

        } catch (err) {
            console.error('Error loading metrics', err);
            metrics.innerHTML = `<p class="error">Error loading metrics.</p>`;
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
    }

    function statusLabel(status) {
        const s = (status||'').toString().toLowerCase();
        if (['preparing','in_progress','working','inprogress'].includes(s)) return 'In Progress';
        if (['delivered','completed','done'].includes(s)) return 'Completed';
        if (['ready','review','pending_review'].includes(s)) return 'Pending Review';
        if (['pending','todo','open'].includes(s)) return 'Pending';
        return status ? status.toString() : '-';
    }

    function statusClass(status) {
        return (status||'').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-');
    }

    async function renderTable(statusFilter='All', searchTerm='') {
        const tbody = main.querySelector('#tasks-table-body');
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:1.5rem;">Loading tasks...</td></tr>`;
        try {
            const tasks = await taskService.getTasks();
            const q = (searchTerm || '').trim().toLowerCase();
            const filtered = tasks.filter(t => {
                let statusMatch = true;
                if (statusFilter && statusFilter !== 'All') {
                    if (statusFilter === 'inprogress') statusMatch = ['preparing','in_progress','working'].includes((t.status||'').toString());
                    else if (statusFilter === 'pending_review') statusMatch = ['ready','review'].includes((t.status||'').toString());
                    else if (statusFilter === 'completed') statusMatch = ['delivered','completed'].includes((t.status||'').toString());
                    else statusMatch = t.status === statusFilter;
                }
                const fields = [t.name,t.desc,t.assignee,t.priority,t.status].map(f=> (f||'').toString().toLowerCase());
                const matchesSearch = !q || fields.some(f=> f.includes(q));
                return statusMatch && matchesSearch;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:1.5rem;">No tasks found.</td></tr>`;
                return;
            }

            const rows = filtered.map(t => {
                const label = statusLabel(t.status);
                const cls = statusClass(t.status);
                return `
                <tr data-id="${t.id}">
                    <td><input type="checkbox" class="select-task" data-id="${t.id}"></td>
                    <td>
                        <div style="display:flex;flex-direction:column;">
                            <strong>${t.name || '-'}</strong>
                            <small style="color:var(--color-text-secondary);">${t.desc || ''}</small>
                        </div>
                    </td>
                    <td>${t.category || '-'}</td>
                    <td>${t.priority || '-'}</td>
                    <td><span class="status-badge ${cls}">${label}</span></td>
                    <td>${formatDate(t.dueDate)}</td>
                    <td>
                        <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
                            ${user && user.role === 'admin' ? `<button class="button tertiary small edit-task-btn" data-id="${t.id}">Edit</button><button class="button tertiary small delete-task-btn" data-id="${t.id}">Delete</button>` : ''}
                        </div>
                    </td>
                </tr>
            `}).join('');

            tbody.innerHTML = rows;
        } catch (err) {
            console.error('Error loading tasks', err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:red;">Error loading tasks.</td></tr>`;
        }
    }

    // Modal logic reuse
    function openTaskModal(task=null) {
        const backdrop = document.createElement('div');
        backdrop.classList.add('modal-backdrop');
        backdrop.id = 'taskModalBackdrop';

        const title = task ? 'Edit Task' : 'Create New Task';
        const dueVal = task?.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : '';
        backdrop.innerHTML = `
            <div class="modal">
                <div class="modal-header"><h2 class="modal-title">${title}</h2><button class="modal-close" id="closeTaskModalBtn">&times;</button></div>
                <form id="taskForm" class="form">
                    <div class="field"><label class="label">Name</label><input class="input" id="taskName" value="${task?.name||''}" required></div>
                    <div class="field"><label class="label">Description</label><textarea class="input" id="taskDesc" rows="2">${task?.desc||''}</textarea></div>
                    <div style="display:flex;gap:0.75rem;margin-bottom:0.5rem;"><div class="field" style="flex:1;"><label class="label">Assignee</label><input class="input" id="taskAssignee" value="${task?.assignee||''}"></div><div class="field" style="width:160px;"><label class="label">Priority</label><select id="taskPriority" class="input"><option>Low</option><option ${task?.priority==='Medium'?'selected':''}>Medium</option><option ${task?.priority==='High'?'selected':''}>High</option></select></div></div>
                    <div style="display:flex;gap:0.75rem;margin-bottom:0.5rem;"><div style="flex:1;"><label class="label">Status</label><select id="taskStatus" class="input"><option value="pending" ${task?.status==='pending'?'selected':''}>Pending</option><option value="preparing" ${task?.status==='preparing'?'selected':''}>In Progress</option><option value="ready" ${task?.status==='ready'?'selected':''}>Pending Review</option><option value="delivered" ${task?.status==='delivered'?'selected':''}>Completed</option></select></div><div style="width:160px;"><label class="label">Due date</label><input class="input" type="date" id="taskDue" value="${dueVal}"></div></div>
                    <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.5rem;"><button type="button" class="button tertiary" id="cancelTaskModalBtn">Cancel</button><button type="submit" class="button primary">${task ? 'Save' : 'Create'}</button></div>
                </form>
            </div>
        `;

        document.body.appendChild(backdrop);
        // focus name for accessibility
        const firstInput = document.getElementById('taskName');
        if (firstInput) firstInput.focus();
        attachModalEvents(task?.id);
    }

    function closeTaskModal() { const b = document.getElementById('taskModalBackdrop'); if (b) b.remove(); }

    function attachModalEvents(editId=null) {
        const backdrop = document.getElementById('taskModalBackdrop');
        if (!backdrop) return;
        const closeBtn = backdrop.querySelector('#closeTaskModalBtn');
        const cancelBtn = backdrop.querySelector('#cancelTaskModalBtn');
        const form = backdrop.querySelector('#taskForm');

        closeBtn.addEventListener('click', closeTaskModal);
        cancelBtn.addEventListener('click', closeTaskModal);
        backdrop.addEventListener('click', e => { if (e.target === backdrop) closeTaskModal(); });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = form.querySelector('#taskName').value.trim();
            const desc = form.querySelector('#taskDesc').value.trim();
            const assignee = form.querySelector('#taskAssignee').value.trim();
            const status = form.querySelector('#taskStatus').value;
            const priority = form.querySelector('#taskPriority').value;
            const dueDate = form.querySelector('#taskDue').value;

            // simple validation
            let errEl = form.querySelector('.error-msg');
            if (errEl) errEl.remove();
            if (!name) {
                errEl = document.createElement('div');
                errEl.className = 'error-msg';
                errEl.style.color = 'var(--color-danger, #d9534f)';
                errEl.style.marginTop = '0.5rem';
                errEl.textContent = 'Please provide a name for the task.';
                form.appendChild(errEl);
                form.querySelector('#taskName').focus();
                return;
            }

            try {
                if (editId) {
                    await taskService.updateTask(editId, { name, desc, assignee, status, priority, dueDate });
                } else {
                    await taskService.createTask({ name, desc, assignee, status, priority, dueDate, createdAt: new Date().toISOString() });
                }
                closeTaskModal();
                await renderTable(currentFilter, main.querySelector('#tasksSearchFull').value);
                await renderMetrics();
            } catch (err) {
                console.error('Error saving task', err);
                const err2 = document.createElement('div');
                err2.className = 'error-msg';
                err2.style.color = 'var(--color-danger, #d9534f)';
                err2.style.marginTop = '0.5rem';
                err2.textContent = 'Error saving task. Try again.';
                form.appendChild(err2);
            }
        });
    }

    // Events
    let currentFilter = 'All';
    controls.querySelectorAll('.tab-button').forEach(btn => btn.addEventListener('click', async (e) => {
        controls.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentFilter = e.currentTarget.dataset.status;
        await renderTable(currentFilter, main.querySelector('#tasksSearchFull').value);
    }));

    main.querySelector('#tasksSearchFull').addEventListener('input', async (e) => {
        await renderTable(currentFilter, e.target.value);
    });

    tableWrap.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-task-btn');
        if (editBtn) {
            const id = editBtn.dataset.id;
            try { const t = await taskService.getTaskById(id); openTaskModal(t); } catch (err) { console.error('Load task', err); alert('Could not load task'); }
            return;
        }
        const deleteBtn = e.target.closest('.delete-task-btn');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (!confirm('Delete this task?')) return;
            try {
                await taskService.deleteTask(id);
                await renderTable(currentFilter, main.querySelector('#tasksSearchFull').value);
                await renderMetrics();
            } catch (err) { console.error('Delete task', err); alert('Error deleting task'); }
            return;
        }
    });

    // New task
    const newBtn = main.querySelector('#newTaskBtn');
    if (newBtn) newBtn.addEventListener('click', () => openTaskModal(null));

    // Initial load
    await renderMetrics();
    await renderTable();

    return main;
}
