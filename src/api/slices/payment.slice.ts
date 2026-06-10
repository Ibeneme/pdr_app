import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";
import { logout } from "./auth.slice";

// --- TypeScript Interfaces ---

export interface PaymentRecord {
    _id: string;
    negotiationId: string;
    userId: string;
    amount: number;
    reference: string;
    serviceType: "offer_a_ride" | "deliver_a_parcel";
    status: "pending" | "success" | "failed";
    createdAt: string;
    updatedAt: string;
}

interface PaymentState {
    payments: PaymentRecord[];
    checkoutUrl: string | null;
    activeReference: string | null;
    isLoading: boolean;
    error: string | null;
    isPaymentSuccess: boolean;
}

const initialState: PaymentState = {
    payments: [],
    checkoutUrl: null,
    activeReference: null,
    isLoading: false,
    error: null,
    isPaymentSuccess: false,
};

const BASE_URL = "/padiman_route/payments"; // Update path if your express root varies

// --- Async Thunks ---

// 1. Kickstart Checkout Window generation with Paystack
export const initializePayment = createAsyncThunk<
    { checkoutUrl: string; reference: string }, // Success return signature
    { negotiationId: string; serviceType: "offer_a_ride" | "deliver_a_parcel"; email: string; amount?: number; userId?: string },
    { rejectValue: string }
>(
    "payment/initialize",
    async (payload, { rejectWithValue }) => {
        console.log("📡 [SLICE_THUNK] Dispatching initializePayment to backend...", payload);
        try {
            const response = await axiosInstance.post(`${BASE_URL}/initialize`, payload);
            console.log("📥 [SLICE_THUNK] Initialization Response payload captured:", response.data);
            return {
                checkoutUrl: response.data.checkoutUrl,
                reference: response.data.reference
            };
        } catch (error: any) {
            console.error("❌ [SLICE_THUNK] Initialization dropped out:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || "Payment generation failed");
        }
    }
);

// 2. Verify Transaction reference outcome details
export const verifyPayment = createAsyncThunk<any, string, { rejectValue: string }>(
    "payment/verify",
    async (reference, { rejectWithValue }) => {
        try {
            // CRITICAL: Ensure there is a explicit forward slash separating the base URL and reference string parameter
            const response = await axiosInstance.get(`${BASE_URL}/verify/${reference}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Payment verification failure");
        }
    }
);
// --- Slice Configuration ---

const paymentSlice = createSlice({
    name: "payment",
    initialState,
    reducers: {
        clearPaymentState: (state) => {
            console.log("🧹 [SLICE_REDUCER] Flushing local payment parameters state tree");
            state.checkoutUrl = null;
            state.activeReference = null;
            state.error = null;
            state.isPaymentSuccess = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle Payment Initialized
            .addCase(initializePayment.fulfilled, (state, action) => {
                console.log("✅ [SLICE_FULFILLED] Checkout configuration updated globally");
                state.isLoading = false;
                state.checkoutUrl = action.payload.checkoutUrl;
                state.activeReference = action.payload.reference;
                state.isPaymentSuccess = false;
            })
            // Handle Payment Verification Successful
            .addCase(verifyPayment.fulfilled, (state, action) => {
                console.log("🎉 [SLICE_FULFILLED] Payment captured successfully. Core records are marked PAID");
                state.isLoading = false;
                state.isPaymentSuccess = action.payload.success;
                // Cleanup current processing instances out of active variables
                state.checkoutUrl = null;
            })
            // Flush state on logout event hook
            .addCase(logout, (state) => {
                console.log("🔒 [SLICE_LOGOUT] Purging all credential payment traces");
                state.payments = [];
                state.checkoutUrl = null;
                state.activeReference = null;
                state.isPaymentSuccess = false;
                state.error = null;
            })
            // Universal Generic Loader Pipeline Matches
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
                    state.isPaymentSuccess = false;
                    // state.error = action.payload || "Payment handling system error event";
                    // console.error(`🚨 [SLICE_REJECTED] Global payment exception caught: ${state.error}`);
                
                }
            );
    },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;