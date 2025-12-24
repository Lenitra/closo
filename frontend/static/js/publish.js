// ==========================================================================
// Closo Publish Page - Multi-image Upload
// ==========================================================================

const API_BASE_URL = 'http://localhost:8055';

const GROUP_COLORS = [
    'linear-gradient(135deg, #f472b6, #c084fc)',
    'linear-gradient(135deg, #60a5fa, #34d399)',
    'linear-gradient(135deg, #fbbf24, #f97316)',
    'linear-gradient(135deg, #a78bfa, #6366f1)',
    'linear-gradient(135deg, #14b8a6, #2dd4bf)',
    'linear-gradient(135deg, #ef4444, #f97316)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
];

let selectedFiles = [];
let currentImageIndex = 0;
let selectedGroupIds = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
    loadGroups();
    initUpload();
    initNavigation();
    initCaption();
    initSubmit();
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
// Load User Info
// --------------------------------------------------------------------------
function loadUserInfo() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            const userInitial = document.getElementById('userInitial');
            const userName = document.getElementById('userName');

            if (userInitial) {
                userInitial.textContent = user.username ? user.username.charAt(0).toUpperCase() : 'U';
            }
            if (userName) {
                userName.textContent = user.username || 'Utilisateur';
            }
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }
}

// --------------------------------------------------------------------------
// Load Groups
// --------------------------------------------------------------------------
function loadGroups() {
    const token = localStorage.getItem('access_token');
    const groupList = document.getElementById('groupList');

    if (!token || !groupList) return;

    fetch(`${API_BASE_URL}/groups/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(groups => {
        renderGroupList(groups);

        // Pre-selectionner si on vient d'un groupe
        const urlParams = new URLSearchParams(window.location.search);
        const groupId = urlParams.get('group');
        if (groupId) {
            const checkbox = document.getElementById(`group-${groupId}`);
            if (checkbox) {
                checkbox.checked = true;
                selectedGroupIds = [groupId];
                updateSelectedCount();
            }
        }
    })
    .catch(error => {
        console.error('Error loading groups:', error);
        groupList.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--color-gray-400);">Erreur de chargement</p>';
    });
}

function renderGroupList(groups) {
    const groupList = document.getElementById('groupList');

    if (groups.length === 0) {
        groupList.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--color-gray-400);">Aucun groupe disponible</p>';
        return;
    }

    groupList.innerHTML = groups.map(group => {
        const color = GROUP_COLORS[group.id % GROUP_COLORS.length];
        const initial = group.nom ? group.nom.charAt(0).toUpperCase() : 'G';

        return `
            <label class="group-item">
                <input type="checkbox" id="group-${group.id}" value="${group.id}">
                <span class="group-item-checkbox">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <span class="group-item-avatar" style="background: ${color}">${initial}</span>
                <span class="group-item-name">${escapeHtml(group.nom)}</span>
            </label>
        `;
    }).join('');

    // Add event listeners
    groupList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleGroupSelection);
    });
}

function handleGroupSelection() {
    const checkboxes = document.querySelectorAll('#groupList input[type="checkbox"]:checked');
    selectedGroupIds = Array.from(checkboxes).map(cb => cb.value);
    updateSelectedCount();
    updateSubmitButton();
}

function updateSelectedCount() {
    const label = document.querySelector('.group-section > label');
    if (label) {
        if (selectedGroupIds.length > 0) {
            label.innerHTML = `Publier dans <span class="selected-count">${selectedGroupIds.length} groupe${selectedGroupIds.length > 1 ? 's' : ''}</span>`;
        } else {
            label.textContent = 'Publier dans';
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --------------------------------------------------------------------------
// Upload Handling
// --------------------------------------------------------------------------
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectFilesBtn');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const addMoreInput = document.getElementById('addMoreInput');

    // Click to select
    selectBtn.addEventListener('click', () => fileInput.click());

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Add more files
    addMoreBtn.addEventListener('click', () => addMoreInput.click());
    addMoreInput.addEventListener('change', (e) => {
        addMoreFiles(e.target.files);
        addMoreInput.value = '';
    });

    // Close button
    document.getElementById('closeBtn').addEventListener('click', goBack);
}

function handleFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
        showNotification('Veuillez selectionner des images', 'error');
        return;
    }

    selectedFiles = imageFiles;
    currentImageIndex = 0;

    showPreviewStep();
    renderPreviews();
    updateSubmitButton();
}

function addMoreFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    selectedFiles = [...selectedFiles, ...imageFiles];
    renderPreviews();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);

    if (selectedFiles.length === 0) {
        showUploadStep();
        return;
    }

    if (currentImageIndex >= selectedFiles.length) {
        currentImageIndex = selectedFiles.length - 1;
    }

    renderPreviews();
    updateSubmitButton();
}

// --------------------------------------------------------------------------
// Preview Rendering
// --------------------------------------------------------------------------
function showUploadStep() {
    document.getElementById('stepUpload').classList.remove('hidden');
    document.getElementById('stepPreview').classList.add('hidden');
    document.getElementById('submitBtn').disabled = true;
}

function showPreviewStep() {
    document.getElementById('stepUpload').classList.add('hidden');
    document.getElementById('stepPreview').classList.remove('hidden');
}

function renderPreviews() {
    renderMainImage();
    renderThumbnails();
    renderIndicators();
    updateNavButtons();
}

function renderMainImage() {
    const mainImage = document.getElementById('mainImage');
    const file = selectedFiles[currentImageIndex];

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            mainImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function renderThumbnails() {
    const container = document.getElementById('thumbnails');

    if (selectedFiles.length <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = selectedFiles.map((file, index) => `
        <div class="thumbnail-item ${index === currentImageIndex ? 'active' : ''}" data-index="${index}">
            <img src="" alt="Thumbnail ${index + 1}" id="thumb-${index}">
            <button class="thumbnail-remove" data-index="${index}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `).join('');

    // Load thumbnail images
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const thumb = document.getElementById(`thumb-${index}`);
            if (thumb) thumb.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Add event listeners
    container.querySelectorAll('.thumbnail-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.thumbnail-remove')) {
                currentImageIndex = parseInt(item.dataset.index);
                renderPreviews();
            }
        });
    });

    container.querySelectorAll('.thumbnail-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFile(parseInt(btn.dataset.index));
        });
    });
}

