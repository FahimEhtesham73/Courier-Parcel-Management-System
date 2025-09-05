const express = require('express');
const router = express.Router();

const { protect, isAdmin } = require('../middleware/authMiddleware'); // <-- add this

const {
    getAllParcels,
    getParcelById,
    createParcel,
    updateParcel,
    deleteParcel,
    updateParcelStatus,
    generateParcelQRCode,
    trackParcel,
    getOptimizedRoute,
    generateParcelLabel: generatePDF, // Use the alias from the controller
    acceptParcelAssignment,
    getAvailableParcels
} = require('../controllers/parcelController');

// Allow all authenticated users to access parcels (filtering is done in controller)
router.route('/').get(protect, getAllParcels).post(protect, createParcel);
router.route('/available').get(protect, getAvailableParcels);
router.route('/track/:trackingNumber').get(trackParcel); // Public route for tracking
router.route('/route/:agentId').get(protect, getOptimizedRoute);
router.route('/:id/accept').put(protect, acceptParcelAssignment); // Agent accepts parcel
router.route('/:id').get(protect, getParcelById).put(protect, updateParcel).delete(protect, deleteParcel);
router.route('/:id/status').put(protect, updateParcelStatus);
router.route('/:id/qrcode').get(protect, generateParcelQRCode);
router.route('/:id/label').get(protect, generatePDF); // Use generatePDF

module.exports = router;
