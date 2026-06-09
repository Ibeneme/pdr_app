import axios from 'axios';
import { getAuthToken } from './secureStore';

export const baseURL = 'http://localhost:5005'

const axiosInstance = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});


axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken();
        console.log("[AXIOS INTERCEPTOR] Found token:", token ? "YES" : "NO");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;