// Automatic API URL detection based on environment
const getApiBaseUrl = () => {
    // If we're on localhost, use localhost:8055
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8055';
    }

    // In production, use the same host but on port 8055
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8055`;
};

const API_BASE_URL = getApiBaseUrl();
