// ==========================================================================
// Closo Group Info Page - JavaScript
// ==========================================================================

const GROUP_COLORS = [
    'linear-gradient(135deg, #f472b6, #c084fc)',
    'linear-gradient(135deg, #60a5fa, #34d399)',
    'linear-gradient(135deg, #fbbf24, #f97316)',
    'linear-gradient(135deg, #a78bfa, #6366f1)',
    'linear-gradient(135deg, #14b8a6, #2dd4bf)',
    'linear-gradient(135deg, #ef4444, #f97316)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
];

let currentGroupId = null;
let currentGroup = null;
let currentUser = null;
let members = [];
let currentUserRole = 0;
let selectedMemberForRoleChange = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initGroupInfoPage();
    initModals();
    initAvatarUpload();
    initInviteCode();
    initRoleChangeModal();
});

// --------------------------------------------------------------------------
// Auth Check
// --------------------------------------------------------------------------
function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
    }

    // Load current user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
        } catch (e) {
            console.error('Error parsing stored user:', e);
        }
    }
}

// --------------------------------------------------------------------------
// Init Group Info Page
// --------------------------------------------------------------------------
function initGroupInfoPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentGroupId = urlParams.get('id');

    if (!currentGroupId) {
        window.location.href = 'app.html';
        return;
    }

    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.href = `group.html?id=${currentGroupId}`;
    }

    loadGroupInfo();
    loadMembers();
    loadGroupStats();
}

// --------------------------------------------------------------------------
// Load Group Info
// --------------------------------------------------------------------------
function loadGroupInfo() {
    const token = localStorage.getItem('access_token');

    fetch(`${API_BASE_URL}/groups/${currentGroupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Groupe introuvable');
        return response.json();
    })
    .then(group => {
        currentGroup = group;
        updateGroupUI(group);
    })
    .catch(error => {
        console.error('Error loading group:', error);
    });
}

function updateGroupUI(group) {
    const groupAvatar = document.getElementById('groupAvatar');
    const groupInitial = document.getElementById('groupInitial');
    const groupImage = document.getElementById('groupImage');
    const groupName = document.getElementById('groupName');
    const groupDescription = document.getElementById('groupDescription');

    const colorIndex = (group.id || 0) % GROUP_COLORS.length;
    if (groupAvatar) {
        groupAvatar.style.background = GROUP_COLORS[colorIndex];
    }

    // Display group image if exists
    if (group.image_url) {
        console.log('Group has image:', group.image_url);
        if (groupImage) {
            groupImage.src = `${API_BASE_URL}${group.image_url}`;
            groupImage.style.display = 'block';
            console.log('Image src set to:', groupImage.src);
        }
        if (groupInitial) {
            groupInitial.style.visibility = 'hidden';
        }
    } else {
        console.log('Group has no image');
        if (groupImage) {
            groupImage.style.display = 'none';
        }
        if (groupInitial) {
            groupInitial.style.visibility = 'visible';
            groupInitial.textContent = group.nom ? group.nom.charAt(0).toUpperCase() : 'G';
        }
    }

    if (groupName) {
        groupName.textContent = group.nom || 'Groupe';
    }

    if (groupDescription) {
        groupDescription.textContent = group.description || '';
    }

    document.title = `Closo - ${group.nom || 'Groupe'}`;
}

// --------------------------------------------------------------------------
// Load Group Stats
// --------------------------------------------------------------------------
function loadGroupStats() {
    const token = localStorage.getItem('access_token');

    // Load members count
    fetch(`${API_BASE_URL}/groups/${currentGroupId}/members/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.ok ? response.json() : { count: 0 })
    .then(data => {
        const membersCountEl = document.getElementById('membersCount');
        if (membersCountEl) {
            membersCountEl.textContent = data.count || 0;
        }
    })
    .catch(error => console.error('Error loading members count:', error));

    // Load posts count (from media)
    fetch(`${API_BASE_URL}/media/group/${currentGroupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.ok ? response.json() : [])
    .then(medias => {
        const postIds = new Set(medias.map(m => m.post_id));
        const postsCountEl = document.getElementById('postsCount');
        if (postsCountEl) {
            postsCountEl.textContent = postIds.size;
        }
    })
    .catch(error => console.error('Error loading posts count:', error));
}

// --------------------------------------------------------------------------
// Load Members
// --------------------------------------------------------------------------
function loadMembers() {
    const token = localStorage.getItem('access_token');
    const membersList = document.getElementById('membersList');

    if (!membersList) return;

    fetch(`${API_BASE_URL}/groupmembers/group/${currentGroupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error loading members');
        return response.json();
    })
    .then(membersData => {
        members = membersData;
        renderMembers(membersData);
        updateUIPermissions(membersData);
    })
    .catch(error => {
        console.error('Error loading members:', error);
        membersList.innerHTML = `
            <div class="empty-members">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>Impossible de charger les membres</p>
            </div>
        `;
    });
}

