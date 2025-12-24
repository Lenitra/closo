// ==========================================================================
// Closo Profile Page - JavaScript
// ==========================================================================

const API_BASE_URL = 'http://localhost:8055';

// Couleurs pour les avatars
const GROUP_COLORS = [
    'linear-gradient(135deg, #f472b6, #c084fc)',
    'linear-gradient(135deg, #60a5fa, #34d399)',
    'linear-gradient(135deg, #fbbf24, #f97316)',
    'linear-gradient(135deg, #a78bfa, #6366f1)',
    'linear-gradient(135deg, #14b8a6, #2dd4bf)',
    'linear-gradient(135deg, #ef4444, #f97316)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
];

let currentUser = null;
let posts = [];
let groups = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initTabs();
    initModals();
    initPasswordToggles();
    initAvatarUpload();
    loadUserInfo();
    loadUserPosts();
    loadUserGroups();
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
// Tabs
// --------------------------------------------------------------------------
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}Tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// --------------------------------------------------------------------------
// Modals
// --------------------------------------------------------------------------
function initModals() {
    // Edit Profile Modal
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const settingsEditProfile = document.getElementById('settingsEditProfile');
    const closeEditProfileModal = document.getElementById('closeEditProfileModal');
    const cancelEditProfile = document.getElementById('cancelEditProfile');
    const editProfileForm = document.getElementById('editProfileForm');

    function openEditProfileModal() {
        if (currentUser) {
            document.getElementById('editUsername').value = currentUser.username || '';
            document.getElementById('editEmail').value = currentUser.email || '';
        }
        editProfileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeEditProfileModalFn() {
        editProfileModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (editProfileBtn) editProfileBtn.addEventListener('click', openEditProfileModal);
    if (settingsEditProfile) settingsEditProfile.addEventListener('click', openEditProfileModal);
    if (closeEditProfileModal) closeEditProfileModal.addEventListener('click', closeEditProfileModalFn);
    if (cancelEditProfile) cancelEditProfile.addEventListener('click', closeEditProfileModalFn);
    if (editProfileModal) {
        editProfileModal.addEventListener('click', (e) => {
            if (e.target === editProfileModal) closeEditProfileModalFn();
        });
    }

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // TODO: API call to update profile
            const username = document.getElementById('editUsername').value;
            const email = document.getElementById('editEmail').value;

            console.log('Updating profile:', { username, email });
            showNotification('Profil mis a jour !');
            closeEditProfileModalFn();

            // Update UI
            if (currentUser) {
                currentUser.username = username;
                currentUser.email = email;
                updateProfileUI(currentUser);
            }
        });
    }

    // Change Password Modal
    const changePasswordModal = document.getElementById('changePasswordModal');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const settingsChangePassword = document.getElementById('settingsChangePassword');
    const closeChangePasswordModal = document.getElementById('closeChangePasswordModal');
    const cancelChangePassword = document.getElementById('cancelChangePassword');
    const changePasswordForm = document.getElementById('changePasswordForm');

    function openChangePasswordModal() {
        changePasswordForm.reset();
        changePasswordModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeChangePasswordModalFn() {
        changePasswordModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (changePasswordBtn) changePasswordBtn.addEventListener('click', openChangePasswordModal);
    if (settingsChangePassword) settingsChangePassword.addEventListener('click', openChangePasswordModal);
    if (closeChangePasswordModal) closeChangePasswordModal.addEventListener('click', closeChangePasswordModalFn);
    if (cancelChangePassword) cancelChangePassword.addEventListener('click', closeChangePasswordModalFn);
    if (changePasswordModal) {
        changePasswordModal.addEventListener('click', (e) => {
            if (e.target === changePasswordModal) closeChangePasswordModalFn();
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                showNotification('Les mots de passe ne correspondent pas', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showNotification('Le mot de passe doit contenir au moins 8 caracteres', 'error');
                return;
            }

            // TODO: API call to change password
            console.log('Changing password');
            showNotification('Mot de passe modifie !');
            closeChangePasswordModalFn();
        });
    }

    // Post Detail Modal
    initPostDetailModal();

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEditProfileModalFn();
            closeChangePasswordModalFn();
            closeDetailModal();
        }
    });
}

