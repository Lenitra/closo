// Automatic API URL detection based on environment
const getApiBaseUrl = () => {
    // If we're on localhost, use localhost:8055
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8055';
    }

    // In production with domain name, use /api/ (proxied by nginx)
    // This allows the frontend to use the same protocol (http/https) as the page
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    // If using a domain name (not IP), use the nginx proxy
    if (!hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return `${protocol}//${hostname}/api`;
    }

    // If using IP address, use direct port access
    return `${protocol}//${hostname}:8055`;
};

const API_BASE_URL = getApiBaseUrl();
