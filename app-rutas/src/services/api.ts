import axios from 'axios';


// Replace with your Odoo server URL
export const API_URL = ''; // Relative path for Web Proxy (or full URL for Android)

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add session_id if available (or handle cookies)
api.interceptors.request.use(
    async (config) => {
        // For Odoo, we typically rely on cookies for session management.
        // However, if we use a token-based approach, we'd add it here.
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
