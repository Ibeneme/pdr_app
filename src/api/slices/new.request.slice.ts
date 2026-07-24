import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";
import { logout } from "./auth.slice";

export interface Location {
    address: string;
    coordinates?: {
        type: string;
        coordinates: number[];
    };
}

export interface ServiceProvider {
    providerId: string;
    requestId?: string;
    bidAmount?: number;
    proposedTime?: string;
    status: "pending" | "accepted" | "rejected";
    createdAt: string;
}

export interface Rating {
    score: number;
    comment?: string;
    ratedBy?: string;
    ratedAt?: string;
}

// ====================== Per-type `meta` shapes ======================
export interface SendPackageMeta {
    isPerishable: boolean;
    isFragile: boolean;
    senderFullName: string;
    senderPhone: string;
    receiverFullName: string;
    receiverPhone: string;
    note?: string;
}

export interface DeliverPackageMeta {
    pickupLocation: Location;
    deliveryLocation: Location;
    isPerishable: boolean;
    isFragile: boolean;
    pickupDate: string;
    pickupTime: string;
    agreedPrice: number;
}

export interface JoinRideMeta {
    notes?: string;
}

export interface OfferJoinMeta {
    numberOfPassengers: number;
    notes?: string;
}

interface BaseRequestFields {
    _id: string;
    userId: string;
    pickupLocation: Location;
    deliveryLocation: Location;
    pickupDate: string;
    pickupTime: string;
    agreedPrice: number;
    isPaid: boolean;
    isRated: boolean;
    rating?: Rating;
    status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled" | "expired";
    serviceProviders: ServiceProvider[];
    assignedProvider?: string;
    currentLocation?: string;
    handOverProof?: string;
    inRideWith?: string;
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
    finalPrice: number;
}

export type RequestRecord =
    | (BaseRequestFields & { type: "send-package"; meta: SendPackageMeta })
    | (BaseRequestFields & { type: "deliver-package"; meta: DeliverPackageMeta })
    | (BaseRequestFields & { type: "join-ride"; meta: JoinRideMeta })
    | (BaseRequestFields & { type: "offer-ride"; meta: OfferJoinMeta });

// ====================== Create-payload shapes ======================
interface CreateBaseFields {
    pickupLocation: Location;
    deliveryLocation: Location;
    pickupDate: string;
    pickupTime: string;
    agreedPrice?: number;
}

export type CreateRequestPayload =
    | (CreateBaseFields & { type: "send-package"; meta: SendPackageMeta })
    | (CreateBaseFields & { type: "deliver-package"; meta: DeliverPackageMeta })
    | (CreateBaseFields & { type: "join-ride"; meta: JoinRideMeta })
    | (CreateBaseFields & { type: "offer-ride"; meta: OfferJoinMeta });

interface RequestState {
    requests: RequestRecord[];
    matchingRequests: RequestRecord[]; // NEW: To hold paired matches
    currentRequest: RequestRecord | null;
    isLoading: boolean;
    isMatchingLoading: boolean; // NEW: Separate loading state for finding pairs
    error: string | null;
    success: boolean;
}

const initialState: RequestState = {
    requests: [],
    matchingRequests: [],
    currentRequest: null,
    isLoading: false,
    isMatchingLoading: false,
    error: null,
    success: false,
};

const BASE_URL = "/padiman_route/types/requests";   // Adjust if your route prefix is different

// ====================== Async Thunks ======================

// 1. Create Request
export const createRequest = createAsyncThunk<
    RequestRecord,
    CreateRequestPayload,
    { rejectValue: string }
