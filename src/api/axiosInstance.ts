// src/api/axiosInstance.ts
import axios from 'axios';
import { getAuthToken } from './secureStore';

// Base URL - No trailing slash!
export const baseURL = 'https://kindred-server.onrender.com';

//export const baseURL = 'http://localhost:5005';


const axiosInstance = axios.create({
    baseURL: `${baseURL}/api/v1`,
    timeout: 15000, // 15 seconds is more reasonable
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken();

        console.log(`🌐 [AXIOS REQUEST] ${config.method?.toUpperCase()} → ${config.baseURL}${config.url}`);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("🔑 [AXIOS] Authorization header attached");
        } else {
            console.warn("⚠️ [AXIOS] No auth token found for protected route");
        }

        return config;
    },
    (error) => {
        console.error("❌ [AXIOS REQUEST ERROR]:", error);
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        console.log(`✅ [AXIOS RESPONSE] ${response.status} ${response.config.url}`);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        console.error("❌ [AXIOS RESPONSE ERROR]:", {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            code: error.code,
            url: error.config?.url,
            data: error.response?.data,
        });

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            console.warn("🔄 401 detected - Token failed. Clearing session...");

            // Import dynamically to avoid circular dependency
            const { removeAuthToken } = await import('./secureStore');
            await removeAuthToken();

            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;