function renderMembers(membersData) {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;

    if (!membersData || membersData.length === 0) {
        membersList.innerHTML = `
            <div class="empty-members">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>Aucun membre</p>
            </div>
        `;
        return;
    }

    membersList.innerHTML = membersData.map(member => createMemberItem(member)).join('');
}

function createMemberItem(member) {
    const user = member.user;
    if (!user) return '';

    const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
    const colorIndex = (user.id || 0) % GROUP_COLORS.length;
    const color = GROUP_COLORS[colorIndex];
    const avatarUrl = user.avatar_url ? `${API_BASE_URL}${user.avatar_url}` : null;

    let roleLabel = 'Membre';
    let roleClass = '';
    if (member.role === 3) {
        roleLabel = 'Createur';
        roleClass = 'creator';
    } else if (member.role === 2) {
        roleLabel = 'Admin';
        roleClass = 'admin';
    }

    const isCurrentUser = currentUser && user.id === currentUser.id;
    const canManage = currentUser && (member.role !== 3) && !isCurrentUser;
    // Only creator (role 3) can change roles
    const canChangeRole = currentUserRole === 3 && member.role !== 3 && !isCurrentUser;

    // Role tag: clickable if creator can change role
    const roleTag = canChangeRole
        ? `<button class="member-role clickable ${roleClass}" onclick="toggleMemberRole(${member.id}, '${escapeHtml(user.username || 'Utilisateur')}', ${member.role})" title="Cliquez pour modifier le role">${roleLabel}</button>`
        : `<span class="member-role ${roleClass}">${roleLabel}</span>`;

    return `
        <div class="member-item">
            <div class="member-avatar" style="background: ${color}">
                ${avatarUrl ? `<img src="${avatarUrl}" alt="${escapeHtml(user.username || 'Utilisateur')}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span>${initial}</span>`}
            </div>
            <div class="member-info">
                <p class="member-name">${escapeHtml(user.username || 'Utilisateur')}${isCurrentUser ? ' (Vous)' : ''}</p>
                <p class="member-email">${escapeHtml(user.email || '')}</p>
            </div>
            ${roleTag}
            ${canManage ? `
                <div class="member-actions">
                    <button class="member-action-btn danger" onclick="removeMember(${member.id})" title="Retirer">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

async function removeMember(memberId) {
    const confirmed = await showConfirm({
        title: 'Retirer le membre',
        message: 'Voulez-vous vraiment retirer ce membre du groupe ?',
        confirmText: 'Retirer',
        cancelText: 'Annuler',
        danger: true
    });

    if (!confirmed) return;

    const token = localStorage.getItem('access_token');

    fetch(`${API_BASE_URL}/groupmembers/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error removing member');
        showNotification('Membre retire du groupe');
        loadMembers();
        loadGroupStats();
    })
    .catch(error => {
        console.error('Error removing member:', error);
        showNotification('Erreur lors de la suppression', 'error');
    });
}

// --------------------------------------------------------------------------
// Update UI Permissions
// --------------------------------------------------------------------------
function updateUIPermissions(membersData) {
    if (!currentUser) return;

    // Find current user's membership
    const currentMember = membersData.find(m => m.user && m.user.id === currentUser.id);
    if (!currentMember) return;

    currentUserRole = currentMember.role;
    const isAdmin = currentMember.role >= 2; // role 2 = admin, role 3 = creator

    // Show/hide edit buttons based on permissions
    const editGroupInfoBtn = document.getElementById('editGroupInfoBtn');
    const editGroupAvatarBtn = document.getElementById('editGroupAvatarBtn');
    const showInviteBtn = document.getElementById('showInviteCodeBtn');
    const regenerateBtn = document.getElementById('regenerateInviteCode');

    if (editGroupInfoBtn) {
        editGroupInfoBtn.style.display = isAdmin ? '' : 'none';
    }
    if (editGroupAvatarBtn) {
        editGroupAvatarBtn.style.display = isAdmin ? '' : 'none';
    }
    if (regenerateBtn) {
        // Only admins can regenerate the invite code
        regenerateBtn.style.display = isAdmin ? '' : 'none';
    }
    // All members can see the invite button and code
}

