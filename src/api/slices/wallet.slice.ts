import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface Earnings {
    _id: string;
    payment?: string;
    negotiationId?: string;
    amount: number;
    reference: string;
    source: string;
    createdAt: string;
}

export interface Withdrawal {
    _id: string;
    amount: number;
    reference?: string;
    status: "pending" | "success" | "failed";
    bankDetails: {
        accountName?: string;
        accountNumber: string;
        bankName: string;
    };
    createdAt: string;
}

export interface Bank {
    id: number;
    name: string;
    code: string;
    longcode?: string;
    gateway?: string;
    active: boolean;
    is_deleted: boolean;
    country: string;
    currency: string;
    type: string;
}

// Added to structurally define resolved account payloads
export interface ResolvedAccount {
    accountName: string;
    accountNumber: string;
}

interface WalletState {
    balance: number;
    withdrawableBalance: number; // INTEGRATED: Withdrawable balance tracking property
    earnings: Earnings[];
    withdrawals: Withdrawal[];
    bankList: Bank[];
    resolvedAccount: ResolvedAccount | null; // Added to hold auto-populated bank recipient details
    isLoading: boolean;
    error: string | null;
}

const initialState: WalletState = {
    balance: 0,
    withdrawableBalance: 0, // INTEGRATED: Initialized to baseline value
    earnings: [],
    withdrawals: [],
    bankList: [],
    resolvedAccount: null, // Initialized as empty
    isLoading: false,
    error: null,
};

// ─── Async Thunks ───────────────────────────────────────────────────────────

// 1. Fetch Complete Wallet Profile
export const fetchWallet = createAsyncThunk<
    any,
    void,
    { rejectValue: string }
>("wallet/fetchWallet", async (_, { rejectWithValue }) => {
    console.log("🔍 [WALLET THUNK] Initiating API request to /padiman_route/wallet...");
    try {
        const response = await axiosInstance.get("/padiman_route/wallet");
        console.log("✅ [WALLET THUNK SUCCESS] Data received:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error: any) {
        console.error("💥 [WALLET THUNK ERROR] Request failed:", error.message);
        const errMsg = error.response?.data?.message || "Failed to fetch wallet";
        return rejectWithValue(errMsg);
    }
});

// 2. Fetch Separated Earnings History Route
export const fetchEarnings = createAsyncThunk<
    Earnings[],
    void,
    { rejectValue: string }
>("wallet/fetchEarnings", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/padiman_route/wallet/earnings");
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Failed to load earnings history");
    }
});

// 3. Fetch Separated Withdrawals History Route
export const fetchWithdrawals = createAsyncThunk<
    Withdrawal[],
    void,
    { rejectValue: string }
>("wallet/fetchWithdrawals", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/padiman_route/wallet/withdrawals");
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Failed to load withdrawal history");
    }
});

// 4. Fetch Supported Banks (From Paystack Gateway Engine)
export const fetchBankList = createAsyncThunk<
    Bank[],
    void,
    { rejectValue: string }
>("wallet/fetchBankList", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/padiman_route/wallet/banks");
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Failed to retrieve support banks listing");
    }
});

// 4b. Resolve Account Number (New Auto-Populate Action)
export const resolveAccount = createAsyncThunk<
    ResolvedAccount,
    { accountNumber: string; bankCode: string },
    { rejectValue: string }
>("wallet/resolveAccount", async ({ accountNumber, bankCode }, { rejectWithValue }) => {

    console.log(`🔍 [RESOLVE_ACCOUNT_THUNK] Sending POST request...`);

    try {
        // Use POST with the body as the second argument
        const response = await axiosInstance.post("/padiman_route/wallet/wallet/resolve-account", {
            accountNumber,
            bankCode
        });

        console.log("✅ [RESOLVE_ACCOUNT_THUNK_SUCCESS] Server response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("💥 [RESOLVE_ACCOUNT_THUNK_ERROR]:", error.response?.data || error.message);
        return rejectWithValue(error.response?.data?.message || "Failed to resolve account identity details");
    }
});
// 5. Submit Withdrawal Request
export const requestWithdrawal = createAsyncThunk<
    any,
    { amount: number; bankDetails: any },
    { rejectValue: string }
>("wallet/requestWithdrawal", async (data, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post("/padiman_route/wallet/withdraw", data);
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Withdrawal request failed");
    }
});

