import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import userSlice from './slices/user.slice';
import parcelSlice from './slices/parcel.slice';
import rideSlice from './slices/ride.slice';
import negotiationSlice from './slices/negotiation.slice';
import paymentSlice from './slices/payment.slice';
import notificationSlice from './slices/notification.slice';
import walletSlice from './slices/wallet.slice';
import driverSlice from './slices/driver.slice';
import requestSlice from './slices/new.request.slice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userSlice,
        parcel: parcelSlice,
        ride: rideSlice,
        negotiation: negotiationSlice,
        payment: paymentSlice,
        notification: notificationSlice,
        wallet: walletSlice,
        driver: driverSlice,
        request: requestSlice
    },
});

// Export these hooks so you can use them in your components
// Instead of importing the raw useDispatch/useSelector, 
// you will use these typed versions.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;