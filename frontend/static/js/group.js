// ==========================================================================
// Closo Group Page - Instagram Style
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

let currentGroupId = null;
let currentGroup = null;
let posts = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initGroupPage();
    initDetailModal();
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
// Init Group Page
// --------------------------------------------------------------------------
function initGroupPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentGroupId = urlParams.get('id');

    if (!currentGroupId) {
        window.location.href = 'app.html';
        return;
    }

    // Lien vers la page de publication
    const createBtn = document.getElementById('createPostBtn');
    if (createBtn) {
        createBtn.href = `publish.html?group=${currentGroupId}`;
    }

    loadGroupInfo();
    loadPosts();
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
        if (!response.ok) {
            throw new Error('Groupe introuvable');
        }
        return response.json();
    })
    .then(group => {
        currentGroup = group;
        updateGroupHeader(group);
    })
    .catch(error => {
        console.error('Error loading group:', error);
        // Affichage par défaut en cas d'erreur
        updateGroupHeader({
            id: parseInt(currentGroupId),
            nom: 'Groupe',
            description: ''
        });
    });
}

function updateGroupHeader(group) {
    currentGroup = group;
    const groupId = group.id || parseInt(currentGroupId);
    const color = GROUP_COLORS[groupId % GROUP_COLORS.length];

    const groupAvatar = document.getElementById('groupAvatar');
    const groupInitial = document.getElementById('groupInitial');
    const groupName = document.getElementById('groupName');
    const descriptionSection = document.getElementById('groupDescription');
    const descriptionText = document.getElementById('descriptionText');

    if (groupAvatar) {
        groupAvatar.style.background = color;
    }
    if (groupInitial) {
        groupInitial.textContent = group.nom ? group.nom.charAt(0).toUpperCase() : 'G';
    }
    if (groupName) {
        groupName.textContent = group.nom || 'Groupe';
    }

    // Description
    if (group.description && descriptionText) {
        descriptionText.textContent = group.description;
        descriptionSection.classList.remove('hidden');
    } else if (descriptionSection) {
        descriptionSection.classList.add('hidden');
    }

    // Titre de la page
    document.title = `Closo - ${group.nom || 'Groupe'}`;
}

function updateStats(postsCount, membersCount) {
    const postsCountEl = document.getElementById('postsCount');
    const membersCountEl = document.getElementById('membersCount');

    if (postsCountEl) postsCountEl.textContent = postsCount || 0;
    if (membersCountEl) membersCountEl.textContent = membersCount || 0;
}

// --------------------------------------------------------------------------
// Load Posts
// --------------------------------------------------------------------------
function loadPosts() {
    const postsGrid = document.getElementById('postsGrid');
    if (!postsGrid) return;

    const token = localStorage.getItem('access_token');

    // Charger les médias depuis l'API
    fetch(`${API_BASE_URL}/media/group/${currentGroupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des posts');
        }
        return response.json();
    })
    .then(medias => {
        // Grouper les médias par post_id
        const postMap = new Map();

        medias.forEach(media => {
            if (!postMap.has(media.post_id)) {
                postMap.set(media.post_id, {
                    id: media.post_id,
                    post: media.post,
                    medias: []
                });
            }
            postMap.get(media.post_id).medias.push(media);
        });

        // Convertir en tableau et trier par date de création (plus récent en premier)
        posts = Array.from(postMap.values()).sort((a, b) => {
            const dateA = new Date(a.post?.created_at || 0);
            const dateB = new Date(b.post?.created_at || 0);
            return dateB - dateA;
        });

        renderPosts(posts);
        updateStats(posts.length, currentGroup?.members_count);
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
    updateStats(posts.length, 0);

    if (!posts || posts.length === 0) {
        postsGrid.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>Aucune publication</p>
                <p class="empty-subtitle">Partagez votre premier moment !</p>
            </div>
        `;
        return;
    }

    postsGrid.innerHTML = posts.map((post, index) => createPostThumbnail(post, index)).join('');

    // Ajouter les event listeners pour ouvrir le detail
    postsGrid.querySelectorAll('.post-thumbnail').forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => openPostDetail(index));
    });
}

function getMediaUrl(mediaUrl) {
    // Construire l'URL complète pour les médias
    if (!mediaUrl) return '';
    // Si l'URL est relative (commence par /), ajouter l'API_BASE_URL
    if (mediaUrl.startsWith('/')) {
        return `${API_BASE_URL}${mediaUrl}`;
    }
    return mediaUrl;
}

