import io from 'socket.io-client';

const ENDPOINT = 'http://localhost:5000'; // Replace with your backend URL

const socket = io(ENDPOINT);

// Join appropriate room based on user role
export const joinUserRoom = (userId, role) => {
  socket.emit('join-room', { userId, role });
};

// Accept a parcel (for delivery agents)
export const acceptParcel = (parcelId, agentId) => {
  socket.emit('accept-parcel', { parcelId, agentId });
};

// Send location update (for delivery agents)
export const sendLocationUpdate = (agentId, latitude, longitude) => {
  socket.emit('location-update', { agentId, latitude, longitude });
};

// Listen for real-time updates
export const listenForUpdates = (callbacks) => {
  Object.keys(callbacks).forEach(event => {
    socket.on(event, callbacks[event]);
  });
};

// Remove listeners
export const removeListeners = (events) => {
  events.forEach(event => {
    socket.off(event);
  });
};

export default socket;