// 6. Initialize Gateway Cash Deposit Funding 
export const initializeFunding = createAsyncThunk<
    any,
    { amount: number; email: string },
    { rejectValue: string }
>("wallet/initializeFunding", async (data, { rejectWithValue }) => {
    console.log("=== INITIALIZE FUNDING THUNK STARTED ===");
    try {
        const response = await axiosInstance.post("/padiman_route/wallet/fund/initialize", data);
        console.log("=== INITIALIZE FUNDING THUNK SUCCESS ===");
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to initialize payment";
        return rejectWithValue(errorMessage);
    }
});

// 7. Process Gateway Order Transaction Settlement Audit & Top Up
export const verifyAndTopUp = createAsyncThunk<
    any,
    string,
    { rejectValue: string }
>("wallet/verifyAndTopUp", async (reference, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get(`/padiman_route/wallet/fund/verify/${reference}`);
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Verification processing failed");
    }
});

// ─── Slice ──────────────────────────────────────────────────────────────────

const walletSlice = createSlice({
    name: "wallet",
    initialState,
    reducers: {
        clearWalletError: (state) => {
            state.error = null;
        },
        // Helpful utility method to flush account info when clearing out frontend input forms
        clearResolvedAccount: (state) => {
            state.resolvedAccount = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Complete Wallet Object Lookup
            .addCase(fetchWallet.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchWallet.fulfilled, (state, action) => {
                state.isLoading = false;
                state.balance = action.payload.balance;
                // Safely maps withdrawable balance falling back to base balance if unavailable
                state.withdrawableBalance = action.payload.withdrawableBalance !== undefined
                    ? action.payload.withdrawableBalance
                    : action.payload.balance;
                state.earnings = action.payload.earnings || [];
                state.withdrawals = action.payload.withdrawals || [];
            })
            .addCase(fetchWallet.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to load wallet";
            })

            // Fetch Isolated Earnings Cases
            .addCase(fetchEarnings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchEarnings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.earnings = action.payload || [];
            })
            .addCase(fetchEarnings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to sync earnings history";
            })

            // Fetch Isolated Withdrawals Cases
            .addCase(fetchWithdrawals.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchWithdrawals.fulfilled, (state, action) => {
                state.isLoading = false;
                state.withdrawals = action.payload || [];
            })
            .addCase(fetchWithdrawals.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to sync withdrawal history";
            })

            // Paystack Bank Directory Synchronization
            .addCase(fetchBankList.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBankList.fulfilled, (state, action) => {
                state.isLoading = false;
                state.bankList = action.payload || [];
            })
            .addCase(fetchBankList.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to load supporting bank instances";
            })

            // Resolve Account Name Cases
            .addCase(resolveAccount.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.resolvedAccount = null; // Clear out older queries during new lookups
            })
            .addCase(resolveAccount.fulfilled, (state, action) => {
                state.isLoading = false;
                state.resolvedAccount = action.payload; // Saves { accountName, accountNumber }
            })
            .addCase(resolveAccount.rejected, (state, action) => {
                state.isLoading = false;
                state.resolvedAccount = null;
                state.error = action.payload || "Account verification failed";
            })

            // Outgoing Payout Withdraw Processing
            .addCase(requestWithdrawal.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(requestWithdrawal.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload?.wallet) {
                    state.balance = action.payload.wallet.balance;
                    state.withdrawableBalance = action.payload.wallet.withdrawableBalance !== undefined
                        ? action.payload.wallet.withdrawableBalance
                        : action.payload.wallet.balance;
                    state.withdrawals = action.payload.wallet.withdrawals || [];
                }
            })
            .addCase(requestWithdrawal.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Withdrawal failed";
            })

            // Funding Initialize Callbacks
            .addCase(initializeFunding.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(initializeFunding.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(initializeFunding.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Initialization failed";
            })

            // Funding Verification Handshakes
            .addCase(verifyAndTopUp.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyAndTopUp.fulfilled, (state, action) => {
                state.isLoading = false;
                state.balance = action.payload.balance;
                if (action.payload.withdrawableBalance !== undefined) {
                    state.withdrawableBalance = action.payload.withdrawableBalance;
                }
            })
            .addCase(verifyAndTopUp.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Verification failed";
            });
    },
});

export const { clearWalletError, clearResolvedAccount } = walletSlice.actions;
export default walletSlice.reducer;