import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";
import { logout } from "./auth.slice";

// --- TypeScript Interfaces ---

export interface Negotiation {
    _id: string;
    negotiator: { _id: string; name: string; email: string; profilePicture?: string };
    serviceProvider: { _id: string; name: string; email: string; profilePicture?: string };
    service: { _id: string; parcelType?: string; pickupAddress?: string; deliveryAddress?: string };
    negotiatorService: string;
    serviceType: "offer_a_ride" | "deliver_a_parcel"; // Added field
    status: "ride pending" | "ride agreed" | "ride started" | "ride ongoing" | "ride completed" | "ride cancelled";
    agreedAmount?: number;
    isConfirmed?: boolean;
    isPaid?: boolean;
    createdAt: string;
    updatedAt: string;
}

interface NegotiationState {
    negotiations: Negotiation[];
    currentNegotiation: Negotiation | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: NegotiationState = {
    negotiations: [],
    currentNegotiation: null,
    isLoading: false,
    error: null,
};

const BASE_URL = "/padiman_route/negs";

// --- Async Thunks ---

// 1. Create a new negotiation (Negotiator ID removed from payload as per backend)
export const createNegotiation = createAsyncThunk<
    Negotiation,
    { serviceProvider: string; service: string; negotiatorService: string; serviceType: string },
    { rejectValue: string }
>(
    "negotiation/create",
    async (data, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`${BASE_URL}`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || "Failed to create negotiation");
        }
    }
);

// 2. Fetch all negotiations for the logged-in user
export const getMyNegotiations = createAsyncThunk<Negotiation[], void, { rejectValue: string }>(
    "negotiation/getAll",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/my-negotiations`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || "Failed to fetch negotiations");
        }
    }
);

// 3. Update an existing negotiation
export const updateNegotiation = createAsyncThunk<Negotiation, { id: string; data: Partial<Negotiation> }, { rejectValue: string }>(
    "negotiation/update",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.patch(`${BASE_URL}/${id}`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || "Failed to update negotiation");
        }
    }
);

// 4. Cancel a negotiation
export const cancelNegotiation = createAsyncThunk<Negotiation, string, { rejectValue: string }>(
    "negotiation/cancel",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.patch(`${BASE_URL}/${id}/cancel`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || "Cancellation failed");
        }
    }
);

// 5. Fetch a single negotiation by ID
export const getNegotiationById = createAsyncThunk<Negotiation, string, { rejectValue: string }>(
    "negotiation/getById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${id}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || "Failed to fetch negotiation");
        }
    }
);

// --- Slice Configuration ---

const negotiationSlice = createSlice({
    name: "negotiation",
    initialState,
    reducers: {
        clearNegotiationState: (state) => {
            state.negotiations = [];
            state.currentNegotiation = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createNegotiation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.negotiations.unshift(action.payload);
            })
            .addCase(getMyNegotiations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.negotiations = action.payload;
            })
            .addCase(updateNegotiation.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.negotiations.findIndex(n => n._id === action.payload._id);
                if (index !== -1) state.negotiations[index] = action.payload;
            })
            .addCase(cancelNegotiation.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.negotiations.findIndex(n => n._id === action.payload._id);
                if (index !== -1) state.negotiations[index] = action.payload;
            })
            .addCase(logout, (state) => {
                state.negotiations = [];
                state.currentNegotiation = null;
            })
            // Inside the extraReducers builder:
            .addCase(getNegotiationById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentNegotiation = action.payload;
            })
            .addMatcher(
                (action) => action.type.endsWith("/pending"),
                (state) => { state.isLoading = true; state.error = null; }
            )
            .addMatcher(
                (action) => action.type.endsWith("/rejected"),
                (state, action: PayloadAction<string | undefined>) => {
                    state.isLoading = false;
                    state.error = action.payload || "Negotiation system error";
                }
            );
    },
});

export const { clearNegotiationState } = negotiationSlice.actions;
export default negotiationSlice.reducer;