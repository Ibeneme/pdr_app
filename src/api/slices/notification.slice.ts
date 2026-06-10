import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../axiosInstance";

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface Notification {
    _id: string;
    title: string;
    body: string;
    type: "ORDER" | "RIDE" | "PAYMENT" | "SYSTEM" | "CHAT" | "GENERAL" | "NEGOTIATION";
    data: any;
    read: boolean;
    sentViaPush: boolean;
    createdAt: string;
    updatedAt: string;
    message?:any
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};

// ─── Async Thunks ───────────────────────────────────────────────────────────

// Fetch all notifications
export const fetchNotifications = createAsyncThunk<
    Notification[],
    void,
    { rejectValue: string }
>("notification/fetchNotifications", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/padiman_route/notifications");
        return response.data.notifications || [];
    } catch (error: any) {
        const errMsg = error.response?.data?.message || "Failed to fetch notifications";
        return rejectWithValue(errMsg);
    }
});

// Mark single notification as read
export const markNotificationAsRead = createAsyncThunk<
    string,
    string,
    { rejectValue: string }
>("notification/markAsRead", async (id, { rejectWithValue }) => {
    try {
        await axiosInstance.put(`/padiman_route/notifications/${id}/read`);
        return id;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Failed to mark as read");
    }
});

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk<
    void,
    void,
    { rejectValue: string }
>("notification/markAllAsRead", async (_, { rejectWithValue }) => {
    try {
        await axiosInstance.put("/padiman_route/notifications/mark-all-read");
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Failed to mark all as read");
    }
});

// ─── Slice ──────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
    name: "notification",
    initialState,
    reducers: {
        clearNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
            state.error = null;
        },
        // Optional: Add new notification locally (for real-time updates)
        addNotification: (state, action: PayloadAction<Notification>) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.read) {
                state.unreadCount += 1;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Notifications
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
                state.isLoading = false;
                state.notifications = action.payload;
                state.unreadCount = action.payload.filter((n) => !n.read).length;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to load notifications";
            })

            // Mark Single as Read
            .addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<string>) => {
                const notif = state.notifications.find((n) => n._id === action.payload);
                if (notif && !notif.read) {
                    notif.read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })

            // Mark All as Read
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                state.notifications.forEach((n) => {
                    n.read = true;
                });
                state.unreadCount = 0;
            });
    },
});

export const { clearNotifications, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;