// --------------------------------------------------------------------------
// Modals
// --------------------------------------------------------------------------
function initModals() {
    // Edit Group Info Modal
    const editGroupInfoModal = document.getElementById('editGroupInfoModal');
    const editGroupInfoBtn = document.getElementById('editGroupInfoBtn');
    const closeEditGroupInfoModal = document.getElementById('closeEditGroupInfoModal');
    const cancelEditGroupInfo = document.getElementById('cancelEditGroupInfo');
    const editGroupInfoForm = document.getElementById('editGroupInfoForm');

    function openEditGroupInfoModal() {
        if (currentGroup) {
            document.getElementById('editGroupName').value = currentGroup.nom || '';
            document.getElementById('editGroupDescription').value = currentGroup.description || '';
        }
        editGroupInfoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeEditGroupInfoModalFn() {
        editGroupInfoModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (editGroupInfoBtn) editGroupInfoBtn.addEventListener('click', openEditGroupInfoModal);
    if (closeEditGroupInfoModal) closeEditGroupInfoModal.addEventListener('click', closeEditGroupInfoModalFn);
    if (cancelEditGroupInfo) cancelEditGroupInfo.addEventListener('click', closeEditGroupInfoModalFn);
    if (editGroupInfoModal) {
        editGroupInfoModal.addEventListener('click', (e) => {
            if (e.target === editGroupInfoModal) closeEditGroupInfoModalFn();
        });
    }

    if (editGroupInfoForm) {
        editGroupInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nom = document.getElementById('editGroupName').value;
            const description = document.getElementById('editGroupDescription').value;

            const token = localStorage.getItem('access_token');

            fetch(`${API_BASE_URL}/groups/${currentGroupId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom, description })
            })
            .then(response => {
                if (!response.ok) throw new Error('Error updating group');
                return response.json();
            })
            .then(group => {
                currentGroup = group;
                updateGroupUI(group);
                showNotification('Groupe mis a jour !');
                closeEditGroupInfoModalFn();
            })
            .catch(error => {
                console.error('Error updating group:', error);
                showNotification('Erreur lors de la mise a jour', 'error');
            });
        });
    }

    // Leave/Delete Group
    const leaveGroupBtn = document.getElementById('leaveGroupBtn');
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');

    if (leaveGroupBtn) {
        leaveGroupBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm({
                title: 'Quitter le groupe',
                message: 'Voulez-vous vraiment quitter ce groupe ?',
                confirmText: 'Quitter',
                cancelText: 'Annuler',
                danger: true
            });

            if (!confirmed) return;
            // TODO: Implement leave group functionality
            showNotification('Fonctionnalite a venir');
        });
    }

    if (deleteGroupBtn) {
        deleteGroupBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm({
                title: 'Supprimer le groupe',
                message: 'ATTENTION : Voulez-vous vraiment supprimer définitivement ce groupe ?',
                confirmText: 'Supprimer',
                cancelText: 'Annuler',
                danger: true
            });

            if (!confirmed) return;
            // TODO: Implement delete group functionality
            showNotification('Fonctionnalite a venir');
        });
    }

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEditGroupInfoModalFn();
        }
    });
}

// --------------------------------------------------------------------------
// Avatar Upload
// --------------------------------------------------------------------------
function initAvatarUpload() {
    const editGroupAvatarBtn = document.getElementById('editGroupAvatarBtn');
    const groupAvatarInput = document.getElementById('groupAvatarInput');

    if (editGroupAvatarBtn && groupAvatarInput) {
        editGroupAvatarBtn.addEventListener('click', () => {
            groupAvatarInput.click();
        });

        groupAvatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Verify file is an image
            if (!file.type.startsWith('image/')) {
                showNotification('Le fichier doit etre une image', 'error');
                return;
            }

            // Preview image
            const reader = new FileReader();
            reader.onload = (event) => {
                const groupImage = document.getElementById('groupImage');
                const groupInitial = document.getElementById('groupInitial');

                if (groupImage) {
                    groupImage.src = event.target.result;
                    groupImage.style.display = 'block';
                }
                if (groupInitial) {
                    groupInitial.style.visibility = 'hidden';
                }
            };
            reader.readAsDataURL(file);

            // Upload to server
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${API_BASE_URL}/groups/${currentGroupId}/upload-image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de l\'upload de l\'image');
                }

                const updatedGroup = await response.json();
                currentGroup = updatedGroup;
                showNotification('Photo du groupe mise a jour !');
            } catch (error) {
                console.error('Error uploading group image:', error);
                showNotification('Erreur lors de l\'upload', 'error');
            }
        });
    }
}

// --------------------------------------------------------------------------
// Utilities
// --------------------------------------------------------------------------
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --------------------------------------------------------------------------
// Notifications
// --------------------------------------------------------------------------
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';

    const icon = type === 'success'
        ? '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';

    const iconColor = type === 'success' ? '#10b981' : '#ef4444';

    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color: ${iconColor}">
            ${icon}
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
                flex-shrink: 0;
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

// --------------------------------------------------------------------------
// Invite Code
// --------------------------------------------------------------------------
function initInviteCode() {
    const showInviteBtn = document.getElementById('showInviteCodeBtn');
    const inviteModal = document.getElementById('inviteCodeModal');
    const closeInviteBtn = document.getElementById('closeInviteCodeModal');
    const copyCodeBtn = document.getElementById('copyInviteCode');
    const regenerateBtn = document.getElementById('regenerateInviteCode');

    function openInviteModal() {
        if (currentGroup && currentGroup.invite_code) {
            document.getElementById('inviteCodeDisplay').textContent = currentGroup.invite_code;
        }
        inviteModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeInviteModal() {
        inviteModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (showInviteBtn) {
        showInviteBtn.addEventListener('click', openInviteModal);
    }

    if (closeInviteBtn) {
        closeInviteBtn.addEventListener('click', closeInviteModal);
    }

    if (inviteModal) {
        inviteModal.addEventListener('click', (e) => {
            if (e.target === inviteModal) {
                closeInviteModal();
            }
        });
    }

    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', async () => {
            const code = document.getElementById('inviteCodeDisplay').textContent;
            try {
                await navigator.clipboard.writeText(code);
                showNotification('Code copie dans le presse-papiers !');
            } catch (err) {
                console.error('Failed to copy:', err);
                showNotification('Erreur lors de la copie du code');
            }
        });
    }

    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm({
                title: 'Régénérer le code',
                message: 'Voulez-vous vraiment régénérer le code ? L\'ancien code ne fonctionnera plus.',
                confirmText: 'Régénérer',
                cancelText: 'Annuler',
                danger: true
            });

            if (!confirmed) {
                return;
            }

            const token = localStorage.getItem('access_token');
            const btn = regenerateBtn;
            btn.disabled = true;
            btn.textContent = 'Regeneration...';

            try {
                const response = await fetch(`${API_BASE_URL}/groups/${currentGroupId}/regenerate-invite-code`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || 'Erreur lors de la regeneration');
                }

                const data = await response.json();
                currentGroup.invite_code = data.invite_code;
                document.getElementById('inviteCodeDisplay').textContent = data.invite_code;
                showNotification('Nouveau code genere avec succes !');
            } catch (error) {
                console.error('Error regenerating code:', error);
                showNotification('Erreur: ' + error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Regenerer le code
                `;
            }
        });
    }
}

