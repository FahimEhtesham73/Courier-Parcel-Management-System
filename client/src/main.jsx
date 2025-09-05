import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import App from './App.jsx';
import parcelReducer from './features/parcels/parcelSlice.js';
import authReducer from './features/auth/authSlice.js';
import userReducer from './features/users/userSlice.js';
import adminReducer from './features/admin/adminSlice.js';

// Set Axios base URL
axios.defaults.baseURL = 'http://localhost:5000';

const store = configureStore({
  reducer: {
    parcels: parcelReducer,
    auth: authReducer,
    users: userReducer,
    admin: adminReducer,
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
);