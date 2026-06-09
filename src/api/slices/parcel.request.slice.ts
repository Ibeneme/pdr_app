import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";
import { logout } from "./auth.slice";
import { isRejected } from "@reduxjs/toolkit";

// --- TypeScript Interfaces ---

export interface ParcelRequest {
    _id: string;
    user: string;
    pickupAddress: string;
    destinationCity: string;
    properties: {
        isPerishable: boolean;
        isFragile: boolean;
    };
    priceRange: {
        min: number;
        max: number;
    };
    dispatchDate: string;
    availabilityWindow: {
        from: string;
        to: string;
    };
    status: "pending" | "active" | "completed" | "cancelled";
    createdAt: string;
    negotiations?: string
}

interface ParcelState {
    parcels: ParcelRequest[];
    currentParcel: ParcelRequest | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: ParcelState = {
    parcels: [],
    currentParcel: null,
    isLoading: false,
    error: null,
};

// Must match: app.use("/api/v1/padiman_route/deliver_a_delivery", ...)
const BASE_URL = "/padiman_route/deliver_a_delivery";

// --- Async Thunks ---

export const createParcelRequest = createAsyncThunk<ParcelRequest, Partial<ParcelRequest>, { rejectValue: string }>(
    "parcel/createRequest",
    async (data, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`${BASE_URL}`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to create request");
        }
    }
);

export const getUserRequests = createAsyncThunk<ParcelRequest[], void, { rejectValue: string }>(
    "parcel/getAllRequests",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch requests");
        }
    }
);

export const getRequestById = createAsyncThunk<ParcelRequest, string, { rejectValue: string }>(
    "parcel/getRequestById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${id}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Request not found");
        }
    }
);

export const updateParcelRequest = createAsyncThunk<ParcelRequest, { id: string; data: Partial<ParcelRequest> }, { rejectValue: string }>(
    "parcel/updateRequest",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to update request");
        }
    }
);

export const deleteParcelRequest = createAsyncThunk<string, string, { rejectValue: string }>(
    "parcel/deleteRequest",
    async (id, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`${BASE_URL}/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete request");
        }
    }
);

// Fetch all requests across the platform (Global View)
export const getAllGlobalRequests = createAsyncThunk<ParcelRequest[], void, { rejectValue: string }>(
    "parcel/getAllGlobalRequests",
    async (_, { rejectWithValue }) => {
        try {
            // 1. Log the exact URL being called
            console.log("🔍 [getAllGlobalRequests] Fetching from:", `${BASE_URL}/all`);
            
            const response = await axiosInstance.get(`${BASE_URL}/getAllRequests/all`);
            
            // 2. Log the successful response
            console.log("✅ [getAllGlobalRequests] Success:", response.data);
            
            return response.data.data;
        } catch (error: any) {
            // 3. Log the full error object to see exactly what the server returned
            console.error("❌ [getAllGlobalRequests] Error details:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            return rejectWithValue(error.response?.data?.message || "Failed to fetch global requests");
        }
    }
);

// --- Slice ---

const parcelSlice = createSlice({
    name: "parcel",
    initialState,
    reducers: {
        clearCurrentParcel: (state) => { state.currentParcel = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createParcelRequest.fulfilled, (state, action) => {
                state.isLoading = false;
                state.parcels.unshift(action.payload);
            })
            .addCase(getUserRequests.fulfilled, (state, action) => {
                state.isLoading = false;
                state.parcels = action.payload;
            })
            .addCase(getRequestById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentParcel = action.payload;
            })
            .addCase(updateParcelRequest.fulfilled, (state, action) => {
                state.isLoading = false;
                const idx = state.parcels.findIndex(p => p._id === action.payload._id);
                if (idx !== -1) state.parcels[idx] = action.payload;
                state.currentParcel = action.payload;
            })
            .addCase(deleteParcelRequest.fulfilled, (state, action) => {
                state.isLoading = false;
                state.parcels = state.parcels.filter(p => p._id !== action.payload);
            })
            .addCase(logout, (state) => {
                state.parcels = [];
                state.currentParcel = null;
            })
            .addCase(getAllGlobalRequests.fulfilled, (state, action) => {
                state.isLoading = false;
                state.parcels = action.payload;
            })
            .addMatcher((action) => action.type.endsWith("/pending"), (state) => { state.isLoading = true; state.error = null; })
            .addMatcher(isRejected(createParcelRequest, getUserRequests, getRequestById, updateParcelRequest, deleteParcelRequest, getAllGlobalRequests),
                (state, action) => {
                    state.isLoading = false;
                    state.error = action.payload as string || "An error occurred";
                }
            );
    },
});

export const { clearCurrentParcel } = parcelSlice.actions;
export default parcelSlice.reducer;