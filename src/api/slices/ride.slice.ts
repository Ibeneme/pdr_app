import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";

// --- TypeScript Interfaces ---
export interface RideOffer {
    _id: string;
    driver: string;
    pickupPoint: string;
    dropoffPoint: string;
    departureTime: string;
    availableSeats: number;
    estimatedFare: number;
    status: "active" | "booked" | "completed" | "cancelled";
    createdAt: string;
}

interface RideState {
    rides: RideOffer[];
    myRides: RideOffer[];
    currentRide: RideOffer | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: RideState = {
    rides: [],
    myRides: [],
    currentRide: null,
    isLoading: false,
    error: null,
};

const BASE_URL = "/padiman_route/ride-offers";

// --- Async Thunks with Console Logs ---

export const createRide = createAsyncThunk<RideOffer, Partial<RideOffer>, { rejectValue: string }>(
    "ride/createRide",
    async (data, { rejectWithValue }) => {
        console.log("🚀 [createRide] Thunk started");
        console.log("📦 Payload sent:", data);

        try {
            const response = await axiosInstance.post(BASE_URL, data);

            console.log("✅ [createRide] Request successful");
            console.log("📥 Response data:", response.data);

            return response.data.data;
        } catch (error: any) {
            console.error("💥 [createRide] Request failed");
            console.error("Error response:", error.response?.data);
            console.error("Error message:", error.message);

            return rejectWithValue(error.response?.data?.message || "Failed to create ride");
        }
    }
);

export const getAllRides = createAsyncThunk<RideOffer[], void, { rejectValue: string }>(
    "ride/getAllRides",
    async (_, { rejectWithValue }) => {
        console.log("🚀 [getAllRides] Thunk started");

        try {
            const response = await axiosInstance.get(BASE_URL);

            console.log("✅ [getAllRides] Success");
            console.log("📥 Fetched rides count:", response.data.data?.length || 0);

            return response.data.data;
        } catch (error: any) {
            console.error("💥 [getAllRides] Failed");
            console.error("Error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch rides");
        }
    }
);

export const getMyRides = createAsyncThunk<RideOffer[], void, { rejectValue: string }>(
    "ride/getMyRides",
    async (_, { rejectWithValue }) => {
        console.log("🚀 [getMyRides] Thunk started");

        try {
            const response = await axiosInstance.get(`${BASE_URL}/my-rides`);

            console.log("✅ [getMyRides] Success");
            console.log("📥 My rides count:", response.data.data?.length || 0);

            return response.data.data;
        } catch (error: any) {
            console.error("💥 [getMyRides] Failed");
            console.error("Error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to fetch your rides");
        }
    }
);

export const getRideByIdOffer = createAsyncThunk<RideOffer, string, { rejectValue: string }>(
    "ride/getRideByIdOffer",
    async (id, { rejectWithValue }) => {
        console.log("🚀 [getRideByIdOffer] Thunk started for ID:", id);

        try {
            const response = await axiosInstance.get(`${BASE_URL}/${id}`);

            console.log("✅ [getRideByIdOffer] Success");
            console.log("📥 Ride data:", response.data.data);

            return response.data.data;
        } catch (error: any) {
      }
    }
);

export const deleteRide = createAsyncThunk<string, string, { rejectValue: string }>(
    "ride/deleteRide",
    async (id, { rejectWithValue }) => {
        console.log("🚀 [deleteRide] Thunk started for ID:", id);

        try {
            await axiosInstance.delete(`${BASE_URL}/${id}`);

            console.log("✅ [deleteRide] Success - ID deleted:", id);
            return id;
        } catch (error: any) {
            console.error("💥 [deleteRide] Failed for ID:", id);
            console.error("Error:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || "Failed to delete ride");
        }
    }
);

// --- Slice with Console Logs ---

const rideSlice = createSlice({
    name: "ride",
    initialState,
    reducers: {
        clearCurrentRide: (state) => {
            console.log("🧹 [clearCurrentRide] Action called");
            state.currentRide = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // CREATE RIDE
            .addCase(createRide.pending, (state) => {
                console.log("⏳ [createRide] Pending...");
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createRide.fulfilled, (state, action) => {
                console.log("🎉 [createRide] Fulfilled - New ride added");
                console.log("New ride ID:", action.payload._id);

                state.isLoading = false;
                state.rides.unshift(action.payload);
                state.myRides.unshift(action.payload);
            })
            .addCase(createRide.rejected, (state, action) => {
                console.log("❌ [createRide] Rejected");
                state.isLoading = false;
                state.error = action.payload || "Failed to create ride";
            })

            // GET ALL RIDES
            .addCase(getAllRides.pending, (state) => {
                console.log("⏳ [getAllRides] Pending...");
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllRides.fulfilled, (state, action) => {
                console.log("🎉 [getAllRides] Fulfilled");
                state.isLoading = false;
                state.rides = action.payload;
            })
            .addCase(getAllRides.rejected, (state, action) => {
                console.log("❌ [getAllRides] Rejected");
                state.isLoading = false;
                state.error = action.payload || "Failed to fetch rides";
            })

            // GET MY RIDES
            .addCase(getMyRides.pending, (state) => {
                console.log("⏳ [getMyRides] Pending...");
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getMyRides.fulfilled, (state, action) => {
                console.log("🎉 [getMyRides] Fulfilled");
                state.isLoading = false;
                state.myRides = action.payload;
            })
            .addCase(getMyRides.rejected, (state, action) => {
                console.log("❌ [getMyRides] Rejected");
                state.isLoading = false;
                state.error = action.payload || "Failed to fetch your rides";
            })

            // GET RIDE BY ID
            .addCase(getRideByIdOffer.pending, (state) => {
                console.log("⏳ [getRideByIdOffer] Pending...");
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getRideByIdOffer.fulfilled, (state, action) => {
                console.log("🎉 [getRideByIdOffer] Fulfilled");
                state.isLoading = false;
                state.currentRide = action.payload;
            })
            .addCase(getRideByIdOffer.rejected, (state, action) => {
                console.log("❌ [getRideByIdOffer] Rejected");
                state.isLoading = false;
                state.error = action.payload || "Failed to fetch ride details";
            })

            // DELETE RIDE
            .addCase(deleteRide.pending, (state) => {
                console.log("⏳ [deleteRide] Pending...");
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteRide.fulfilled, (state, action) => {
                console.log("🎉 [deleteRide] Fulfilled - ID:", action.payload);
                state.isLoading = false;
                state.rides = state.rides.filter(r => r._id !== action.payload);
                state.myRides = state.myRides.filter(r => r._id !== action.payload);
            })
            .addCase(deleteRide.rejected, (state, action) => {
                console.log("❌ [deleteRide] Rejected");
                state.isLoading = false;
                state.error = action.payload || "Failed to delete ride";
            });
    },
});

export const { clearCurrentRide } = rideSlice.actions;
export default rideSlice.reducer;