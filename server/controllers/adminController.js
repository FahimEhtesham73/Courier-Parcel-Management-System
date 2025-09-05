const Parcel = require('../models/Parcel');
const { createObjectCsvWriter } = require('csv-writer');
const PdfPrinter = require('pdfmake');
const fs = require('fs');
const { getAssignmentStats } = require('../utils/agentAssignment');
const User = require('../models/User');

const getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyBookings = await Parcel.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const failedDeliveries = await Parcel.countDocuments({
      status: 'Failed'
    });

    // Get COD amounts for delivered parcels
    const codDeliveredAggregate = await Parcel.aggregate([
      {
        $match: { paymentMethod: 'COD', status: 'Delivered' }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$codAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const codDeliveries = codDeliveredAggregate.length > 0 ? codDeliveredAggregate[0].count : 0;
    const totalCodAmount = codDeliveredAggregate.length > 0 ? codDeliveredAggregate[0].totalAmount : 0;
    
    // Get pending COD amounts
    const codPendingAggregate = await Parcel.aggregate([
      {
        $match: { paymentMethod: 'COD', status: { $ne: 'Delivered' } }
      },
      {
        $group: {
          _id: null,
          pendingAmount: { $sum: '$codAmount' }
        }
      }
    ]);
    
    const pendingCodAmount = codPendingAggregate.length > 0 ? codPendingAggregate[0].pendingAmount : 0;
    
    // Get total parcels count
    const totalParcels = await Parcel.countDocuments();
    
    // Get delivered parcels count
    const deliveredParcels = await Parcel.countDocuments({ status: 'Delivered' });
    
    // Get parcels in transit
    const inTransitParcels = await Parcel.countDocuments({ status: 'In Transit' });
    
    // Get pending parcels
    const pendingParcels = await Parcel.countDocuments({ status: 'Pending' });
    
    // Get monthly statistics
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyBookings = await Parcel.countDocuments({
      createdAt: { $gte: monthStart }
    });
    
    // Get revenue statistics
    const revenueAggregate = await Parcel.aggregate([
      {
        $match: { 
          status: 'Delivered',
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          monthlyRevenue: { $sum: '$codAmount' }
        }
      }
    ]);
    
    const monthlyRevenue = revenueAggregate.length > 0 ? revenueAggregate[0].monthlyRevenue : 0;

    res.status(200).json({
      dailyBookings,
      failedDeliveries,
      codDeliveries,
      totalCodAmount,
      pendingCodAmount,
      totalParcels,
      deliveredParcels,
      inTransitParcels,
      pendingParcels,
      monthlyBookings,
      monthlyRevenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const generateParcelReport = async (req, res) => {
  try {
    const filters = req.query;
    const query = {};

    if (filters.status) query.status = filters.status;
    if (filters.assignedAgent) query.assignedAgent = filters.assignedAgent;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const parcels = await Parcel.find(query)
      .populate('customer', 'username email')
      .populate('assignedAgent', 'username email');

    const format = filters.format || 'csv';

    if (format === 'csv') {
      const csvWriter = createObjectCsvWriter({
        path: 'parcel_report.csv',
        header: [
          { id: 'trackingNumber', title: 'Tracking Number' },
          { id: 'customer', title: 'Customer' },
          { id: 'pickupAddress', title: 'Pickup Address' },
          { id: 'deliveryAddress', title: 'Delivery Address' },
          { id: 'size', title: 'Size' },
          { id: 'type', title: 'Type' },
          { id: 'paymentMethod', title: 'Payment Method' },
          { id: 'codAmount', title: 'COD Amount' },
          { id: 'status', title: 'Status' },
          { id: 'assignedAgent', title: 'Assigned Agent' },
          { id: 'estimatedDelivery', title: 'Estimated Delivery' },
          { id: 'actualDelivery', title: 'Actual Delivery' },
          { id: 'createdAt', title: 'Booked At' },
          { id: 'updatedAt', title: 'Last Updated' },
        ],
      });

      const records = parcels.map(parcel => ({
        trackingNumber: parcel.trackingNumber,
        customer: parcel.customer ? `${parcel.customer.username} (${parcel.customer.email})` : 'N/A',
        pickupAddress: parcel.pickupAddress,
        deliveryAddress: parcel.deliveryAddress,
        size: parcel.size,
        type: parcel.type,
        paymentMethod: parcel.paymentMethod,
        codAmount: parcel.codAmount || 0,
        status: parcel.status,
        assignedAgent: parcel.assignedAgent ? `${parcel.assignedAgent.username} (${parcel.assignedAgent.email})` : 'N/A',
        estimatedDelivery: parcel.estimatedDelivery ? parcel.estimatedDelivery.toISOString() : 'N/A',
        actualDelivery: parcel.actualDelivery ? parcel.actualDelivery.toISOString() : 'N/A',
        createdAt: parcel.createdAt,
        updatedAt: parcel.updatedAt,
      }));

      await csvWriter.writeRecords(records);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="parcel_report.csv"');
      return res.download('parcel_report.csv', err => {
        if (err) {
          console.error('Error sending file:', err);
          return res.status(500).send('Error generating report');
        }
        // Optional: fs.unlinkSync('parcel_report.csv');
      });
    } else if (format === 'pdf') {
      // Use system fonts for PDF generation
      const systemFonts = {
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };
      const printer = new PdfPrinter(systemFonts);

      const docDefinition = {
        content: [
          { text: 'Parcel Report', style: 'header' },
          { text: `Generated on: ${new Date().toLocaleDateString()}`, style: 'subheader' },
          { text: ' ' }, // Empty line
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: [
                ['Tracking', 'Customer', 'Pickup', 'Delivery', 'Size', 'Payment', 'COD', 'Status'],
                ...parcels.map(parcel => [
                  parcel.trackingNumber,
                  parcel.customer ? parcel.customer.username : 'N/A',
                  parcel.pickupAddress.substring(0, 30) + (parcel.pickupAddress.length > 30 ? '...' : ''),
                  parcel.deliveryAddress.substring(0, 30) + (parcel.deliveryAddress.length > 30 ? '...' : ''),
                  parcel.size,
                  parcel.paymentMethod,
                  parcel.codAmount || 0,
                  parcel.status,
                ]),
              ],
            },
            layout: 'lightHorizontalLines'
          },
        ],
        styles: { 
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 20] },
          subheader: { fontSize: 12, margin: [0, 0, 0, 10] },
          tableHeader: { bold: true, fontSize: 10, color: 'black' }
        },
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [40, 60, 40, 60],
        defaultStyle: {
          font: 'Helvetica',
          fontSize: 9
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="parcel_report.pdf"');
      pdfDoc.pipe(res);
      pdfDoc.end();
    } else {
      return res.status(400).json({ message: 'Invalid report format requested' });
    }
  } catch (error) {
    console.error('Error in generateParcelReport:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Daily bookings trend
    const dailyBookings = await Parcel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Status distribution
    const statusDistribution = await Parcel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Payment method distribution
    const paymentDistribution = await Parcel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$codAmount' }
        }
      }
    ]);
    
    res.status(200).json({
      period,
      dailyBookings,
      statusDistribution,
      paymentDistribution
    });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAssignmentMetrics = async (req, res) => {
  try {
    const stats = await getAssignmentStats();
    if (!stats) {
      return res.status(500).json({ message: 'Error fetching assignment metrics' });
    }
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error in getAssignmentMetrics:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User activated successfully', user });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User verified successfully', user });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const unverifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User verification removed successfully', user });
  } catch (error) {
    console.error('Error removing user verification:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getDashboardMetrics,
  generateParcelReport,
  getAnalytics,
  getAssignmentMetrics,
  activateUser,
  deactivateUser,
  verifyUser,
  unverifyUser,
};