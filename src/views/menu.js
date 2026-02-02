// javascript
import { Card } from '../components/Card.js';
import { LoadingView } from "../components/Loading.js";
import JsonService from "../services/jsonService.js";
import { getCurrentUser } from "../services/authService.js";
import { API_URLS } from "../utils/constants.js";

const taskService = new JsonService();

// Vista principal del menú (User Dashboard)
export async function menuView() {
    const user = getCurrentUser();

    // Protección extra: si no hay usuario, redirigimos a login
    if (!user) {
        window.location.hash = '#login';
        const main = document.createElement('main');
        main.classList.add('container');
        main.innerHTML = '<p>Por favor inicia sesión para ver tu panel.</p>';
        return main;
    }

    const main = document.createElement('main');
    main.classList.add('layout', 'dashboard-layout');

    const content = document.createElement('section');
    content.classList.add('content');

    const header = document.createElement('div');
    header.classList.add('section-header');
    header.innerHTML = `
        <h1 class="page-title">My Dashboard</h1>
        <span class="profile-role">User panel</span>
    `;

    const metricsWrapper = document.createElement('div');
    metricsWrapper.classList.add('metrics');
    metricsWrapper.innerHTML = LoadingView();

    async function renderTaskMetrics() {
        try {
            const tasks = await taskService.getTasks();
            const total = tasks.length;
            const inProgress = tasks.filter(t => ['preparing','in_progress','working'].includes((t.status||'').toString())).length;
            const completed = tasks.filter(t => ['delivered','completed'].includes((t.status||'').toString())).length;
            const pendingReview = tasks.filter(t => ['ready','review'].includes((t.status||'').toString())).length;

            metricsWrapper.innerHTML = `
                <div class="metric-card">
                    <div class="metric-icon primary">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M3 3H21V21H3V3Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="metric-info">
                        <p class="metric-label">Total Tasks</p>
                        <p class="metric-value">${total}</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon warning">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L12 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="metric-info">
                        <p class="metric-label">In Progress</p>
                        <p class="metric-value">${inProgress}</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon success">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="metric-info">
                        <p class="metric-label">Completed</p>
                        <p class="metric-value">${completed}</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon primary">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M10 4H14V10H10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M4 14H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="metric-info">
                        <p class="metric-label">Pending Review</p>
                        <p class="metric-value">${pendingReview}</p>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Error loading tasks metrics', err);
            metricsWrapper.innerHTML = `<p class="error">Error loading metrics.</p>`;
        }
    }


    content.appendChild(header);
    content.appendChild(metricsWrapper);

    // ==============================
    // Sección de TAREAS (lista tipo tablero)
    // ==============================
    const tasksSection = document.createElement('section');
    tasksSection.classList.add('tasks-section');
    tasksSection.innerHTML = `
        <div class="section-header">
            <h2 class="page-title">Tasks</h2>
            ${getCurrentUser().role === 'admin' ? '<button class="button primary" id="openTaskModalBtn">+ Add Task</button>' : ''}
        </div>

        <div class="tasks-controls" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
            <div class="search-wrapper" style="flex:1;min-width:200px;max-width:640px;">
                <input type="search" id="tasksSearch" class="search" placeholder="Search tasks (name, description, assignee, priority, status)...">
            </div>
            <div class="tab-group" id="taskTabs" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                <button class="tab-button active" data-status="All">All</button>
                <button class="tab-button" data-status="inprogress">In Progress</button>
                <button class="tab-button" data-status="pending_review">Pending Review</button>
                <button class="tab-button" data-status="completed">Completed</button>
            </div>
        </div>

        <div class="table-container" style="margin-top:1rem;overflow:auto;">
            <table class="table task-list">
                <thead>
                    <tr>
                        <th>TASK NAME</th>
                        <th>ASSIGNEE</th>
                        <th>STATUS</th>
                        <th>PRIORITY</th>
                        <th>DUE DATE</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody id="tasks-table-body">
                    <tr>
                        <td colspan="6" style="text-align:center;padding:1.5rem;">Cargando tareas...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    content.appendChild(tasksSection);



    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
    }

    async function renderTasksTable(statusFilter = 'All', searchTerm = '') {
        const tbody = tasksSection.querySelector('#tasks-table-body');
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.5rem;">Cargando tareas...</td></tr>`;
        try {
            const tasks = await taskService.getTasks();
            const q = (searchTerm || '').trim().toLowerCase();

            const filtered = tasks.filter(t => {
                // Status mapping for UI tabs
                let statusMatch = true;
                if (statusFilter && statusFilter !== 'All') {
                    if (statusFilter === 'inprogress') statusMatch = ['preparing','in_progress','working'].includes((t.status||'').toString());
                    else if (statusFilter === 'pending_review') statusMatch = ['ready','review'].includes((t.status||'').toString());
                    else if (statusFilter === 'completed') statusMatch = ['delivered','completed'].includes(t.status);
                    else statusMatch = t.status === statusFilter;
                }

                // Multi-field search
                const fields = [t.name, t.desc, t.assignee, t.priority, t.status].map(f => (f||'').toString().toLowerCase());
                const matchesSearch = !q || fields.some(f => f.includes(q));
                return statusMatch && matchesSearch;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center;padding:1.5rem;">No tasks found.</td>
                    </tr>`;
                return;
            }

            const rows = filtered.map(t => `
                <tr data-id="${t.id}">
                    <td>
                        <div style="display:flex;align-items:center;gap:0.75rem;">
                            <div style="width:36px;height:36px;border-radius:50%;background:#F3F3F3;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);font-weight:700;">${(t.assignee||'U').charAt(0)}</div>
                            <div>
                                <div style="font-weight:700">${t.name}</div>
                                <div style="font-size:0.9rem;color:var(--color-text-secondary)">${t.desc || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td>${t.assignee || '-'}</td>
                    <td><span class="status-badge ${t.status}">${t.status}</span></td>
                    <td>${t.priority}</td>
                    <td>${formatDate(t.dueDate)}</td>
                    <td>
                        <div style="display:flex;gap:0.5rem;align-items:center;">
                            ${getCurrentUser().role === 'admin' ? `<button class="button tertiary small edit-task-btn" data-id="${t.id}">Edit</button><button class="button tertiary small delete-task-btn" data-id="${t.id}">Delete</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');

            tbody.innerHTML = rows;
        } catch (err) {
            console.error('Error loading tasks', err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:red;">Error loading tasks.</td></tr>`;
        }
    }

    // Modal for tasks
    function openTaskModal(task = null) {
        const backdrop = document.createElement('div');
        backdrop.classList.add('modal-backdrop');
        backdrop.id = 'taskModalBackdrop';

        const title = task ? 'Edit Task' : 'Create Task';
        const name = task?.name || '';
        const desc = task?.desc || '';
        const assignee = task?.assignee || '';
        const status = task?.status || 'pending';
        const priority = task?.priority || 'Medium';
        const dueDate = task?.dueDate || '';

        backdrop.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" id="closeTaskModalBtn">&times;</button>
                </div>
                <form id="taskForm" class="form">
                    <div class="field">
                        <label class="label">Name</label>
                        <input class="input" id="taskName" value="${name}" required>
                    </div>
                    <div class="field">
                        <label class="label">Description</label>
                        <textarea class="input" id="taskDesc" rows="2">${desc}</textarea>
                    </div>
                    <div class="field">
                        <label class="label">Assignee</label>
                        <input class="input" id="taskAssignee" value="${assignee}">
                    </div>
                    <div style="display:flex;gap:0.75rem;">
                        <div class="field" style="flex:1;">
                            <label class="label">Status</label>
                            <select id="taskStatus" class="input">
                                <option value="pending" ${status==='pending'?'selected':''}>pending</option>
                                <option value="preparing" ${status==='preparing'?'selected':''}>in progress</option>
                                <option value="ready" ${status==='ready'?'selected':''}>ready</option>
                                <option value="delivered" ${status==='delivered'?'selected':''}>completed</option>
                            </select>
                        </div>
                        <div class="field" style="width:160px;">
                            <label class="label">Priority</label>
                            <select id="taskPriority" class="input">
                                <option>Low</option>
                                <option ${priority==='Medium'?'selected':''}>Medium</option>
                                <option ${priority==='High'?'selected':''}>High</option>
                            </select>
                        </div>
                    </div>
                    <div class="field">
                        <label class="label">Due date</label>
                        <input class="input" type="date" id="taskDue" value="${dueDate}">
                    </div>

                    <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.5rem;">
                        <button type="button" class="button tertiary" id="cancelTaskModalBtn">Cancel</button>
                        <button type="submit" class="button primary" id="saveTaskBtn">${task? 'Save' : 'Create'}</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(backdrop);
        attachTaskModalEvents(task?.id);
    }

    function closeTaskModal() {
        const b = document.getElementById('taskModalBackdrop'); if (b) b.remove();
    }

    function attachTaskModalEvents(editId = null) {
        const backdrop = document.getElementById('taskModalBackdrop');
        if (!backdrop) return;
        const closeBtn = backdrop.querySelector('#closeTaskModalBtn');
        const cancelBtn = backdrop.querySelector('#cancelTaskModalBtn');
        const form = backdrop.querySelector('#taskForm');

        closeBtn.addEventListener('click', closeTaskModal);
        cancelBtn.addEventListener('click', closeTaskModal);
        backdrop.addEventListener('click', e => { if (e.target === backdrop) closeTaskModal(); });

        form.addEventListener('submit', e => {
            e.preventDefault();
            const name = form.querySelector('#taskName').value.trim();
            const desc = form.querySelector('#taskDesc').value.trim();
            const assignee = form.querySelector('#taskAssignee').value.trim();
            const status = form.querySelector('#taskStatus').value;
            const priority = form.querySelector('#taskPriority').value;
            const dueDate = form.querySelector('#taskDue').value;

            (async () => {
                try {
                    if (editId) {
                        await taskService.updateTask(editId, { name, desc, assignee, status, priority, dueDate });
                    } else {
                        await taskService.createTask({ name, desc, assignee, status, priority, dueDate, createdAt: new Date().toISOString() });
                    }
                    closeTaskModal();
                    const statusFilter = tasksSection.querySelector('.tab-button.active').dataset.status;
                    const search = tasksSection.querySelector('#tasksSearch').value;
                    await renderTasksTable(statusFilter, search);
                    await renderTaskMetrics();
                } catch (err) {
                    console.error('Error saving task', err);
                    alert('Error saving task');
                }
            })();
        });
    }

    // Events for tasks UI
    tasksSection.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', e => {
            tasksSection.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            renderTasksTable(e.currentTarget.dataset.status, tasksSection.querySelector('#tasksSearch').value);
        });
    });

    tasksSection.querySelector('#tasksSearch').addEventListener('input', e => {
        const status = tasksSection.querySelector('.tab-button.active').dataset.status;
        renderTasksTable(status, e.target.value);
    });

    // Open modal (admin only)
    const openTaskBtn = tasksSection.querySelector('#openTaskModalBtn');
    if (openTaskBtn) openTaskBtn.addEventListener('click', () => openTaskModal(null));

    // Delegation for edit/delete
    tasksSection.querySelector('.task-list').addEventListener('click', e => {
        const editBtn = e.target.closest('.edit-task-btn');
        if (editBtn) {
            const id = editBtn.dataset.id;
            taskService.getTaskById(id).then(t => openTaskModal(t)).catch(err => { console.error('Error loading task', err); alert('Error loading task'); });
            return;
        }
        const deleteBtn = e.target.closest('.delete-task-btn');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (!confirm('Delete this task?')) return;
            (async () => {
                try {
                    await taskService.deleteTask(id);
                    const status = tasksSection.querySelector('.tab-button.active').dataset.status;
                    await renderTasksTable(status, tasksSection.querySelector('#tasksSearch').value);
                    await renderTaskMetrics();
                } catch (err) {
                    console.error('Error deleting task', err);
                    alert('Error deleting task');
                }
            })();
        }
    });

    // Initial render
    await renderTasksTable();
    await renderTaskMetrics();

    const sidebar = document.createElement('aside');
    sidebar.classList.add('sidebar');
    sidebar.innerHTML = `
        <div class="profile-card">
            <div class="avatar">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0074D9&color=fff&size=120" alt="${user.name}">
            </div>
            <h2 class="profile-name">${user.name}</h2>
            <p class="profile-email">${user.email}</p>
            <span class="profile-role">User</span>
        </div>

        <nav class="menu-list">
            <a href="#menu" class="menu-item">
                <span>Volver al menú</span>
            </a>
            <a href="#orders" class="menu-item">
                <span>Mis pedidos</span>
            </a>
        </nav>

        <footer class="page-footer">
            CRUDZASO<br>
            ¡Gracias por tu compra!
        </footer>
    `;

    main.appendChild(content);
    main.appendChild(sidebar);

    // Cargar datos asíncronos del usuario (no hay tabla de pedidos aquí)
    loadUserDashboardData(metricsWrapper, null, user);

    return main;
}