>(
    "request/create",
    async (payload, { rejectWithValue }) => {
        console.log("📡 [REQUEST_SLICE] Creating new request...", payload);
        try {
            const response = await axiosInstance.post(BASE_URL, payload);
            console.log("✅ [REQUEST_SLICE] Request created successfully:", response.data);
            return response.data.data || response.data;
        } catch (error: any) {
            console.error("❌ [REQUEST_SLICE] Create failed:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || "Failed to create request");
        }
    }
);

// 2. Get User's Requests
export const getUserRequests = createAsyncThunk<
    RequestRecord[],
    { status?: string; type?: RequestRecord["type"] } | undefined,
    { rejectValue: string }
>(
    "request/getUserRequests",
    async (filters, { rejectWithValue }) => {
        console.log("📡 [REQUEST_SLICE] Fetching user requests...", filters);
        try {
            const params = new URLSearchParams();
            if (filters?.status) params.append("status", filters.status);
            if (filters?.type) params.append("type", filters.type);
            const response = await axiosInstance.get(`${BASE_URL}/me`, { params });
            return response.data.data || response.data;
        } catch (error: any) {
            console.error("❌ [REQUEST_SLICE] Get user requests failed:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch requests");
        }
    }
);

// 3. Get Single Request
export const getRequest = createAsyncThunk<
    RequestRecord,
    string,
    { rejectValue: string }
>(
    "request/getRequest",
    async (id, { rejectWithValue }) => {
        console.log(`📡 [REQUEST_SLICE] Fetching request ID: ${id}`);
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${id}`);
            return response.data.data || response.data;
        } catch (error: any) {
            console.error("❌ [REQUEST_SLICE] Get request failed:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch request");
        }
    }
);

// 4. Update Request
export const updateRequest = createAsyncThunk<
    RequestRecord,
    { id: string; data: FormData },
    { rejectValue: string }
>(
    "request/update",
    async ({ id, data }, { rejectWithValue }) => {
        console.log(`📡 [REQUEST_SLICE] Updating request ${id}...`);
        try {
            const response = await axiosInstance.put(`${BASE_URL}/${id}`, data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("✅ [REQUEST_SLICE] Request updated successfully");
            return response.data.data || response.data;
        } catch (error: any) {
            console.error("❌ [REQUEST_SLICE] Update failed:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || "Failed to update request");
        }
    }
);

// 5. Update Request Progress (status / location / handover proof)
export const updateRequestProgress = createAsyncThunk<
    RequestRecord,
    { id: string; data: FormData },
    { rejectValue: string }
>(
    "request/updateProgress",
    async ({ id, data }, { rejectWithValue }) => {
        console.log(`📡 [REQUEST_SLICE] Updating progress for request ${id}...`);
        try {
            const response = await axiosInstance.put(`${BASE_URL}/progress/${id}`, data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("✅ [REQUEST_SLICE] Progress updated successfully");
            return response.data.data || response.data;
        } catch (error: any) {
            console.error("❌ [REQUEST_SLICE] Progress update failed:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || "Failed to update request progress");
        }
    }
);

// 6. Get Matching Requests (Pairing) - NEW
export const getMatchingRequests = createAsyncThunk<
    RequestRecord[],
    string, // requestId
    { rejectValue: string }
>(
    "request/getMatches",
    async (id, { rejectWithValue }) => {
        console.log(`📡 [REQUEST_SLICE] Fetching matches for request ID: ${id}`);
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${id}/matches`);
            return response.data.data || response.data;
        } catch (error: any) {
            console.error("❌ [REQUEST_SLICE] Get matches failed:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch matching requests");
        }
    }
);

// ====================== Slice ======================
const requestSlice = createSlice({
    name: "request",
    initialState,
    reducers: {
        clearRequestState: (state) => {
            console.log("🧹 [REQUEST_SLICE] Clearing request state");
            state.currentRequest = null;
            state.matchingRequests = [];
            state.error = null;
            state.success = false;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create Request
            .addCase(createRequest.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createRequest.fulfilled, (state, action: PayloadAction<RequestRecord>) => {
                console.log("✅ [REQUEST_SLICE] Request creation fulfilled");
                state.isLoading = false;
                state.success = true;
                state.requests.unshift(action.payload);
                state.currentRequest = action.payload;
            })
            .addCase(createRequest.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to create request";
                state.success = false;
            })
            // Get User Requests
            .addCase(getUserRequests.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getUserRequests.fulfilled, (state, action: PayloadAction<RequestRecord[]>) => {
                console.log(`✅ [REQUEST_SLICE] Loaded ${action.payload.length} requests`);
                state.isLoading = false;
                state.requests = action.payload;
            })
            .addCase(getUserRequests.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to load requests";
            })
            // Get Single Request
            .addCase(getRequest.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getRequest.fulfilled, (state, action: PayloadAction<RequestRecord>) => {
                state.isLoading = false;
                state.currentRequest = action.payload;
            })
            .addCase(getRequest.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to load request";
            })
            // Update Request
            .addCase(updateRequest.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateRequest.fulfilled, (state, action: PayloadAction<RequestRecord>) => {
                console.log("✅ [REQUEST_SLICE] Request updated successfully");
                state.isLoading = false;
                state.success = true;
                state.currentRequest = action.payload;
                const index = state.requests.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.requests[index] = action.payload;
                }
            })
            .addCase(updateRequest.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to update request";
                state.success = false;
            })
            // Update Request Progress
            .addCase(updateRequestProgress.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateRequestProgress.fulfilled, (state, action: PayloadAction<RequestRecord>) => {
                console.log("✅ [REQUEST_SLICE] Progress updated successfully");
                state.isLoading = false;
                state.success = true;
                state.currentRequest = action.payload;
                const index = state.requests.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.requests[index] = action.payload;
                }
            })
            .addCase(updateRequestProgress.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to update request progress";
                state.success = false;
            })
            // Get Matching Requests (Pairing)
            .addCase(getMatchingRequests.pending, (state) => {
                state.isMatchingLoading = true;
                state.error = null;
            })
            .addCase(getMatchingRequests.fulfilled, (state, action: PayloadAction<RequestRecord[]>) => {
                console.log(`✅ [REQUEST_SLICE] Loaded ${action.payload.length} matching requests`);
                state.isMatchingLoading = false;
                state.matchingRequests = action.payload;
            })
            .addCase(getMatchingRequests.rejected, (state, action) => {
                state.isMatchingLoading = false;
                state.error = action.payload || "Failed to load matching requests";
            })
            // Logout Cleanup
            .addCase(logout, (state) => {
                console.log("🔒 [REQUEST_SLICE] Clearing data on logout");
                state.requests = [];
                state.matchingRequests = [];
                state.currentRequest = null;
                state.error = null;
                state.success = false;
                state.isMatchingLoading = false;
            });
    },
});

export const { clearRequestState, clearError } = requestSlice.actions;
export default requestSlice.reducer;