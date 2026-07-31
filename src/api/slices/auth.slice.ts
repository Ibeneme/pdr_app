import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";

// --- TypeScript Interfaces ---

export interface AuthState {
    userId: string | null;
    isLoading: boolean;
    isSuccess: boolean;
    error: string | null;
    message: string | null;
}

interface CommonResponse {
    success: boolean;
    message?: string;
    userId?: string;
    token?: any;
    user?: {
        id: string;
        fullName: string;
        email: string
    }
}

// --- Initial State ---
const initialState: AuthState = {
    userId: null,
    isLoading: false,
    isSuccess: false,
    error: null,
    message: null,
};

// --- Async Thunks ---

export const registerUser = createAsyncThunk<CommonResponse, any, { rejectValue: string }>(
    "auth/registerUser",
    async (userData, { rejectWithValue }) => {
        try {
            console.log("[AUTH SLICE] Registering user with data:", userData);
            const response = await axiosInstance.post<CommonResponse>("/padiman_route/auth/register", userData);
            console.log("[AUTH SLICE] Registration payload received successfully:", response.data);
            return response.data;
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Registration failed";
            console.error("[AUTH SLICE ERROR] Registration failed:", errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

export const loginUser = createAsyncThunk<CommonResponse, any, { rejectValue: string }>(
    "auth/loginUser",
    async (credentials, { rejectWithValue }) => {
        try {
            const payload = {
                ...credentials,
                email: credentials.email?.toLowerCase().trim(),
            };
            console.log("[AUTH SLICE] Logging in user with credentials:", payload);
            const response = await axiosInstance.post<CommonResponse>("/padiman_route/auth/login", payload);
            console.log("[AUTH SLICE] Login response payload received:", response.data);
            return response.data;
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Invalid credentials";
            console.error("[AUTH SLICE ERROR] Login failed:", errMsg);
            return rejectWithValue(errMsg); // was: return errMsg
        }
    }
);

export const sendOtp = createAsyncThunk<CommonResponse, any, { rejectValue: string }>(
    "auth/sendOtp",
    async (emailData, { rejectWithValue }) => {
        try {
            console.log("[AUTH SLICE] Requesting OTP send for:", emailData);
            const response = await axiosInstance.post<CommonResponse>("/padiman_route/auth/send-otp", emailData);
            console.log("[AUTH SLICE] Send OTP server response:", response.data);
            return response.data;
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Error sending OTP";
            console.error("[AUTH SLICE ERROR] Send OTP failed:", errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

export const verifyOtp = createAsyncThunk<CommonResponse, any, { rejectValue: string }>(
    "auth/verifyOtp",
    async (otpData, { rejectWithValue }) => {
        try {
            console.log("[AUTH SLICE] Submitting OTP verification:", otpData);
            const response = await axiosInstance.post<CommonResponse>("/padiman_route/auth/verify-otp", otpData);
            console.log("[AUTH SLICE] OTP Verification response received:", response.data);
            return response.data;
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Invalid or expired OTP";
            console.error("[AUTH SLICE ERROR] Verification failed:", errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

export const resetPassword = createAsyncThunk<CommonResponse, any, { rejectValue: string }>(
    "auth/resetPassword",
    async (passwordData, { rejectWithValue }) => {
        try {
            console.log("[AUTH SLICE] Dispatching password reset data:", passwordData);
            const response = await axiosInstance.post<CommonResponse>("/padiman_route/auth/reset-password", passwordData);
            console.log("[AUTH SLICE] Password reset server response:", response.data);
            return response.data;
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Password reset failed";
            console.error("[AUTH SLICE ERROR] Reset Password failed:", errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

// --- Slice Configuration ---

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        resetAuthState: (state: AuthState) => {
            console.log("[AUTH SLICE ACTION] Resetting Auth State flags.");
            state.isLoading = false;
            state.isSuccess = false;
            state.error = null;
            state.message = null;
        },
        logout: (state: AuthState) => {
            console.log("[AUTH SLICE ACTION] Logging out current user.");
            state.userId = null;
            state.isLoading = false;
            state.isSuccess = false;
            state.error = null;
            state.message = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // 1. Specific Success Cases (Must come first)
            .addCase(registerUser.fulfilled, (state: AuthState, action: PayloadAction<CommonResponse>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload.message || null;
            })
            .addCase(loginUser.fulfilled, (state: AuthState, action: PayloadAction<CommonResponse>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.userId = action.payload.userId || null;
            })
            .addCase(sendOtp.fulfilled, (state: AuthState, action: PayloadAction<CommonResponse>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload.message || null;
            })
            .addCase(verifyOtp.fulfilled, (state: AuthState, action: PayloadAction<CommonResponse>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload.message || null;
            })
            .addCase(resetPassword.fulfilled, (state: AuthState, action: PayloadAction<CommonResponse>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload.message || null;
            })

            // 2. Global Matchers (Must come last)
            .addMatcher(
                (action) => action.type.endsWith("/pending"),
                (state: AuthState) => {
                    state.isLoading = true;
                    state.error = null;
                    state.isSuccess = false;
                    state.message = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/rejected"),
                (state: AuthState, action: PayloadAction<any>) => {
                    state.isLoading = false;
                    state.isSuccess = false;
                    state.error = action.payload || "An unexpected error occurred";
                }
            );
    },
});

export const { resetAuthState, logout } = authSlice.actions;
export default authSlice.reducer;