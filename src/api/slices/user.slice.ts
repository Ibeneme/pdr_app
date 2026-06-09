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
    skillset?: string;
    city?: string;
    idMeans?: string;
    deliveriesDone?: string;
    ridesOffered?: string;
    parcelsRequested?: string;
    profileImage?: string
}

interface UserState {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: UserState = {
    profile: null,
    isLoading: false,
    error: null,
};

// --- Async Thunks ---
export const savePushToken = createAsyncThunk<void, { expoPushToken: string }, { rejectValue: string }>(
    "user/savePushToken",
    async (payload, { rejectWithValue }) => {
        try {
            console.log("[USER SLICE] Sending push token to server:", payload.expoPushToken);
            
            await axiosInstance.post("/padiman_route/user/push-token", payload);
            
            console.log("[USER SLICE SUCCESS] Push token registered on server.");
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Failed to save push token";
            console.error("[USER SLICE ERROR] Push token save failed:", errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

export const getProfile = createAsyncThunk<UserProfile, void, { rejectValue: string }>(
    "user/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            console.log("[USER SLICE] Fetching profile data...");
            
            const response = await axiosInstance.get("/padiman_route/user/profile");
            
            console.log("[USER SLICE SUCCESS] Profile data received:", response.data);

            const userData = response.data;
            console.log("🔐 userDatay", userData);
          
            // === SAVE USER TO SECURE STORE ===
            if (userData && userData._id) {
                await saveUser(userData);

                console.log("🔐 User profile saved to secure storage successfully", );
            } else {
                console.warn("⚠️ Received profile data but missing _id — not saving");
            }

            return userData;
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Failed to fetch profile";
            
            console.error("[USER SLICE ERROR] Profile fetch failed:", {
                message: errMsg,
                status: error.response?.status,
                data: error.response?.data
            });
            
            return rejectWithValue(errMsg);
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

// --- Slice Configuration ---

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearUser: (state) => {
            state.profile = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle Successful Profile Fetches/Updates
            .addCase(getProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
                state.isLoading = false;
                state.profile = action.payload;
            })
            .addCase(updateProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
                state.isLoading = false;
                state.profile = { ...state.profile, ...action.payload } as UserProfile;
            })
            .addCase(deleteAccount.fulfilled, (state) => {
                state.isLoading = false;
                state.profile = null;
            })
            .addCase(savePushToken.fulfilled, (state) => {
                state.isLoading = false;
            })
            // Listen for the global logout action to clear profile
            .addCase(logout, (state) => {
                state.profile = null;
                state.error = null;
            })
            // Global Pending/Rejected Matchers
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
            );
    },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;