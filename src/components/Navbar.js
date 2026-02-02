// javascript
/* src/components/Navbar.js */
import { logout } from '../services/authService.js';
import { getCurrentUser } from '../services/authService.js';

export function Navbar() {
    const user = getCurrentUser();

    const aside = document.createElement('aside');
    aside.classList.add('sidebar-nav');
    aside.innerHTML = `
        <div class="brand">
            <img src="src/assets/img/crudzasoLogo.png" 
         alt="Logo" 
         class="logo-icon" 
         style="width: 40px; height: 40px; object-fit: contain;">
    <span class="logo-text" style="font-weight: bold; font-size: 1.2rem;">CRUDZASO</span>

        </div>

        <nav class="nav-vertical">
            <a href="#menu" class="nav-link active">Dashboard</a>
            <a href="#tasks" class="nav-link">My Tasks</a>
            <a href="#profile" class="nav-link">Profile</a>
        </nav>

        <div class="nav-footer">
            <div class="user-info">
                <div class="avatar small">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=E8F8FF&color=0074D9&size=48" alt="${user?.name || 'User'}">
                </div>
                <div class="user-meta">
                    <div class="user-name">${user?.name || 'Guest'}</div>
                    <div class="user-email">${user?.email || ''}</div>
                </div>
            </div>
            <button id="logoutBtn" class="nav-link logout">Log out</button>
        </div>
    `;

    const nav = aside.querySelector('.nav-vertical');

    // Si es admin, agregamos el link Admin
    if (user && user.role === 'admin') {
        const adminLink = document.createElement('a');
        adminLink.href = '#dashboard';
        adminLink.classList.add('nav-link');
        adminLink.textContent = 'Admin';
        nav.appendChild(adminLink);
    }

    const logoutBtn = aside.querySelector('#logoutBtn');
    logoutBtn.addEventListener('click', () => logout());

    return aside;
}
