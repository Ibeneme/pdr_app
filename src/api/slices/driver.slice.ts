import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";

// --- Interfaces ---
export interface DriverApplication {
    user: string;
    carDetails: { model: string; licensePlate: string; year: number };
    carImages: string[];
    driversLicense: { licenseNumber: string; image: string };
    status: 'submitted' | 'approved' | 'rejected' | 'suspended';
    rejectionReason?: string;
}

interface DriverState {
    application: DriverApplication | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: DriverState = {
    application: null,
    isLoading: false,
    error: null,
};

// --- Async Thunks ---

// 1. Submit Application (handles FormData)
export const applyAsDriver = createAsyncThunk<
    DriverApplication,
    FormData,
    { rejectValue: string }
>("driver/apply", async (formData, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post("/padiman_route/driver/apply", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data.application;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Failed to submit application");
    }
});

// 2. Fetch Status
export const getDriverStatus = createAsyncThunk<
    DriverApplication,
    void,
    { rejectValue: string }
>("driver/status", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/padiman_route/driver/status");
        return response.data.details;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch driver status");
    }
});

// --- Slice ---
const driverSlice = createSlice({
    name: "driver",
    initialState,
    reducers: {
        resetDriverState: (state) => {
            state.application = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(applyAsDriver.fulfilled, (state, action) => {
                state.application = action.payload;
                state.isLoading = false;
            })
            .addCase(getDriverStatus.fulfilled, (state, action) => {
                state.application = action.payload;
                state.isLoading = false;
            })
            // Generic Loading/Error Matchers
            .addMatcher((action) => action.type.startsWith("driver/") && action.type.endsWith("/pending"), (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addMatcher((action) => action.type.startsWith("driver/") && action.type.endsWith("/rejected"), (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "An error occurred";
            });
    },
});

export const { resetDriverState } = driverSlice.actions;
export default driverSlice.reducer;