import { getCurrentUser } from '../services/authService.js';

export async function ProfileView() {
    const user = getCurrentUser();

    // Contenedor principal
    const main = document.createElement('main');
    main.classList.add('profile-container'); // Clase para el padding general

    // 1. Título Superior (Fuera de las columnas)
    const headerTitle = document.createElement('h1');
    headerTitle.classList.add('page-title');
    headerTitle.textContent = 'My Profile';
    headerTitle.style.marginBottom = '1.5rem';
    main.appendChild(headerTitle);

    // Contenedor del layout (Flexbox de 2 columnas)
    const layout = document.createElement('div');
    layout.classList.add('layout-grid');
    layout.style.display = 'flex';
    layout.style.gap = '2rem';

    // 2. Sección Izquierda: Tarjeta de Perfil
    const left = document.createElement('section');
    left.style.flex = '0 0 300px'; // Ancho fijo para la columna izquierda
    left.innerHTML = `
        <div class="card profile-card" style="text-align:center; padding: 2rem;">
            <div class="avatar-container" style="position: relative; display: inline-block;">
                <img src="https://ui-avatars.com{encodeURIComponent(user.name || 'User')}&background=E8F8FF&color=0074D9&size=120" 
                     alt="${user.name}" 
                     style="border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            </div>
            <h2 style="margin-top: 1rem; font-size: 1.25rem;">${user.name}</h2>
            <span class="badge-role" style="background: #0056b3; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; display: inline-block; margin-top: 0.5rem;">
                ${user.role}
            </span>
            
            <div class="email-box" style="background: #f8f9fa; border: 1px solid #eee; padding: 10px; border-radius: 8px; margin: 1.5rem 0; font-size: 0.9rem;">
                📧 ${user.email}
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 1rem;">
                <div style="font-weight: 800; font-size: 1.5rem;" id="profileTaskCount">0</div>
                <div style="color: #666; font-size: 0.8rem; text-transform: uppercase;">Tasks</div>
            </div>
        </div>
    `;

    // 3. Sección Derecha: Información Personal
    const right = document.createElement('section');
    right.style.flex = '1'; // Que ocupe el resto del espacio
    right.innerHTML = `
        <div class="card" style="padding: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">Personal Information</h3>
                <button class="button-edit" id="editProfileBtn" style="background: none; border: 1px solid #ddd; padding: 5px 15px; border-radius: 5px; cursor: pointer;">
                    ✏️ Edit Profile
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <p class="label" style="color: #888; font-size: 0.85rem; margin-bottom: 5px;">Full Name</p>
                    <div style="font-weight: 500;">${user.name}</div>
                </div>
                <div>
                    <p class="label" style="color: #888; font-size: 0.85rem; margin-bottom: 5px;">Employee ID</p>
                    <div style="font-weight: 500;">CZ-882103</div>
                </div>
                <div>
                    <p class="label" style="color: #888; font-size: 0.85rem; margin-bottom: 5px;">Phone</p>
                    <div style="font-weight: 500;">+1 (555) 123-4567</div>
                </div>
                <div>
                    <p class="label" style="color: #888; font-size: 0.85rem; margin-bottom: 5px;">Department</p>
                    <div style="background: #FFE8A3; color: #856404; padding: 2px 8px; border-radius: 4px; display: inline-block; font-size: 0.9rem;">
                        Computer Science
                    </div>
                </div>
            </div>
        </div>
    `;

    layout.appendChild(left);
    layout.appendChild(right);
    main.appendChild(layout);

    // Lógica del contador de tareas
    const tasks = (() => { try { return JSON.parse(localStorage.getItem('tasks') || '[]'); } catch { return []; } })();
    const countEl = main.querySelector('#profileTaskCount');
    if (countEl) countEl.textContent = String(tasks.length || 0);

    return main;
}