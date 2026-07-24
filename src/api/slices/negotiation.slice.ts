import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";

// --- Interfaces ---
export interface NegotiationRecord {
    _id: string;
    negotiator: string | any;
    serviceProvider: string | any;
    service?: string;
    negotiatorService?: string;
    serviceType?: string;
    negotiatorServiceType?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface NegotiationState {
    currentNegotiation: NegotiationRecord | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: NegotiationState = {
    currentNegotiation: null,
    isLoading: false,
    error: null,
};

const BASE_URL = "/padiman_route/negs";

// --- Async Thunks ---

// 1. Create Negotiation
export const createNegotiation = createAsyncThunk<
    NegotiationRecord,
    {
        serviceProvider: string;
        service?: string;
        negotiatorService?: string;
        serviceType?: string;
        negotiatorServiceType?: string
    },
    { rejectValue: string }
>("negotiation/create", async (data, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post(`${BASE_URL}`, data);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to create negotiation"
        );
    }
});

// 2. Get Negotiation By ID
export const getNegotiationById = createAsyncThunk<
    NegotiationRecord,
    string,
    { rejectValue: string }
>("negotiation/getById", async (id, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get(`${BASE_URL}/${id}`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to fetch negotiation details"
        );
    }
});

// --- Slice ---
const negotiationSlice = createSlice({
    name: "negotiation",
    initialState,
    reducers: {
        clearNegotiationState: (state) => {
            state.currentNegotiation = null;
            state.error = null;
            state.isLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createNegotiation.fulfilled, (state, action: PayloadAction<NegotiationRecord>) => {
                state.currentNegotiation = action.payload;
                state.isLoading = false;
                state.error = null;
            })
            .addCase(getNegotiationById.fulfilled, (state, action: PayloadAction<NegotiationRecord>) => {
                state.currentNegotiation = action.payload;
                state.isLoading = false;
                state.error = null;
            })
            .addMatcher(
                (action) => action.type.startsWith("negotiation/") && action.type.endsWith("/pending"),
                (state) => {
                    state.isLoading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.startsWith("negotiation/") && action.type.endsWith("/rejected"),
                (state, action: any) => {
                    state.isLoading = false;
                    state.error = action.payload || "An error occurred";
                }
            );
    },
});

export const { clearNegotiationState } = negotiationSlice.actions;
export default negotiationSlice.reducer;