// ==========================================================================
// Closo Storage Admin Page
// ==========================================================================

let allFiles = [];
let currentFileId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadAllFiles();
    initModals();
    initRefreshButton();
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
// Load All Files
// --------------------------------------------------------------------------
function loadAllFiles() {
    const token = localStorage.getItem('access_token');

    fetch(`${API_BASE_URL}/storage/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to load files');
        return response.json();
    })
    .then(data => {
        allFiles = data.files || [];
        updateStats(data);
        displayFiles(allFiles);
    })
    .catch(error => {
        console.error('Error loading files:', error);
        showEmptyState('Erreur lors du chargement des fichiers');
    });
}

// --------------------------------------------------------------------------
// Update Stats
// --------------------------------------------------------------------------
function updateStats(data) {
    const totalFiles = data.count || 0;
    const files = data.files || [];

    // Calculate total size
    const totalSizeBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('totalSize').textContent = `${totalSizeMB} MB`;
}

// --------------------------------------------------------------------------
// Display Files
// --------------------------------------------------------------------------
function displayFiles(files) {
    const grid = document.getElementById('filesGrid');
    grid.innerHTML = '';

    if (files.length === 0) {
        showEmptyState('Aucun fichier trouve');
        return;
    }

    files.forEach(file => {
        const thumbnail = createFileThumbnail(file);
        grid.appendChild(thumbnail);
    });
}

function createFileThumbnail(file) {
    const div = document.createElement('div');
    div.className = 'file-thumbnail';
    div.onclick = () => openFileDetail(file);

    // Format file size
    const fileSizeKB = (file.size / 1024).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const displaySize = file.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

    div.innerHTML = `
        <div class="file-thumbnail-image">
            <img src="${API_BASE_URL}/media/proxy/${file.id}" alt="${file.filename}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo preview%3C/text%3E%3C/svg%3E'">
        </div>
        <div class="file-thumbnail-info">
            <span class="file-thumbnail-name" title="${file.filename}">${file.filename}</span>
            <span class="file-thumbnail-size">${displaySize}</span>
        </div>
        <button class="file-delete-btn" onclick="event.stopPropagation(); confirmDeleteFile('${file.id}')" title="Supprimer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;

    return div;
}

// --------------------------------------------------------------------------
// Show Empty State
// --------------------------------------------------------------------------
function showEmptyState(message) {
    const grid = document.getElementById('filesGrid');
    grid.innerHTML = `
        <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>${message}</p>
        </div>
    `;
}

// --------------------------------------------------------------------------
// Open File Detail
// --------------------------------------------------------------------------
function openFileDetail(file) {
    currentFileId = file.id;
    const modal = document.getElementById('fileDetailModal');
    const img = document.getElementById('detailImage');
    const filename = document.getElementById('detailFilename');
    const fileSize = document.getElementById('detailFileSize');
    const fileId = document.getElementById('detailFileId');
    const fullFilename = document.getElementById('detailFullFilename');
    const createdAt = document.getElementById('detailCreatedAt');

    // Image
    img.src = `${API_BASE_URL}/media/proxy/${file.id}`;

    // File info
    const fileSizeKB = (file.size / 1024).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const displaySize = file.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

    filename.textContent = file.filename;
    fileSize.textContent = displaySize;
    fileId.textContent = file.id;
    fullFilename.textContent = file.filename;
    createdAt.textContent = formatDate(file.created_at);

    // Download button
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = () => downloadFile(file.id, file.filename);

    // Delete button
    const deleteBtn = document.getElementById('deleteFileBtn');
    deleteBtn.onclick = () => {
        modal.classList.remove('active');
        confirmDeleteFile(file.id);
    };

    modal.classList.add('active');
}

// --------------------------------------------------------------------------
// Download File
// --------------------------------------------------------------------------
function downloadFile(fileId, filename) {
    const url = `${API_BASE_URL}/media/proxy/${fileId}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

// --------------------------------------------------------------------------
// Delete File
// --------------------------------------------------------------------------
function confirmDeleteFile(fileId) {
    if (!confirm('Voulez-vous vraiment supprimer ce fichier ?\n\nATTENTION : Cette action supprimera également le post associé et tous ses médias. Cette action est irréversible.')) {
        return;
    }

    deleteFile(fileId);
}

function deleteFile(fileId) {
    const token = localStorage.getItem('access_token');

    // First, get the file info to find the post_id
    fetch(`${API_BASE_URL}/storage/files/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to get file info');
        return response.json();
    })
    .then(fileInfo => {
        const postId = fileInfo.post_id;

        if (!postId) {
            // If no post associated, just delete the file
            return deleteMediaFile(fileId, token);
        }

        // Delete the post (this should cascade to all associated media)
        return fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to delete post');
            return response.json();
        });
    })
    .then(() => {
        showNotification('Post et médias associés supprimés avec succès');
        loadAllFiles(); // Reload files
    })
    .catch(error => {
        console.error('Error deleting file/post:', error);
        showNotification('Erreur lors de la suppression', 'error');
    });
}

function deleteMediaFile(fileId, token) {
    return fetch(`${API_BASE_URL}/storage/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to delete file');
        return response.json();
    });
}

// --------------------------------------------------------------------------
// Modals
// --------------------------------------------------------------------------
function initModals() {
    const modal = document.getElementById('fileDetailModal');
    const closeBtn = document.getElementById('closeDetailModal');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// --------------------------------------------------------------------------
// Refresh Button
// --------------------------------------------------------------------------
function initRefreshButton() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', () => {
        loadAllFiles();
    });
}

// --------------------------------------------------------------------------
// Format Date
// --------------------------------------------------------------------------
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000); // Convert from Unix timestamp
    return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// --------------------------------------------------------------------------
// Show Notification
// --------------------------------------------------------------------------
function showNotification(message, type = 'success') {
    // Simple alert for now - you can implement a nicer notification system
    alert(message);
}
