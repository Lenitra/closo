// ==========================================================================
// Closo App - JavaScript
// ==========================================================================

const API_BASE_URL = 'http://localhost:8055';

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initUserMenu();
    initModal();
    loadUserInfo();
    loadGroups();
});

// --------------------------------------------------------------------------
// Auth Check
// --------------------------------------------------------------------------
function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// --------------------------------------------------------------------------
// User Menu
// --------------------------------------------------------------------------
function initUserMenu() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
}

// --------------------------------------------------------------------------
// Modal
// --------------------------------------------------------------------------
function initModal() {
    const modal = document.getElementById('createModal');
    const createBtn = document.getElementById('createGroupBtn');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('createGroupForm');

    function openModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (form) form.reset();
    }

    if (createBtn) {
        createBtn.addEventListener('click', openModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // TODO: API call to create group
            closeModal();
            showNotification('Groupe cree avec succes !');
        });
    }
}

// --------------------------------------------------------------------------
// Load User Info
// --------------------------------------------------------------------------
function loadUserInfo() {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            updateUserUI(user);
        } catch (e) {
            console.error('Error parsing stored user:', e);
        }
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/users/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            // Token invalide ou expire, rediriger vers login
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) throw new Error('Not authenticated');
        return response.json();
    })
    .then(user => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            updateUserUI(user);
        }
    })
    .catch(error => {
        console.error('Error fetching user:', error);
    });
}

function updateUserUI(user) {
    const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';

    const userInitial = document.getElementById('userInitial');
    const dropdownInitial = document.getElementById('dropdownInitial');
    const welcomeName = document.getElementById('welcomeName');
    const dropdownUsername = document.getElementById('dropdownUsername');
    const dropdownEmail = document.getElementById('dropdownEmail');

    if (userInitial) userInitial.textContent = initial;
    if (dropdownInitial) dropdownInitial.textContent = initial;
    if (welcomeName) welcomeName.textContent = user.username || 'Utilisateur';
    if (dropdownUsername) dropdownUsername.textContent = user.username || 'Utilisateur';
    if (dropdownEmail) dropdownEmail.textContent = user.email || '';
}

// --------------------------------------------------------------------------
// Load Groups
// --------------------------------------------------------------------------
const GROUP_COLORS = [
    'linear-gradient(135deg, #f472b6, #c084fc)',
    'linear-gradient(135deg, #60a5fa, #34d399)',
    'linear-gradient(135deg, #fbbf24, #f97316)',
    'linear-gradient(135deg, #a78bfa, #6366f1)',
    'linear-gradient(135deg, #14b8a6, #2dd4bf)',
    'linear-gradient(135deg, #ef4444, #f97316)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
];

function getGroupColor(groupId) {
    return GROUP_COLORS[groupId % GROUP_COLORS.length];
}

function loadGroups() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const groupsList = document.querySelector('.groups-list');
    if (!groupsList) return;

    // Afficher un loader
    groupsList.innerHTML = '<p class="loading-text">Chargement des groupes...</p>';

    fetch(`${API_BASE_URL}/groups/`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Erreur lors du chargement des groupes');
        return response.json();
    })
    .then(groups => {
        renderGroups(groups);
    })
    .catch(error => {
        console.error('Error fetching groups:', error);
        groupsList.innerHTML = '<p class="error-text">Erreur lors du chargement des groupes</p>';
    });
}

function renderGroups(groups) {
    const groupsList = document.querySelector('.groups-list');
    if (!groupsList) return;

    if (groups.length === 0) {
        groupsList.innerHTML = `
            <div class="empty-state">
                <p>Vous n'avez pas encore de groupe.</p>
                <p>Creez-en un ou rejoignez un groupe existant !</p>
            </div>
        `;
        return;
    }

    groupsList.innerHTML = groups.map(group => `
        <a href="group.html?id=${group.id}" class="group-item">
            <div class="group-avatar" style="background: ${getGroupColor(group.id)};">
                <span>${group.nom.charAt(0).toUpperCase()}</span>
            </div>
            <div class="group-info">
                <h3 class="group-name">${escapeHtml(group.nom)}</h3>
                ${group.description ? `<p class="group-last-activity">${escapeHtml(group.description)}</p>` : ''}
            </div>
            <div class="group-meta">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        </a>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --------------------------------------------------------------------------
// Notifications
// --------------------------------------------------------------------------
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>${message}</span>
    `;

    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 14px 20px;
                background: var(--color-gray-900);
                color: white;
                border-radius: var(--radius-full);
                box-shadow: var(--shadow-xl);
                z-index: 2000;
                animation: slideUp 0.3s ease;
            }
            .notification svg {
                color: #10b981;
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
