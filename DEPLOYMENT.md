# Deployment Guide

## Backend Deployment (Railway/Heroku)

### 1. Prepare for Deployment

1. **Environment Variables**
   Set these environment variables in your deployment platform:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/courier_management
   JWT_SECRET=your_production_jwt_secret
   NODE_ENV=production
   PORT=5000
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

2. **Update CORS Settings**
   Update `server/server.js` to include your frontend domain:
   ```javascript
   app.use(cors({
     origin: ['http://localhost:5173', 'https://your-frontend-domain.com'],
     credentials: true
   }));
   ```

### 2. Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   cd server
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set MONGO_URI=your_mongodb_uri
   railway variables set JWT_SECRET=your_jwt_secret
   # ... set all other variables
   ```

### 3. Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**
   ```bash
   cd server
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGO_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   # ... set all other variables
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## Frontend Deployment (Vercel/Netlify)

### 1. Prepare for Deployment

1. **Update API URL**
   Update `client/src/main.jsx`:
   ```javascript
   axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
     ? 'https://your-backend-domain.com' 
     : 'http://localhost:5000';
   ```

2. **Environment Variables**
   Create `client/.env.production`:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   REACT_APP_API_URL=https://your-backend-domain.com
   ```

### 2. Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd client
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add REACT_APP_GOOGLE_MAPS_API_KEY
   vercel env add REACT_APP_API_URL
   ```

### 3. Deploy to Netlify

1. **Build the Project**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Set Environment Variables**
   Go to Netlify dashboard → Site settings → Environment variables

## Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Create a database user
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get the connection string

### 2. Database Indexes

Connect to your MongoDB and create these indexes for better performance:

```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })

// Parcels collection
db.parcels.createIndex({ "trackingNumber": 1 }, { unique: true })
db.parcels.createIndex({ "customer": 1 })
db.parcels.createIndex({ "assignedAgent": 1 })
db.parcels.createIndex({ "status": 1 })
db.parcels.createIndex({ "createdAt": -1 })

// Agent Verifications collection
db.agentverifications.createIndex({ "agent": 1 }, { unique: true })
db.agentverifications.createIndex({ "status": 1 })
```

## SSL Certificate Setup

### For Production Deployment

1. **Let's Encrypt (Free)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **Update Nginx Configuration**
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Performance Optimization

### 1. Backend Optimizations

1. **Enable Compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Rate Limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use(limiter);
   ```

### 2. Frontend Optimizations

1. **Code Splitting**
   ```javascript
   const LazyComponent = React.lazy(() => import('./Component'));
   ```

2. **Image Optimization**
   - Use WebP format for images
   - Implement lazy loading
   - Compress images before upload

## Monitoring & Logging

### 1. Backend Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Error Tracking

Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Google Analytics** for user behavior

## Backup Strategy

### 1. Database Backup

```bash
# Daily backup script
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/courier_management" --out=/backup/$(date +%Y%m%d)
```

### 2. File Backup

- Set up automated backups for uploaded documents
- Use cloud storage (AWS S3, Google Cloud Storage)
- Implement versioning for critical files

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Database access restricted
- [ ] Input validation implemented
- [ ] File upload restrictions in place
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers added
- [ ] Regular security updates

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check frontend and backend URLs
   - Verify CORS configuration
   - Ensure credentials are included

2. **Database Connection Issues**
   - Verify MongoDB URI
   - Check network access
   - Confirm database user permissions

3. **File Upload Issues**
   - Check file size limits
   - Verify file type restrictions
   - Ensure proper error handling

4. **Socket.IO Connection Issues**
   - Check WebSocket support
   - Verify CORS for Socket.IO
   - Test connection in browser console