// --------------------------------------------------------------------------
// Role Change Modal
// --------------------------------------------------------------------------
function initRoleChangeModal() {
    const changeRoleModal = document.getElementById('changeRoleModal');
    const closeChangeRoleModalBtn = document.getElementById('closeChangeRoleModal');
    const setMemberRoleBtn = document.getElementById('setMemberRoleBtn');
    const setAdminRoleBtn = document.getElementById('setAdminRoleBtn');

    function closeChangeRoleModal() {
        changeRoleModal.classList.remove('active');
        document.body.style.overflow = '';
        selectedMemberForRoleChange = null;
    }

    if (closeChangeRoleModalBtn) {
        closeChangeRoleModalBtn.addEventListener('click', closeChangeRoleModal);
    }

    if (changeRoleModal) {
        changeRoleModal.addEventListener('click', (e) => {
            if (e.target === changeRoleModal) {
                closeChangeRoleModal();
            }
        });
    }

    if (setMemberRoleBtn) {
        setMemberRoleBtn.addEventListener('click', () => {
            changeMemberRole(1);
        });
    }

    if (setAdminRoleBtn) {
        setAdminRoleBtn.addEventListener('click', () => {
            changeMemberRole(2);
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && changeRoleModal.classList.contains('active')) {
            closeChangeRoleModal();
        }
    });
}