function renderIndicators() {
    const container = document.getElementById('indicators');

    if (selectedFiles.length <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = selectedFiles.map((_, index) =>
        `<div class="indicator ${index === currentImageIndex ? 'active' : ''}"></div>`
    ).join('');
}

function updateNavButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (selectedFiles.length <= 1) {
        prevBtn.hidden = true;
        nextBtn.hidden = true;
        return;
    }

    prevBtn.hidden = currentImageIndex === 0;
    nextBtn.hidden = currentImageIndex === selectedFiles.length - 1;
}

// --------------------------------------------------------------------------
// Navigation
// --------------------------------------------------------------------------
function initNavigation() {
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            renderPreviews();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentImageIndex < selectedFiles.length - 1) {
            currentImageIndex++;
            renderPreviews();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('stepPreview').classList.contains('hidden')) return;

        if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
            currentImageIndex--;
            renderPreviews();
        } else if (e.key === 'ArrowRight' && currentImageIndex < selectedFiles.length - 1) {
            currentImageIndex++;
            renderPreviews();
        } else if (e.key === 'Escape') {
            goBack();
        }
    });
}

// --------------------------------------------------------------------------
// Caption
// --------------------------------------------------------------------------
function initCaption() {
    const captionInput = document.getElementById('captionInput');
    const charCount = document.getElementById('charCount');

    captionInput.addEventListener('input', () => {
        charCount.textContent = captionInput.value.length;
    });
}

// --------------------------------------------------------------------------
// Submit
// --------------------------------------------------------------------------
function initSubmit() {
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = selectedFiles.length === 0 || selectedGroupIds.length === 0;
}

async function handleSubmit() {
    const captionInput = document.getElementById('captionInput');
    const loadingOverlay = document.getElementById('loadingOverlay');

    const caption = captionInput.value.trim();

    if (selectedGroupIds.length === 0) {
        showNotification('Veuillez choisir au moins un groupe', 'error');
        return;
    }

    if (selectedFiles.length === 0) {
        showNotification('Veuillez ajouter au moins une image', 'error');
        return;
    }

    // Show loading
    loadingOverlay.classList.remove('hidden');

    try {
        const token = localStorage.getItem('access_token');
        let successCount = 0;

        // Pour chaque groupe selectionne, creer un post avec tous les fichiers
        for (const groupId of selectedGroupIds) {
            const formData = new FormData();

            // Ajouter tous les fichiers
            for (const file of selectedFiles) {
                formData.append('files', file);
            }

            // Ajouter le group_id et caption
            formData.append('group_id', groupId);
            if (caption) {
                formData.append('caption', caption);
            }

            // Appeler l'API pour creer le post
            const response = await fetch(`${API_BASE_URL}/posts/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erreur lors de la publication');
            }

            const createdPost = await response.json();
            console.log(`✅ Post created in group ${groupId}:`, createdPost);
            successCount++;
        }

        const groupCount = selectedGroupIds.length;
        showNotification(`Publie dans ${groupCount} groupe${groupCount > 1 ? 's' : ''} !`);

        // Rediriger vers le premier groupe ou app.html
        setTimeout(() => {
            if (selectedGroupIds.length === 1) {
                window.location.href = `group.html?id=${selectedGroupIds[0]}`;
            } else {
                window.location.href = 'app.html';
            }
        }, 1000);

    } catch (error) {
        console.error('Error publishing:', error);
        showNotification(error.message || 'Erreur lors de la publication', 'error');
        loadingOverlay.classList.add('hidden');
    }
}

// --------------------------------------------------------------------------
// Utilities
// --------------------------------------------------------------------------
function goBack() {
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('group');

    if (groupId) {
        window.location.href = `group.html?id=${groupId}`;
    } else {
        window.location.href = 'app.html';
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

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
                flex-shrink: 0;
            }
            .notification.error svg {
                color: #ef4444;
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
