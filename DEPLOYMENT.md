# Choprice Deployment Guide

This guide will help you deploy the Choprice food delivery service to production.

## 🚀 Quick Deployment (Render)

### Prerequisites

1. **Neon Database Account** - [Sign up at neon.tech](https://neon.tech)
2. **Clerk Account** - [Sign up at clerk.com](https://clerk.com)
3. **M-Pesa Developer Account** - [Sign up at developer.safaricom.co.ke](https://developer.safaricom.co.ke)
4. **Google Cloud Account** - For Maps API
5. **Render Account** - [Sign up at render.com](https://render.com)

### Step 1: Database Setup (Neon)

1. Create a new Neon project
2. Create a database named `choprice`
3. Run the schema from `database/schema.sql`
4. Copy the connection string

### Step 2: Authentication Setup (Clerk)

1. Create a new Clerk application
2. Configure sign-in methods (Phone, Email)
3. Copy the publishable key and secret key
4. Set up webhooks if needed

### Step 3: M-Pesa Setup

1. Create M-Pesa app on Safaricom Developer Portal
2. Get Consumer Key and Consumer Secret
3. Set up STK Push configuration
4. Note your Business Short Code and Passkey

### Step 4: Google Maps API

1. Enable Maps JavaScript API and Places API
2. Create API key with appropriate restrictions
3. Configure for your domain

### Step 5: Deploy to Render

1. **Connect Repository:**
   - Link your GitHub repo to Render
   - Use the provided `render.yaml` configuration

2. **Set Environment Variables:**

   **Backend Service:**
   ```
   DATABASE_URL=postgresql://user:pass@host/choprice
   CLERK_SECRET_KEY=sk_live_...
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_SHORTCODE=your_shortcode
   MPESA_PASSKEY=your_passkey
   MPESA_CALLBACK_URL=https://your-backend.onrender.com/api/mpesa/callback
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   JWT_SECRET=your_random_jwt_secret
   NODE_ENV=production
   ```

   **Customer PWA:**
   ```
   REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_...
   REACT_APP_API_BASE_URL=https://your-backend.onrender.com
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

3. **Deploy:**
   - Backend will be available at `https://choprice-backend.onrender.com`
   - Customer PWA at `https://choprice.onrender.com`
   - Admin PWA at `https://choprice-admin.onrender.com`

## 🔧 Manual Deployment

### Backend Deployment

1. **Prepare Environment:**
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

2. **Install Dependencies:**
   ```bash
   npm install --production
   ```

3. **Start Server:**
   ```bash
   npm start
   ```

### Frontend Deployment

1. **Customer PWA:**
   ```bash
   cd customer-pwa
   cp .env.example .env.local
   # Fill in your environment variables
   npm install
   npm run build
   # Deploy the 'build' folder to your static hosting
   ```

2. **Admin PWA:**
   ```bash
   cd admin-pwa
   cp .env.example .env.local
   # Fill in your environment variables
   npm install
   npm run build
   # Deploy the 'build' folder to your static hosting
   ```

## 🔒 Security Checklist

- [ ] HTTPS enabled on all services
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys restricted by domain/IP
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error messages don't expose sensitive data

## 🚨 Production Considerations

### Performance
- Enable gzip compression
- Set up CDN for static assets
- Configure database connection pooling
- Implement caching where appropriate

### Monitoring
- Set up uptime monitoring
- Configure error tracking (Sentry, etc.)
- Monitor database performance
- Track API response times

### Backup
- Set up automated database backups
- Store backups in multiple locations
- Test backup restoration process

### Scaling
- Monitor resource usage
- Set up auto-scaling if available
- Consider database read replicas
- Implement proper logging

## 📱 PWA Optimization

### Service Worker
- Cache static assets
- Implement offline functionality
- Handle background sync for orders

### Performance
- Optimize images and assets
- Minimize bundle size
- Implement code splitting
- Use lazy loading

### User Experience
- Test on various devices
- Ensure offline functionality
- Implement push notifications
- Test installation flow

## 🧪 Testing in Production

### Health Checks
```bash
# Backend health
curl https://your-backend.onrender.com/health

# Test menu endpoint
curl https://your-backend.onrender.com/api/menu
```

### M-Pesa Testing
1. Use sandbox environment first
2. Test STK Push flow
3. Verify callback handling
4. Test payment status updates

### PWA Testing
1. Test installation on mobile devices
2. Verify offline functionality
3. Test push notifications
4. Check responsive design

## 🔄 Continuous Deployment

### GitHub Actions Example
```yaml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        # Render auto-deploys on push to main
        run: echo "Deployment triggered"
```

## 📊 Monitoring & Analytics

### Key Metrics to Track
- Order completion rate
- Payment success rate
- Average delivery time
- Customer satisfaction
- Revenue per day
- Active users

### Recommended Tools
- **Uptime:** UptimeRobot, Pingdom
- **Errors:** Sentry, LogRocket
- **Analytics:** Google Analytics, Mixpanel
- **Performance:** New Relic, DataDog

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors:**
- Check connection string format
- Verify network access
- Check SSL requirements

**M-Pesa Integration Issues:**
- Verify callback URL is accessible
- Check phone number format
- Confirm API credentials

**PWA Installation Issues:**
- Verify HTTPS is enabled
- Check manifest.json validity
- Ensure service worker is registered

### Support Contacts
- **Technical Issues:** Create GitHub issue
- **M-Pesa Support:** developer.safaricom.co.ke
- **Clerk Support:** support@clerk.com
- **Render Support:** help@render.com

## 📋 Post-Deployment Checklist

- [ ] All services are running
- [ ] Database is accessible
- [ ] Authentication is working
- [ ] M-Pesa integration tested
- [ ] PWA can be installed
- [ ] Admin panel accessible
- [ ] SSL certificates valid
- [ ] Domain names configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active

## 🎯 Go-Live Preparation

1. **Soft Launch:**
   - Deploy to staging environment
   - Test with limited users
   - Monitor for issues

2. **Marketing Preparation:**
   - Set up social media accounts
   - Prepare launch materials
   - Configure analytics

3. **Operations Setup:**
   - Train kitchen staff on admin PWA
   - Set up delivery logistics
   - Prepare customer support

4. **Launch:**
   - Switch DNS to production
   - Monitor closely for first 24 hours
   - Be ready to rollback if needed

---

🍚 **Ready to serve premium rice dishes to Nairobi!** 🚀