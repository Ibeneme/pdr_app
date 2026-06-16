
//https://kindred-server.onrender.com
// 'http://localhost:5005' 
import axios from 'axios';
import { getAuthToken } from './secureStore';

// Ensure there is no trailing slash here to prevent double-slash formatting glitches
export const baseURL = 'https://kindred-server.onrender.com';

const axiosInstance = axios.create({
    baseURL: `${baseURL}/api/v1`,
    timeout: 15000000, // 15-second timeout safeguard
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken();

        // Dynamic logging to track exactly where outbound connections are heading
        console.log(`🌐 [AXIOS REQUEST] Outbound to: ${config.baseURL}${config.url}`);
        console.log("[AXIOS INTERCEPTOR] Found token:", token ? "✅ YES" : "❌ NO");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("❌ [AXIOS REQUEST ERROR]:", error);
        return Promise.reject(error);
    }
);

// Response Interceptor (Highly Recommended to catch Render errors instantly)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("❌ [AXIOS RESPONSE ERROR]:", {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

export default axiosInstance;