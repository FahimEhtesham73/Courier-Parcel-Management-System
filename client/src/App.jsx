import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import Login from './features/auth/Login.jsx';
import Navbar from './components/Navbar.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import ParcelList from './features/parcels/ParcelList.jsx';
import ParcelDetails from './features/parcels/ParcelDetails.jsx';
import CreateParcel from './features/parcels/CreateParcel.jsx';
import EditParcel from './features/parcels/EditParcel.jsx';
import Register from './features/auth/Register.jsx';
import AdminDashboard from './features/admin/AdminDashboard.jsx';
import AgentParcelList from './features/parcels/AgentParcelList.jsx';
import ScanParcel from './features/parcels/ScanParcel.jsx';
import TrackParcel from './features/parcels/TrackParcel.jsx';
import AgentVerification from './features/agent/AgentVerification.jsx';
import VerificationManagement from './features/admin/VerificationManagement.jsx';
import { parcelStatusUpdated } from './features/parcels/parcelSlice.js';
import DeliveryRoute from './features/parcels/DeliveryRoute.jsx';
import UserManagement from './features/admin/UserManagement.jsx';
import Analytics from './features/admin/Analytics.jsx';
import socket from './socket.js';
import NotificationSystem from './components/NotificationSystem.jsx';

// Import CSS files
import './styles/globals.css';
import './styles/responsive.css';
import './components/navbar.css';
import './styles/auth.css';
import './styles/parcels.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    socket.on('parcelStatusUpdated', (updatedParcel) => {
      dispatch(parcelStatusUpdated(updatedParcel));
    });
    return () => {
      socket.off('parcelStatusUpdated');
    };
  }, [dispatch]);

  return (
    <Router>
      <Navbar />
      <NotificationSystem />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} /> {/* Redirect root to /login */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/track" element={<TrackParcel />} />
        <Route path="/parcels" element={<PrivateRoute allowedRoles={['Customer', 'Admin', 'Delivery Agent']}><ParcelList /></PrivateRoute>} />
        <Route path="/parcels/:id" element={<PrivateRoute><ParcelDetails /></PrivateRoute>} />
        <Route path="/create-parcel" element={<PrivateRoute allowedRoles={['Customer', 'Admin']}><CreateParcel /></PrivateRoute>} />
        <Route path="/edit-parcel/:id" element={<PrivateRoute><EditParcel /></PrivateRoute>} />
        <Route
          path="/agent/scan"
          element={<PrivateRoute allowedRoles={['Delivery Agent']}><ScanParcel /></PrivateRoute>}
        />
        <Route
          path="/agent/parcels"
          element={<PrivateRoute allowedRoles={['Delivery Agent']}><AgentParcelList /></PrivateRoute>}
        />
        <Route
          path="/agent/verification"
          element={<PrivateRoute allowedRoles={['Delivery Agent']}><AgentVerification /></PrivateRoute>}
        />
        <Route
          path="/agent/route"
          element={<PrivateRoute allowedRoles={['Delivery Agent']}><DeliveryRoute /></PrivateRoute>}
        />
        <Route
          path="/admin/dashboard"
          element={<PrivateRoute allowedRoles={['Admin']}><AdminDashboard /></PrivateRoute>}
        />
        <Route
          path="/admin/verifications"
          element={<PrivateRoute allowedRoles={['Admin']}><VerificationManagement /></PrivateRoute>}
        />
        <Route
          path="/admin/analytics"
          element={<PrivateRoute allowedRoles={['Admin']}><Analytics /></PrivateRoute>}
        />
        <Route
          path="/admin/users"
          element={<PrivateRoute allowedRoles={['Admin']}><UserManagement /></PrivateRoute>}
        />
      </Routes>
    </Router>
  );
}

export default App;