import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import parcelReducer from '../features/parcels/parcelSlice';
import userReducer from '../features/users/userSlice';
import adminReducer from '../features/admin/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    parcels: parcelReducer,
    users: userReducer,
    admin: adminReducer,
  },
});