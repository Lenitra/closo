// ==========================================================================
// Closo Authentication Guard
// Auto-redirects to login if user is not authenticated
// ==========================================================================

(function() {
    'use strict';

    /**
     * Parse JWT token and return payload
     */
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    /**
     * Clear all authentication data from localStorage
     */
    function clearAuthData() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    }

    /**
     * Redirect to login page with return URL
     */
    function redirectToLogin() {
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('returnUrl', currentPath);
        window.location.href = 'login.html';
    }

    /**
     * Check if user is authenticated
     */
    function checkAuth() {
        const token = localStorage.getItem('access_token');

        // No token
        if (!token) {
            redirectToLogin();
            return false;
        }

        // Verify token is not expired
        try {
            const payload = parseJwt(token);
            if (payload && payload.exp) {
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp < now) {
                    // Token expired
                    clearAuthData();
                    redirectToLogin();
                    return false;
                }
            }
        } catch (e) {
            // Invalid token format
            clearAuthData();
            redirectToLogin();
            return false;
        }

        return true;
    }

    // Execute auth check immediately
    checkAuth();
})();