async function loadUserDashboardData(metricsContainer, ordersTbody, user) {
    try {
        const [productsRes, ordersRes] = await Promise.all([
            fetch(API_URLS.PRODUCTS),
            fetch(API_URLS.ORDERS)
        ]);

        if (!productsRes.ok || !ordersRes.ok) {
            throw new Error('Error al cargar datos del servidor');
        }

        const products = await productsRes.json();
        const orders = await ordersRes.json();

        const userOrders = orders.filter(o => String(o.userId) === String(user.id) || o.user?.email === user.email);

        const totalProducts = products.length;
        const totalOrders = userOrders.length;
        const totalSpent = userOrders.reduce((acc, o) => acc + (o.total || 0), 0);

        metricsContainer.innerHTML = `
            <div class="metric-card">
                <div class="metric-icon primary">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M3 3H21V21H3V3Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="metric-info">
                    <p class="metric-label">Total Task</p>
                    <p class="metric-value">${totalProducts}</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon warning">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M4 4H20V20H4V4Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 9H16" stroke="currentColor" stroke-width="2"
                              stroke-linecap="round"/>
                        <path d="M8 13H13" stroke="currentColor" stroke-width="2"
                              stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="metric-info">
                    <p class="metric-label">Completed</p>
                    <p class="metric-value">${totalOrders}</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon success">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 1V23" stroke="currentColor" stroke-width="2"
                              stroke-linecap="round"/>
                        <path d="M5 8C6.5 6 8.5 5 12 5C15.5 5 17.5 6 19 8" stroke="currentColor"
                              stroke-width="2" stroke-linecap="round"/>
                        <path d="M5 16C6.5 18 8.5 19 12 19C15.5 19 17.5 18 19 16" stroke="currentColor"
                              stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="metric-info">
                    <p class="metric-label">Overall Progress</p>
                    <p class="metric-value"> ${totalSpent.toFixed(2)}</p>
                </div>
            </div>
        `;

        const sorted = [...userOrders].sort((a,b) => (new Date(b.createdAt||0)) - (new Date(a.createdAt||0)));

        const rowsHtml = sorted.slice(0, 10).map(o => {
            const date = o.createdAt ? new Date(o.createdAt).toLocaleString() : '-';
            const status = o.status || 'pending';
            const total = (o.total || 0).toFixed(2);
            return `
                <tr>
                    <td class="id">#${o.id}</td>
                    <td>${date}</td>
                    <td>
                        <span class="status-badge ${status}">
                            ${status}
                        </span>
                    </td>
                    <td class="price">$ ${total}</td>
                </tr>
            `;
        }).join('');

        if (ordersTbody) {
            ordersTbody.innerHTML = rowsHtml || `
                <tr>
                    <td colspan="4" style="text-align:center;padding:1.5rem;">
                        No tienes pedidos todavía.
                    </td>
                </tr>`;
        }

    } catch (error) {
        console.error('User dashboard error:', error);
        metricsContainer.innerHTML = `<p class="error">No se pudieron cargar las métricas.</p>`;
        if (ordersTbody) {
            ordersTbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;padding:1.5rem;color:red;">
                        Error cargando pedidos.
                    </td>
                </tr>`;
        }
    }
}