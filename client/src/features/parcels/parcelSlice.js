import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/parcels/';

// Async Thunks
export const createParcel = createAsyncThunk(
  'parcels/create',
  async (parcelData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(API_URL, parcelData, config);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getParcels = createAsyncThunk(
  'parcels/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(API_URL, config);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getParcelById = createAsyncThunk(
  'parcels/getById',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(API_URL + id, config);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateParcel = createAsyncThunk(
  'parcels/update',
  async ({ id, parcelData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put(API_URL + id, parcelData, config);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteParcel = createAsyncThunk(
  'parcels/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.delete(API_URL + id, config);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateParcelStatus = createAsyncThunk(
  'parcels/updateStatus',
  async ({ id, status, failureReason, deliveryNotes }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const updateData = { status };
      if (failureReason) updateData.failureReason = failureReason;
      if (deliveryNotes) updateData.deliveryNotes = deliveryNotes;
      
      const response = await axios.put(`${API_URL}${id}/status`, updateData, config);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const parcelSlice = createSlice({
  name: 'parcels',
  initialState: {
    parcels: [],
    parcel: null,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetParcelState: (state) => {
      state.loading = false;
      state.error = null;
    },
    parcelStatusUpdated: (state, action) => {
      const updatedParcel = action.payload;
      const parcelsList = Array.isArray(state.parcels) ? state.parcels : state.parcels.parcels || [];
      const updatedParcels = parcelsList.map((parcel) =>
        parcel._id === updatedParcel._id ? updatedParcel : parcel
      );
      
      if (Array.isArray(state.parcels)) {
        state.parcels = updatedParcels;
      } else {
        state.parcels.parcels = updatedParcels;
      }
      
      // If the updated parcel is the currently viewed single parcel
      if (state.parcel && state.parcel._id === updatedParcel._id) {
        state.parcel = updatedParcel;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Parcel
      .addCase(createParcel.pending, (state) => {
        state.loading = true;
      })
      .addCase(createParcel.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (Array.isArray(state.parcels)) {
          state.parcels.push(action.payload);
        } else if (state.parcels.parcels) {
          state.parcels.parcels.push(action.payload);
        } else {
          state.parcels = [action.payload];
        }
      })
      .addCase(createParcel.rejected, (state, action) => { // Explicitly handle rejected case
        state.loading = false;
        state.error = action.payload;
      })
      // Get Parcels
      .addCase(getParcels.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear previous errors
      })
      .addCase(getParcels.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both array and paginated response formats
        if (Array.isArray(action.payload)) {
          state.parcels = action.payload;
          state.pagination = null;
        } else {
          state.parcels = action.payload.parcels || action.payload;
          state.pagination = action.payload.pagination || null;
        }
      })
      .addCase(getParcels.rejected, (state, action) => { // Explicitly handle rejected case
        state.loading = false;
        state.error = action.payload;
      })
      // Get Parcel By Id
      .addCase(getParcelById.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear previous errors
        state.parcel = null; // Clear previous single parcel data
      })
      .addCase(getParcelById.fulfilled, (state, action) => {
        state.loading = false;
        state.parcel = action.payload;
      })
      .addCase(getParcelById.rejected, (state, action) => { // Explicitly handle rejected case
        state.loading = false;
        state.error = action.payload;
        state.parcel = null;
      })
      // Update Parcel
      .addCase(updateParcel.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear previous errors
      })
      .addCase(updateParcel.fulfilled, (state, action) => {
        state.loading = false;
        // Clear error on success
        state.error = null;


        // Update the parcel in the parcels array
        const parcelsList = Array.isArray(state.parcels) ? state.parcels : state.parcels.parcels || [];
        const updatedParcels = parcelsList.map((parcel) =>
          parcel._id === action.payload._id ? action.payload : parcel
        );
        
        if (Array.isArray(state.parcels)) {
          state.parcels = updatedParcels;
        } else {
          state.parcels.parcels = updatedParcels;
        }
        
        // If the updated parcel is the currently viewed single parcel
        if (state.parcel && state.parcel._id === action.payload._id) {
          state.parcel = action.payload;
        }
      }) // Explicitly handle rejected case
      .addCase(updateParcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Parcel Status
      .addCase(updateParcelStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateParcelStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update the parcel in the parcels array
        const parcelsList = Array.isArray(state.parcels) ? state.parcels : state.parcels.parcels || [];
        const updatedParcels = parcelsList.map((parcel) =>
          parcel._id === action.payload._id ? action.payload : parcel
        );
        
        if (Array.isArray(state.parcels)) {
          state.parcels = updatedParcels;
        } else {
          state.parcels.parcels = updatedParcels;
        }
        
        // If the updated parcel is the currently viewed single parcel
        if (state.parcel && state.parcel._id === action.payload._id) {
          state.parcel = action.payload;
        }

      })
      .addCase(updateParcelStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Parcel
      .addCase(deleteParcel.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear previous errors
      })
      .addCase(deleteParcel.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the deleted parcel from the parcels array
        const parcelsList = Array.isArray(state.parcels) ? state.parcels : state.parcels.parcels || [];
        const filteredParcels = parcelsList.filter(
          (parcel) => parcel._id !== action.payload.id // Assuming the deleted ID is returned
        );
        
        if (Array.isArray(state.parcels)) {
          state.parcels = filteredParcels;
        } else {
          state.parcels.parcels = filteredParcels;
        }
        
        // If the deleted parcel was the currently viewed single parcel
        if (state.parcel && state.parcel._id === action.payload.id) {
          state.parcel = null;
        }
      }) // Explicitly handle rejected case
      .addCase(deleteParcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetParcelState, parcelStatusUpdated } = parcelSlice.actions;

export default parcelSlice.reducer;