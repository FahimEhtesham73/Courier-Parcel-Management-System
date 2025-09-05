# Courier & Parcel Management System

A comprehensive MERN stack application for managing courier services, parcel tracking, and delivery operations.

## 🚀 Features

### Customer Features
- **User Registration & Authentication** - Secure signup/login with role-based access
- **Parcel Booking** - Book parcels with pickup/delivery addresses, size, type, and payment method
- **Real-time Tracking** - Track parcels with live status updates and map integration
- **Booking History** - View all past and current bookings with detailed status
- **QR Code Generation** - Generate QR codes for easy parcel identification
- **Multi-language Support** - English and Bengali language support

### Delivery Agent Features
- **Agent Dashboard** - View assigned parcels and delivery tasks
- **Status Updates** - Update parcel status (Picked Up, In Transit, Delivered, Failed)
- **QR Code Scanning** - Scan parcel QR codes for quick status updates
- **Location Tracking** - Real-time location sharing for route optimization
- **Optimized Routes** - Get optimized delivery routes with Google Maps integration
- **Agent Verification** - Submit documents for verification to start deliveries

### Admin Features
- **Comprehensive Dashboard** - View system metrics, analytics, and KPIs
- **User Management** - Manage customers, agents, and their permissions
- **Parcel Management** - Oversee all parcels, assign agents, and track performance
- **Agent Verification** - Review and approve delivery agent applications
- **Analytics & Reports** - Generate detailed reports in CSV/PDF format
- **Bulk Operations** - Perform bulk actions on multiple parcels
- **Real-time Monitoring** - Monitor system performance and delivery metrics

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication and authorization
- **Bcrypt** - Password hashing
- **Nodemailer** - Email notifications
- **Twilio** - SMS notifications
- **PDFMake** - PDF generation for reports and labels
- **QRCode** - QR code generation

### Frontend
- **React** - UI library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Google Maps API** - Map integration and geolocation
- **React-QR-Code** - QR code display
- **ZXing** - Barcode/QR code scanning
- **React-i18next** - Internationalization
- **Socket.IO Client** - Real-time updates

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Google Maps API Key
- Twilio Account (for SMS)
- SMTP Email Service

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd courier-parcel-management
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017/courier_management
   JWT_SECRET=your_super_secret_jwt_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update with your Google Maps API key:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Parcel Endpoints
- `GET /api/parcels` - Get parcels (filtered by user role)
- `POST /api/parcels` - Create new parcel
- `GET /api/parcels/:id` - Get parcel by ID
- `PUT /api/parcels/:id` - Update parcel
- `DELETE /api/parcels/:id` - Delete parcel
- `PUT /api/parcels/:id/status` - Update parcel status
- `GET /api/parcels/:id/qrcode` - Generate QR code
- `GET /api/parcels/:id/label` - Generate shipping label
- `GET /api/parcels/track/:trackingNumber` - Track parcel (public)
- `GET /api/parcels/route/:agentId` - Get optimized route

### Admin Endpoints
- `GET /api/admin/dashboard/metrics` - Dashboard metrics
- `GET /api/admin/reports/parcels` - Generate reports
- `GET /api/admin/analytics` - Analytics data
- `GET /api/admin/assignment/metrics` - Agent assignment metrics
- `PUT /api/admin/users/:id/activate` - Activate user
- `PUT /api/admin/users/:id/deactivate` - Deactivate user

### Agent Verification Endpoints
- `POST /api/agent-verification/submit` - Submit verification
- `GET /api/agent-verification/status` - Get verification status
- `GET /api/agent-verification/all` - Get all verifications (Admin)
- `PUT /api/agent-verification/review/:id` - Review verification (Admin)

## 🎯 Key Features Implemented

### ✅ Core Functionality
- [x] User authentication with role-based access control
- [x] Parcel booking and management
- [x] Real-time status tracking
- [x] Agent assignment and verification
- [x] Admin dashboard with comprehensive metrics
- [x] Google Maps integration for location services

### ✅ Advanced Features
- [x] QR code generation and scanning
- [x] Email and SMS notifications
- [x] Multi-language support (English/Bengali)
- [x] PDF report generation
- [x] Shipping label generation
- [x] Real-time updates via Socket.IO
- [x] Responsive design for all devices
- [x] Bulk operations for admin efficiency

### ✅ Security & Performance
- [x] JWT-based authentication
- [x] Password hashing with bcrypt
- [x] Input validation and sanitization
- [x] Error handling and logging
- [x] CORS configuration
- [x] Rate limiting considerations

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

### E2E Testing
```bash
cd client
npx cypress open
```

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🌐 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or your preferred database
2. Configure environment variables for production
3. Deploy to Heroku, Railway, or your preferred platform

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Update API URLs for production environment

## 🔐 Security Considerations

- JWT tokens with expiration
- Password hashing with salt
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Role-based access control
- File upload size limits

## 📊 Performance Optimizations

- Database indexing for frequently queried fields
- Pagination for large datasets
- Image compression for document uploads
- Lazy loading for components
- Memoization for expensive calculations
- Socket.IO for real-time updates instead of polling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

