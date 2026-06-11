import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";
import { logout } from "./auth.slice";

// ==================== INTERFACES ====================

export interface JoinRide {
    _id: string;
    requestedBy: string | any;
    route: { pickupAddress: string; deliveryAddress: string };
    schedule: { type: string; date: string };
    status: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ParcelRequest {
    _id: string;
    user: string | any;
    pickupAddress: string;
    destinationCity: string;
    properties: { isPerishable: boolean; isFragile: boolean };
    priceRange?: { min: number; max: number };
    dispatchDateStart?: string;
    dispatchDateEnd?: string;
    status: string;
    notes?: string;
    negotiations?: any[];
    createdAt: string;
}

export interface RideOffer {
    _id: string;
    driver: string | any;
    pickupPoint: string;
    dropoffPoint: string;
    departureTime: string;
    availableSeats: number;
    estimatedFare: number;
    status: string;
    notes?: string;
    negotiations?: any[];
    createdAt: string;
}

export interface AllUserRequests {
    parcels: any[];
    joinRides: JoinRide[];
    parcelRequests: ParcelRequest[];
    rideOffers: RideOffer[];
    total: number;
}

// ==================== STATE ====================

interface RequestState {
    allRequests: AllUserRequests | null;
    currentRequest: any;
    isLoading: boolean;
    error: string | null;
}

const initialState: RequestState = {
    allRequests: null,
    currentRequest: null,
    isLoading: false,
    error: null,
};

// ==================== ASYNC THUNKS ====================

export const getUserAllRequests = createAsyncThunk<AllUserRequests, void, { rejectValue: string }>(
    "request/getUserAllRequests",
    async (_, { rejectWithValue }) => {
        try {
            console.log("[REQUEST SLICE] Fetching all user requests...");
            const response = await axiosInstance.get("/padiman_route/user/my-requests"); // Adjust route if needed
            console.log("[REQUEST SLICE] All requests fetched successfully:", response.data);
            return response.data.data;
        } catch (error: any) {
            console.error("[REQUEST SLICE] Error fetching all requests:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch requests");
        }
    }
);

export const getRequestById = createAsyncThunk<any, { id: string; type: string }, { rejectValue: string }>(
    "request/getRequestById",
    async ({ id, type }, { rejectWithValue }) => {
        try {
            console.log(`[REQUEST SLICE] Fetching ${type} with ID: ${id}`);
            const response = await axiosInstance.get(`/padiman_route/user/${id}?type=${type}`);
            console.log(`[REQUEST SLICE] ${type} fetched successfully:`, response.data);
            return response.data.data;
        } catch (error: any) {
            console.error(`[REQUEST SLICE] Error fetching ${type}:`, error.response?.data);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch request");
        }
    }
);


// ==================== SLICE ====================

const requestSlice = createSlice({
    name: "request",
    initialState,
    reducers: {
        clearCurrentRequest: (state) => {
            state.currentRequest = null;
        },
        clearAllRequests: (state) => {
            state.allRequests = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get All Requests
            .addCase(getUserAllRequests.fulfilled, (state, action: PayloadAction<AllUserRequests>) => {
                state.allRequests = action.payload;
            })

            // Get Single Request
            .addCase(getRequestById.fulfilled, (state, action: PayloadAction<any>) => {
                state.currentRequest = action.payload;
            })

            // Logout cleanup
            .addCase(logout, (state) => {
                state.allRequests = null;
                state.currentRequest = null;
                state.error = null;
            })

            // Global Matchers
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

export const { clearCurrentRequest, clearAllRequests } = requestSlice.actions;
export default requestSlice.reducer;