function openChangeRoleModal(memberId, memberName, currentRole) {
    selectedMemberForRoleChange = { memberId, memberName, currentRole };

    const changeRoleModal = document.getElementById('changeRoleModal');
    const memberNameEl = document.getElementById('changeRoleMemberName');
    const setMemberRoleBtn = document.getElementById('setMemberRoleBtn');
    const setAdminRoleBtn = document.getElementById('setAdminRoleBtn');

    if (memberNameEl) {
        memberNameEl.textContent = memberName;
    }

    // Highlight current role
    if (setMemberRoleBtn) {
        setMemberRoleBtn.classList.toggle('active', currentRole === 1);
    }
    if (setAdminRoleBtn) {
        setAdminRoleBtn.classList.toggle('active', currentRole === 2);
    }

    changeRoleModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function changeMemberRole(newRole) {
    if (!selectedMemberForRoleChange) return;

    const { memberId, memberName, currentRole } = selectedMemberForRoleChange;

    if (newRole === currentRole) {
        // Close modal if same role selected
        const changeRoleModal = document.getElementById('changeRoleModal');
        changeRoleModal.classList.remove('active');
        document.body.style.overflow = '';
        selectedMemberForRoleChange = null;
        return;
    }

    const roleLabel = newRole === 2 ? 'administrateur' : 'membre';
    const actionLabel = newRole === 2 ? 'Promouvoir' : 'Retrograder';

    const confirmed = await showConfirm({
        title: `${actionLabel} ${memberName}`,
        message: `Voulez-vous vraiment ${newRole === 2 ? 'promouvoir' : 'retrograder'} ${memberName} en ${roleLabel} ?`,
        confirmText: actionLabel,
        cancelText: 'Annuler',
        danger: newRole === 1
    });

    if (!confirmed) return;

    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(`${API_BASE_URL}/groupmembers/${memberId}/role`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur lors du changement de role');
        }

        showNotification(`${memberName} est maintenant ${roleLabel}`);

        // Close modal and reload members
        const changeRoleModal = document.getElementById('changeRoleModal');
        changeRoleModal.classList.remove('active');
        document.body.style.overflow = '';
        selectedMemberForRoleChange = null;

        loadMembers();
    } catch (error) {
        console.error('Error changing role:', error);
        showNotification('Erreur: ' + error.message, 'error');
    }
}

// Toggle role directly by clicking on the role tag
async function toggleMemberRole(memberId, memberName, currentRole) {
    // Toggle between member (1) and admin (2)
    const newRole = currentRole === 1 ? 2 : 1;
    const newRoleLabel = newRole === 2 ? 'administrateur' : 'membre';
    const actionLabel = newRole === 2 ? 'Promouvoir' : 'Retrograder';

    const confirmed = await showConfirm({
        title: `${actionLabel} ${memberName}`,
        message: `Voulez-vous vraiment ${newRole === 2 ? 'promouvoir' : 'retrograder'} ${memberName} en ${newRoleLabel} ?`,
        confirmText: actionLabel,
        cancelText: 'Annuler',
        danger: newRole === 1
    });

    if (!confirmed) return;

    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(`${API_BASE_URL}/groupmembers/${memberId}/role`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur lors du changement de role');
        }

        showNotification(`${memberName} est maintenant ${newRoleLabel}`);
        loadMembers();
    } catch (error) {
        console.error('Error toggling role:', error);
        showNotification('Erreur: ' + error.message, 'error');
    }
}
