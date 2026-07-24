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
    status: "pending" | "success" | "failed";
    paystackRawResponse?: Record<string, any>;
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
    isEscrowReleaseSuccess: boolean;
}

const initialState: PaymentState = {
    payments: [],
    checkoutUrl: null,
    activeReference: null,
    isLoading: false,
    error: null,
    isPaymentSuccess: false,
    isEscrowReleaseSuccess: false,
};

const BASE_URL = "/padiman_route/payments";

// --- Async Thunks ---

// 1. Kickstart Checkout Window generation with Paystack
export const initializePayment = createAsyncThunk<
    { checkoutUrl: string; reference: string },
    {
        negotiationId: string;
        serviceType?: string;
        email: string;
        amount?: number;
        userId?: string;
    },
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
                reference: response.data.reference,
            };
        } catch (error: any) {
            console.error("❌ [SLICE_THUNK] Initialization dropped out:", error.response?.data);
            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Payment generation failed"
            );
        }
    }
);

// 2. Verify Transaction reference outcome details
export const verifyPayment = createAsyncThunk<any, string, { rejectValue: string }>(
    "payment/verify",
    async (reference, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/verify/${reference}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Payment verification failure"
            );
        }
    }
);

// 3. Shift escrow balance item to spendable ledger balance parameters
export const releaseEscrowEarnings = createAsyncThunk<any, string, { rejectValue: string }>(
    "payment/releaseEscrow",
    async (negotiationId, { rejectWithValue }) => {
        console.log(`📡 [SLICE_THUNK] Releasing escrow items for Negotiation ID: ${negotiationId}`);
        try {
            const response = await axiosInstance.put(`${BASE_URL}/earnings/release/${negotiationId}`);
            console.log("📥 [SLICE_THUNK] Escrow cleared on db side context:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("❌ [SLICE_THUNK] Escrow release rejected:", error.response?.data);
            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to clear escrow items"
            );
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
            state.isEscrowReleaseSuccess = false;
        },
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
                console.log("🎉 [SLICE_FULFILLED] Payment captured successfully.");
                state.isLoading = false;
                state.isPaymentSuccess = action.payload.success;
                state.checkoutUrl = null;
            })
            // Handle Escrow Earnings Release Successful
            .addCase(releaseEscrowEarnings.fulfilled, (state, action) => {
                console.log("🎉 [SLICE_FULFILLED] Escrow unlocked cleanly.");
                state.isLoading = false;
                state.isEscrowReleaseSuccess = action.payload.success;
            })
            // Flush state on logout
            .addCase(logout, (state) => {
                console.log("🔒 [SLICE_LOGOUT] Purging all payment traces");
                state.payments = [];
                state.checkoutUrl = null;
                state.activeReference = null;
                state.isPaymentSuccess = false;
                state.isEscrowReleaseSuccess = false;
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
                    state.isEscrowReleaseSuccess = false;
                    state.error = action.payload || "Payment handling system error event";
                    console.error(`🚨 [SLICE_REJECTED] Payment exception caught: ${state.error}`);
                }
            );
    },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;