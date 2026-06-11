import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";
import { logout } from "./auth.slice";

// --- TypeScript Interfaces ---

export interface ParcelBooking {
    _id: string;
    requestedBy: string | any; // Adjust to an object type if you populate user details on the frontend
    route: {
        pickupAddress: string;
        deliveryAddress: string;
    };
    parties: {
        sender: {
            fullName: string;
            contact: string;
        };
        recipient: {
            fullName: string;
            contact: string;
        };
    };
    item: {
        name: string;
        properties: {
            isFragile: boolean;
            isPerishable: boolean;
            isInsured: boolean;
        };
    };
    schedule: {
        type: string;
        date: string;
    };
    status: "pending" | "assigned" | "in-transit" | "delivered" | "cancelled";
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface ParcelState {
    parcels: ParcelBooking[];
    currentParcel: ParcelBooking | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: ParcelState = {
    parcels: [],
    currentParcel: null,
    isLoading: false,
    error: null,
};

interface JoinRideData {
    _id: string;
    requestedBy: string | any;
    route: {
        pickupAddress: string;
        deliveryAddress: string;
    };
    schedule: {
        type: string;
        date: string;
    };
    status: "pending" | "assigned" | "in-transit" | "delivered" | "cancelled";
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

const BASE_URL = "/padiman_route/send_a_delivery";

// --- Async Thunks ---

// 1. Create a new parcel booking
export const createParcelBooking = createAsyncThunk<ParcelBooking, Partial<ParcelBooking>, { rejectValue: string }>(
    "parcel/createParcelBooking",
    async (parcelData, { rejectWithValue }) => {
        try {
            console.log("[PARCEL SLICE] Booking new parcel...");
            const response = await axiosInstance.post(`${BASE_URL}`, parcelData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to create parcel booking");
        }
    }
);

export const createJoinRide = createAsyncThunk<JoinRideData, Partial<JoinRideData>, { rejectValue: string }>(
    "parcel/createJoinRide",
    async (joinRideData, { rejectWithValue }) => {
        try {
            console.log("[PARCEL SLICE] Creating join ride...");
            const response = await axiosInstance.post(`${BASE_URL}/create/join-ride`, joinRideData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to create join ride");
        }
    }
);

// 2. Fetch all parcels belonging to the logged-in user
export const getUserParcels = createAsyncThunk<ParcelBooking[], void, { rejectValue: string }>(
    "parcel/getUserParcels",
    async (_, { rejectWithValue }) => {
        try {
            console.log("[PARCEL SLICE] Fetching user parcels list...");
            const response = await axiosInstance.get(`${BASE_URL}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch user parcels");
        }
    }
);

// 3. Fetch a specific parcel by its unique ID string token
export const getParcelById = createAsyncThunk<ParcelBooking, string, { rejectValue: string }>(
    "parcel/getParcelById",
    async (id, { rejectWithValue }) => {
        try {
            console.log(`[PARCEL SLICE] Fetching tracking data for parcel ID: ${id}`);
            const response = await axiosInstance.get(`${BASE_URL}/${id}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Parcel not found");
        }
    }
);

// 4. Update an existing parcel data payload 
export const updateParcel = createAsyncThunk<ParcelBooking, { id: string; data: Partial<ParcelBooking> }, { rejectValue: string }>(
    "parcel/updateParcel",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            console.log(`[PARCEL SLICE] Updating attributes for parcel ID: ${id}`);
            const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to modify parcel tracking properties");
        }
    }
);

// 5. Delete / Cancel a parcel booking entry item node
export const deleteParcel = createAsyncThunk<string, string, { rejectValue: string }>(
    "parcel/deleteParcel",
    async (id, { rejectWithValue }) => {
        try {
            console.log(`[PARCEL SLICE] Cancelling booking execution for parcel ID: ${id}`);
            await axiosInstance.delete(`${BASE_URL}/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Cancellation failed");
        }
    }
);

// --- Slice Configuration ---

const parcelSlice = createSlice({
    name: "parcel",
    initialState,
    reducers: {
        clearCurrentParcel: (state) => {
            state.currentParcel = null;
        },
        clearParcelState: (state) => {
            state.parcels = [];
            state.currentParcel = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Parcel Fulfillment
            .addCase(createParcelBooking.fulfilled, (state, action: PayloadAction<ParcelBooking>) => {
                state.isLoading = false;
                state.parcels.unshift(action.payload);
                state.currentParcel = action.payload;
            })
            // Create Join Ride Fulfillment
            .addCase(createJoinRide.fulfilled, (state, action: PayloadAction<JoinRideData>) => {
                state.isLoading = false;
                // Note: JoinRideData is a subset — you may want to cast or extend if needed
                state.parcels.unshift(action.payload as ParcelBooking);
                state.currentParcel = action.payload as ParcelBooking;
            })
            // Fetch All Fulfillment
            .addCase(getUserParcels.fulfilled, (state, action: PayloadAction<ParcelBooking[]>) => {
                state.isLoading = false;
                state.parcels = action.payload;
            })
            // Fetch Single Item Fulfillment
            .addCase(getParcelById.fulfilled, (state, action: PayloadAction<ParcelBooking>) => {
                state.isLoading = false;
                state.currentParcel = action.payload;
            })
            // Update Item Fulfillment
            .addCase(updateParcel.fulfilled, (state, action: PayloadAction<ParcelBooking>) => {
                state.isLoading = false;
                state.currentParcel = action.payload;
                const idx = state.parcels.findIndex(p => p._id === action.payload._id);
                if (idx !== -1) state.parcels[idx] = action.payload;
            })
            // Delete / Cancel Item Fulfillment
            .addCase(deleteParcel.fulfilled, (state, action: PayloadAction<string>) => {
                state.isLoading = false;
                state.parcels = state.parcels.filter(p => p._id !== action.payload);
                if (state.currentParcel?._id === action.payload) {
                    state.currentParcel = null;
                }
            })
            // Listen for global user sign-out to scrub delivery files
            .addCase(logout, (state) => {
                state.parcels = [];
                state.currentParcel = null;
                state.error = null;
            })
            // Global Handling Matchers for pending and rejected states
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
                    state.error = action.payload || "A logistical system error occurred";
                }
            );
    },
});

export const { clearCurrentParcel, clearParcelState } = parcelSlice.actions;
export default parcelSlice.reducer;