function createPostThumbnail(post, index) {
    // Utiliser le premier média comme thumbnail
    const firstMedia = post.medias && post.medias.length > 0 ? post.medias[0] : null;
    const mediaUrl = getMediaUrl(firstMedia?.media_url);
    const hasMultipleMedia = post.medias && post.medias.length > 1;

    // Infos utilisateur
    const groupMember = post.post?.group_member;
    const user = groupMember?.user;
    const username = user?.username || 'Utilisateur';
    const initial = username.charAt(0).toUpperCase();
    const userId = user?.id || index;
    const avatarColor = GROUP_COLORS[userId % GROUP_COLORS.length];

    // Caption tronquée
    const caption = post.post?.caption || '';
    const truncatedCaption = caption.length > 60 ? caption.substring(0, 60) + '...' : caption;

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
                <div class="post-thumbnail-header">
                    <div class="post-thumbnail-avatar" style="background: ${avatarColor}">
                        <span>${initial}</span>
                    </div>
                    <span class="post-thumbnail-username">${escapeHtml(username)}</span>
                </div>
                ${caption ? `
                    <div class="post-thumbnail-caption">
                        <p>${escapeHtml(truncatedCaption)}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// --------------------------------------------------------------------------
// Post Detail Modal
// --------------------------------------------------------------------------
function initDetailModal() {
    const modal = document.getElementById('postDetailModal');
    const closeBtn = document.getElementById('closeDetailModal');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const downloadBtn = document.getElementById('downloadBtn');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeDetailModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeDetailModal();
            }
        });
    }

    // Carrousel navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateCarousel(-1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateCarousel(1));
    }

    // Téléchargement
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCurrentImage);
    }

    document.addEventListener('keydown', function(e) {
        if (modal && modal.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeDetailModal();
            } else if (e.key === 'ArrowLeft') {
                navigateCarousel(-1);
            } else if (e.key === 'ArrowRight') {
                navigateCarousel(1);
            }
        }
    });
}

let currentDetailPostIndex = 0;
let currentDetailMediaIndex = 0;

function openPostDetail(index) {
    const post = posts[index];
    if (!post || !post.medias || post.medias.length === 0) return;

    currentDetailPostIndex = index;
    currentDetailMediaIndex = 0;

    renderPostDetail();

    // Ouvrir le modal
    const modal = document.getElementById('postDetailModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function renderPostDetail() {
    const post = posts[currentDetailPostIndex];
    if (!post) return;

    const modal = document.getElementById('postDetailModal');
    const detailImage = document.getElementById('detailImage');
    const detailAvatar = document.getElementById('detailAvatar');
    const detailAvatarInitial = document.getElementById('detailAvatarInitial');
    const detailAuthor = document.getElementById('detailAuthor');
    const detailCaption = document.getElementById('detailCaption');
    const detailTime = document.getElementById('detailTime');

    // Image actuelle
    const currentMedia = post.medias[currentDetailMediaIndex];
    if (detailImage && currentMedia) {
        detailImage.src = getMediaUrl(currentMedia.media_url);
    }

    // Auteur (depuis post.group_member.user)
    const groupMember = post.post?.group_member;
    const user = groupMember?.user;
    const username = user?.username || 'Utilisateur';
    const initial = username.charAt(0).toUpperCase();

    if (detailAvatarInitial) detailAvatarInitial.textContent = initial;
    if (detailAuthor) detailAuthor.textContent = username;

    // Avatar couleur
    if (detailAvatar) {
        const userId = user?.id || currentDetailPostIndex;
        const colorIndex = userId % GROUP_COLORS.length;
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

    // Mettre à jour le carrousel
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

    // Mettre à jour l'image
    const currentMedia = post.medias[currentDetailMediaIndex];
    if (detailImage && currentMedia) {
        detailImage.src = getMediaUrl(currentMedia.media_url);
    }

    // Afficher/masquer les boutons de navigation
    if (mediaCount > 1) {
        prevBtn.hidden = currentDetailMediaIndex === 0;
        nextBtn.hidden = currentDetailMediaIndex === mediaCount - 1;

        // Générer les indicateurs
        indicators.innerHTML = post.medias.map((_, index) =>
            `<span class="carousel-indicator ${index === currentDetailMediaIndex ? 'active' : ''}" data-index="${index}"></span>`
        ).join('');

        // Ajouter les event listeners sur les indicateurs
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
        // Fetch l'image
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Déterminer l'extension à partir du Content-Type
        const contentType = response.headers.get('content-type') || blob.type;
        let extension = 'jpg';
        if (contentType.includes('png')) {
            extension = 'png';
        } else if (contentType.includes('gif')) {
            extension = 'gif';
        } else if (contentType.includes('webp')) {
            extension = 'webp';
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
            extension = 'jpg';
        }

        const filename = `closo_${post.id}_${currentDetailMediaIndex + 1}.${extension}`;
        a.download = filename;

        // Déclencher le téléchargement
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Libérer l'URL
        window.URL.revokeObjectURL(url);

        showNotification('Image téléchargée !');
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        showNotification('Erreur lors du téléchargement', 'error');
    }
}

function closeDetailModal() {
    const modal = document.getElementById('postDetailModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
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
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'A l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;

    return formatDate(dateString);
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

    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                bottom: 100px;
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
