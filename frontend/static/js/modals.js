// ==========================================================================
// Custom Modals System
// ==========================================================================

/**
 * Show a custom confirm dialog
 * @param {Object} options - Configuration options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} [options.confirmText='Confirmer'] - Confirm button text
 * @param {string} [options.cancelText='Annuler'] - Cancel button text
 * @param {boolean} [options.danger=false] - Use danger styling for confirm button
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirm({ title, message, confirmText = 'Confirmer', cancelText = 'Annuler', danger = false }) {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';

        // Build modal content
        modal.innerHTML = `
            <div class="confirm-modal-header">
                <h3 class="confirm-modal-title">${escapeHtml(title)}</h3>
            </div>
            <div class="confirm-modal-body">
                <p class="confirm-modal-message">${escapeHtml(message)}</p>
            </div>
            <div class="confirm-modal-footer">
                <button class="confirm-modal-btn confirm-modal-btn-cancel">${escapeHtml(cancelText)}</button>
                <button class="confirm-modal-btn confirm-modal-btn-confirm ${danger ? 'danger' : ''}">${escapeHtml(confirmText)}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Get buttons
        const cancelBtn = modal.querySelector('.confirm-modal-btn-cancel');
        const confirmBtn = modal.querySelector('.confirm-modal-btn-confirm');

        // Handle cancel
        function handleCancel() {
            closeModal(false);
        }

        // Handle confirm
        function handleConfirm() {
            closeModal(true);
        }

        // Close modal
        function closeModal(result) {
            overlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(result);
            }, 300);
        }

        // Event listeners
        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) handleCancel();
        });

        // Handle escape key
        function handleEscape(e) {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);

        // Show modal
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        // Focus confirm button
        setTimeout(() => confirmBtn.focus(), 300);
    });
}

/**
 * Show a custom alert dialog
 * @param {Object} options - Configuration options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} [options.type='info'] - Alert type: 'success', 'error', 'warning', 'info'
 * @param {string} [options.buttonText='OK'] - Button text
 * @returns {Promise<void>} - Resolves when modal is closed
 */
function showAlert({ title, message, type = 'info', buttonText = 'OK' }) {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'alert-modal-overlay';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'alert-modal';

        // Icon SVG based on type
        const icons = {
            success: '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
            error: '<path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
            warning: '<path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
            info: '<path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
        };

        // Build modal content
        modal.innerHTML = `
            <div class="alert-modal-header">
                <svg class="alert-modal-icon ${type}" viewBox="0 0 24 24" fill="none">
                    ${icons[type] || icons.info}
                </svg>
                <h3 class="alert-modal-title">${escapeHtml(title)}</h3>
            </div>
            <div class="alert-modal-body">
                <p class="alert-modal-message">${escapeHtml(message)}</p>
            </div>
            <div class="alert-modal-footer">
                <button class="alert-modal-btn">${escapeHtml(buttonText)}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Get button
        const btn = modal.querySelector('.alert-modal-btn');

        // Close modal
        function closeModal() {
            overlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve();
            }, 300);
        }

        // Event listeners
        btn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Handle escape key
        function handleEscape(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);

        // Show modal
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        // Focus button
        setTimeout(() => btn.focus(), 300);
    });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions for use in other scripts
window.showConfirm = showConfirm;
window.showAlert = showAlert;