// --------------------------------------------------------------------------
// Password Toggles
// --------------------------------------------------------------------------
function initPasswordToggles() {
    const toggles = document.querySelectorAll('.password-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.dataset.target;
            const input = document.getElementById(targetId);
            const eyeIcon = toggle.querySelector('.eye-icon');
            const eyeOffIcon = toggle.querySelector('.eye-off-icon');

            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                input.type = 'password';
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    });
}

// --------------------------------------------------------------------------
// Avatar Upload
// --------------------------------------------------------------------------
function initAvatarUpload() {
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');

    if (editAvatarBtn && avatarInput) {
        editAvatarBtn.addEventListener('click', () => {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Preview the image
                const reader = new FileReader();
                reader.onload = (event) => {
                    const profileImage = document.getElementById('profileImage');
                    const profileInitial = document.getElementById('profileInitial');

                    profileImage.src = event.target.result;
                    profileImage.style.display = 'block';
                    profileInitial.style.display = 'none';

                    // TODO: Upload to server
                    console.log('Uploading avatar:', file.name);
                    showNotification('Photo de profil mise a jour !');
                };
                reader.readAsDataURL(file);
            }
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
            currentUser = JSON.parse(storedUser);
            updateProfileUI(currentUser);
        } catch (e) {
            console.error('Error parsing stored user:', e);
        }
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (response.status === 401) {
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
            currentUser = user;
            localStorage.setItem('user', JSON.stringify(user));
            updateProfileUI(user);

            // Charger le nombre de posts
            return fetch(`${API_BASE_URL}/users/me/posts/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
    })
    .then(response => {
        if (response && response.ok) {
            return response.json();
        }
        return { count: 0 };
    })
    .then(data => {
        const postsCountEl = document.getElementById('postsCount');
        if (postsCountEl) {
            postsCountEl.textContent = data.count || 0;
        }
    })
    .catch(error => {
        console.error('Error fetching user:', error);
    });
}

function updateProfileUI(user) {
    const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';

    const profileInitial = document.getElementById('profileInitial');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');

    if (profileInitial) profileInitial.textContent = initial;
    if (profileUsername) profileUsername.textContent = user.username || 'Utilisateur';
    if (profileEmail) profileEmail.textContent = user.email || '';

    // Update avatar color based on user id
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar && user.id) {
        const colorIndex = user.id % GROUP_COLORS.length;
        profileAvatar.style.background = GROUP_COLORS[colorIndex];
    }

    // Update page title
    document.title = `Closo - ${user.username || 'Profil'}`;
}

// --------------------------------------------------------------------------
// Load User Posts
// --------------------------------------------------------------------------
function loadUserPosts() {
    const postsGrid = document.getElementById('postsGrid');
    if (!postsGrid) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // TODO: Replace with actual API endpoint for user posts
    // For now, we'll fetch all media and filter by user
    fetch(`${API_BASE_URL}/media/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error loading posts');
        return response.json();
    })
    .then(medias => {
        // Group medias by post
        const postMap = new Map();

        medias.forEach(media => {
            // Filter by current user if we have user info
            const postUser = media.post?.group_member?.user;
            if (currentUser && postUser && postUser.id !== currentUser.id) {
                return;
            }

            if (!postMap.has(media.post_id)) {
                postMap.set(media.post_id, {
                    id: media.post_id,
                    post: media.post,
                    medias: []
                });
            }
            postMap.get(media.post_id).medias.push(media);
        });

        posts = Array.from(postMap.values()).sort((a, b) => {
            const dateA = new Date(a.post?.created_at || 0);
            const dateB = new Date(b.post?.created_at || 0);
            return dateB - dateA;
        });

        renderPosts(posts);
        updateStats(posts.length, groups.length);
    })
    .catch(error => {
        console.error('Error loading posts:', error);
        renderPosts([]);
    });
}

function renderPosts(postsData) {
    const postsGrid = document.getElementById('postsGrid');
    if (!postsGrid) return;

    posts = postsData;

    if (!posts || posts.length === 0) {
        postsGrid.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>Aucune publication</p>
                <p class="empty-subtitle">Vos publications apparaitront ici</p>
            </div>
        `;
        return;
    }

    postsGrid.innerHTML = posts.map((post, index) => createPostThumbnail(post, index)).join('');

    // Add click listeners
    postsGrid.querySelectorAll('.post-thumbnail').forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => openPostDetail(index));
    });
}

function getMediaUrl(mediaUrl) {
    if (!mediaUrl) return '';
    if (mediaUrl.startsWith('/')) {
        return `${API_BASE_URL}${mediaUrl}`;
    }
    return mediaUrl;
}

function createPostThumbnail(post, index) {
    const firstMedia = post.medias && post.medias.length > 0 ? post.medias[0] : null;
    const mediaUrl = getMediaUrl(firstMedia?.media_url);
    const hasMultipleMedia = post.medias && post.medias.length > 1;

    // Group info
    const group = post.post?.group;
    const groupName = group?.nom || 'Groupe';
    const groupId = group?.id || index;
    const groupColor = GROUP_COLORS[groupId % GROUP_COLORS.length];

    return `
        <div class="post-thumbnail" data-index="${index}">
            <img src="${mediaUrl}" alt="Post" loading="lazy">
            ${hasMultipleMedia ? `
                <div class="post-thumbnail-multiple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
                        <rect x="7" y="7" width="10" height="10" rx="1" stroke-width="2"/>
                    </svg>
                </div>
            ` : ''}
            <div class="post-thumbnail-overlay">
                <div class="post-thumbnail-group">
                    <div class="post-thumbnail-group-avatar" style="background: ${groupColor}">
                        <span>${groupName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span class="post-thumbnail-group-name">${escapeHtml(groupName)}</span>
                </div>
            </div>
        </div>
    `;
}

// --------------------------------------------------------------------------
// Load User Groups
// --------------------------------------------------------------------------
function loadUserGroups() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/groups/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error loading groups');
        return response.json();
    })
    .then(groupsData => {
        groups = groupsData;
        updateStats(posts.length, groups.length);
    })
    .catch(error => {
        console.error('Error loading groups:', error);
    });
}

function updateStats(postsCount, groupsCount) {
    const postsCountEl = document.getElementById('postsCount');
    const groupsCountEl = document.getElementById('groupsCount');

    if (postsCountEl) postsCountEl.textContent = postsCount || 0;
    if (groupsCountEl) groupsCountEl.textContent = groupsCount || 0;
}

// --------------------------------------------------------------------------
// Post Detail Modal
// --------------------------------------------------------------------------
let currentDetailPostIndex = 0;
let currentDetailMediaIndex = 0;

function initPostDetailModal() {
    const modal = document.getElementById('postDetailModal');
    const closeBtn = document.getElementById('closeDetailModal');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const downloadBtn = document.getElementById('downloadBtn');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeDetailModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDetailModal();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateCarousel(-1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateCarousel(1));
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCurrentImage);
    }

    document.addEventListener('keydown', (e) => {
        if (modal && modal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                navigateCarousel(-1);
            } else if (e.key === 'ArrowRight') {
                navigateCarousel(1);
            }
        }
    });
}

function openPostDetail(index) {
    const post = posts[index];
    if (!post || !post.medias || post.medias.length === 0) return;

    currentDetailPostIndex = index;
    currentDetailMediaIndex = 0;

    renderPostDetail();

    const modal = document.getElementById('postDetailModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function renderPostDetail() {
    const post = posts[currentDetailPostIndex];
    if (!post) return;

    const detailImage = document.getElementById('detailImage');
    const detailAvatar = document.getElementById('detailAvatar');
    const detailAvatarInitial = document.getElementById('detailAvatarInitial');
    const detailAuthor = document.getElementById('detailAuthor');
    const detailCaption = document.getElementById('detailCaption');
    const detailTime = document.getElementById('detailTime');
    const detailGroup = document.getElementById('detailGroup');

    // Current image
    const currentMedia = post.medias[currentDetailMediaIndex];
    if (detailImage && currentMedia) {
        detailImage.src = getMediaUrl(currentMedia.media_url);
    }

    // Author info
    const groupMember = post.post?.group_member;
    const user = groupMember?.user;
    const username = user?.username || 'Utilisateur';
    const initial = username.charAt(0).toUpperCase();

    if (detailAvatarInitial) detailAvatarInitial.textContent = initial;
    if (detailAuthor) detailAuthor.textContent = username;

    if (detailAvatar && user) {
        const colorIndex = (user.id || 0) % GROUP_COLORS.length;
        detailAvatar.style.background = GROUP_COLORS[colorIndex];
    }

    // Caption
    if (detailCaption) {
        const captionP = detailCaption.querySelector('p');
        if (captionP) {
            captionP.textContent = post.post?.caption || '';
        }
        detailCaption.style.display = post.post?.caption ? 'block' : 'none';
    }

    // Date
    if (detailTime && post.post?.created_at) {
        detailTime.textContent = formatTimeAgo(post.post.created_at);
    }

    // Group
    const group = post.post?.group;
    if (detailGroup && group) {
        detailGroup.textContent = group.nom || 'Groupe';
        detailGroup.href = `group.html?id=${group.id}`;
    }

    updateCarousel();
}

function updateCarousel() {
    const post = posts[currentDetailPostIndex];
    if (!post) return;

    const mediaCount = post.medias.length;
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const indicators = document.getElementById('carouselIndicators');
    const detailImage = document.getElementById('detailImage');

    const currentMedia = post.medias[currentDetailMediaIndex];
    if (detailImage && currentMedia) {
        detailImage.src = getMediaUrl(currentMedia.media_url);
    }

    if (mediaCount > 1) {
        prevBtn.hidden = currentDetailMediaIndex === 0;
        nextBtn.hidden = currentDetailMediaIndex === mediaCount - 1;

        indicators.innerHTML = post.medias.map((_, index) =>
            `<span class="carousel-indicator ${index === currentDetailMediaIndex ? 'active' : ''}" data-index="${index}"></span>`
        ).join('');

        indicators.querySelectorAll('.carousel-indicator').forEach(indicator => {
            indicator.addEventListener('click', () => {
                currentDetailMediaIndex = parseInt(indicator.dataset.index);
                updateCarousel();
            });
        });
    } else {
        prevBtn.hidden = true;
        nextBtn.hidden = true;
        indicators.innerHTML = '';
    }
}

function navigateCarousel(direction) {
    const post = posts[currentDetailPostIndex];
    if (!post) return;

    const newIndex = currentDetailMediaIndex + direction;
    if (newIndex >= 0 && newIndex < post.medias.length) {
        currentDetailMediaIndex = newIndex;
        updateCarousel();
    }
}

async function downloadCurrentImage() {
    const post = posts[currentDetailPostIndex];
    if (!post || !post.medias || post.medias.length === 0) return;

    const currentMedia = post.medias[currentDetailMediaIndex];
    if (!currentMedia) return;

    const imageUrl = getMediaUrl(currentMedia.media_url);

    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const contentType = response.headers.get('content-type') || blob.type;
        let extension = 'jpg';
        if (contentType.includes('png')) {
            extension = 'png';
        } else if (contentType.includes('gif')) {
            extension = 'gif';
        } else if (contentType.includes('webp')) {
            extension = 'webp';
        }

        const filename = `closo_${post.id}_${currentDetailMediaIndex + 1}.${extension}`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);

        showNotification('Image telechargee !');
    } catch (error) {
        console.error('Error downloading:', error);
        showNotification('Erreur lors du telechargement', 'error');
    }
}

function closeDetailModal() {
    const modal = document.getElementById('postDetailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
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

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function formatTimeAgo(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
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
