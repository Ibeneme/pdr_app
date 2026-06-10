import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";
import { logout } from "./auth.slice";
import { saveUser } from "../secureStore";

// --- TypeScript Interfaces ---
export interface UserProfile {
    fullName: string;
    phone: string;
    email: string;
    username?: string;
    gender?: string;
    address?: string;
    occupation?: string;
    city?: string;
    driverLicenseNumber?: string;
    idMeans?: string;
    deliveriesDone?: string;
    ridesOffered?: string;
    parcelsRequested?: string;
    profileImage?: string;
    isDriver?: boolean;
}

// Dashboard Interfaces
export interface DashboardMetrics {
    totalOngoingCount: number;
    ongoingCounts: {
        offer_ride: number;
        deliver_parcel: number;
        send_parcel: number;
        join_ride: number;
    };
}

export interface DashboardOrders {
    offer_ride: any[];
    deliver_parcel: any[];
    send_parcel: any[];
    join_ride: any[];
}

export interface DashboardPayload {
    success: boolean;
    metrics: DashboardMetrics;
    orders: DashboardOrders;
}

interface UserState {
    profile: UserProfile | null;
    dashboardData: {
        metrics: DashboardMetrics | null;
        orders: DashboardOrders | null;
    };
    isLoading: boolean;
    error: string | null;
}

const initialState: UserState = {
    profile: null,
    dashboardData: { metrics: null, orders: null },
    isLoading: false,
    error: null,
};

// --- Async Thunks ---

export const savePushToken = createAsyncThunk<void, { expoPushToken: string }, { rejectValue: string }>(
    "user/savePushToken",
    async (payload, { rejectWithValue }) => {
        try {
            await axiosInstance.post("/padiman_route/user/push-token", payload);
            console.log("[USER SLICE] Push token saved successfully");
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to save push token");
        }
    }
);

export const getProfile = createAsyncThunk<UserProfile, void, { rejectValue: string }>(
    "user/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/padiman_route/user/profile");
            const userData = response.data;

            if (userData && userData._id) {
                await saveUser(userData);
            }
            return userData;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch profile");
        }
    }
);

export const updateProfile = createAsyncThunk<UserProfile, Partial<UserProfile>, { rejectValue: string }>(
    "user/updateProfile",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put("/padiman_route/user/profile", userData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to update profile");
        }
    }
);

// 🔥 NEW: Upload Profile Picture
export const updateProfilePicture = createAsyncThunk<
    string,
    FormData,
    { rejectValue: string }
>(
    "user/updateProfilePicture",
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(
                "/padiman_route/user/profile-picture",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            return response.data.profileImage; // Return new image URL
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to upload profile picture");
        }
    }
);

export const deleteAccount = createAsyncThunk<void, void, { rejectValue: string }>(
    "user/deleteAccount",
    async (_, { rejectWithValue }) => {
        try {
            await axiosInstance.delete("/padiman_route/user/account");
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete account");
        }
    }
);

export const fetchDashboardOrders = createAsyncThunk<DashboardPayload, void, { rejectValue: string }>(
    "user/fetchDashboardOrders",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/padiman_route/user/orders/summary");
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch dashboard");
        }
    }
);

// --- Slice ---
const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearUser: (state) => {
            state.profile = null;
            state.dashboardData = { metrics: null, orders: null };
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get Profile
            .addCase(getProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
                state.profile = action.payload;
            })

            // Update Text Profile
            .addCase(updateProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
                if (state.profile) {
                    state.profile = { ...state.profile, ...action.payload };
                }
            })

            // 🔥 Update Profile Picture
            .addCase(updateProfilePicture.fulfilled, (state, action: PayloadAction<string>) => {
                if (state.profile) {
                    state.profile.profileImage = action.payload;
                }
            })

            // Delete Account
            .addCase(deleteAccount.fulfilled, (state) => {
                state.profile = null;
                state.dashboardData = { metrics: null, orders: null };
            })

            // Dashboard
            .addCase(fetchDashboardOrders.fulfilled, (state, action: PayloadAction<DashboardPayload>) => {
                state.dashboardData.metrics = action.payload.metrics;
                state.dashboardData.orders = action.payload.orders;
            })

            // Save Push Token
            .addCase(savePushToken.fulfilled, (state) => {
                // No state change needed
            })

            // Logout
            .addCase(logout, (state) => {
                state.profile = null;
                state.dashboardData = { metrics: null, orders: null };
                state.error = null;
            })

            // Global Loading & Error Handling
            .addMatcher(
                (action) => action.type.endsWith("/pending"),
                (state) => {
                    state.isLoading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/rejected"),
                (state, action: PayloadAction<string | undefined>) => {
                    state.isLoading = false;
                    state.error = action.payload || "An error occurred";
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/fulfilled"),
                (state) => {
                    state.isLoading = false;
                }
            );
    },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;