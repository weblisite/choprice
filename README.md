# Choprice - Premium Rice Delivery Service

Choprice is a food delivery service specializing in premium rice dishes delivered fresh to corporate offices in Nairobi's upscale areas. Built as a Progressive Web App (PWA) with React and Node.js.

## 🍚 Features

- **11 Premium Rice Dishes** - From local Pilau to international Biryani
- **Free Delivery** - To Kilimani, Westlands, Upper Hill, and other premium areas
- **M-Pesa Integration** - Secure payments via STK Push
- **Progressive Web App** - Works like a native app, no download required
- **Real-time Order Tracking** - Live updates from preparation to delivery
- **Admin Dashboard** - Kitchen staff can manage orders efficiently
- **Rider App** - Delivery management with Google Maps integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon PostgreSQL database
- Clerk account for authentication
- M-Pesa Daraja API credentials
- Google Maps API key

### Backend Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd choprice
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Database Setup:**
   ```bash
   # Run the schema script in your Neon database
   psql $DATABASE_URL -f database/schema.sql
   ```

4. **Start the backend:**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

### Customer PWA Setup

1. **Navigate to customer PWA:**
   ```bash
   cd customer-pwa
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env.local
   # Add your Clerk publishable key and API URL
   ```

3. **Start the development server:**
   ```bash
   npm start
   # PWA runs on http://localhost:3001
   ```

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Database:** Neon PostgreSQL (serverless)
- **Authentication:** Clerk SDK
- **Payments:** M-Pesa Daraja API
- **Maps:** Google Maps API
- **Deployment:** Render

### Frontend (React PWA)
- **Framework:** React 18 with React Router
- **UI:** Bootstrap 5 + Custom CSS
- **State:** Context API + Local Storage
- **Authentication:** Clerk React
- **PWA:** Service Worker + Web App Manifest

### Key Components
- **Customer PWA:** Order placement and tracking
- **Admin PWA:** Kitchen order management
- **Rider PWA:** Delivery management
- **Backend API:** Handles orders, payments, and data

## 📱 PWA Features

- **Offline Capability:** Browse menu and view orders offline
- **Push Notifications:** Order status updates
- **Installable:** Add to home screen on mobile devices
- **Responsive Design:** Works on all screen sizes
- **Fast Loading:** Service worker caching

## 🔐 Security

- **HTTPS:** All connections encrypted
- **JWT Authentication:** Clerk-managed tokens
- **Input Validation:** SQL injection prevention
- **Rate Limiting:** API protection
- **CORS:** Configured for production

## 🚀 Deployment

### Render Deployment (Recommended)

1. **Connect Repository:**
   - Link your GitHub repository to Render
   - Use the provided `render.yaml` configuration

2. **Environment Variables:**
   ```
   DATABASE_URL=your_neon_connection_string
   CLERK_SECRET_KEY=your_clerk_secret_key
   MPESA_CONSUMER_KEY=your_mpesa_consumer_key
   MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
   REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

3. **Deploy:**
   - Backend deploys to `https://choprice-backend.onrender.com`
   - Customer PWA deploys to `https://choprice.onrender.com`

### Manual Deployment

1. **Build the PWA:**
   ```bash
   cd customer-pwa
   npm run build
   ```

2. **Deploy backend:**
   ```bash
   # Deploy to your preferred platform
   npm start
   ```

## 📊 Business Model

- **Price:** 390 KSh per plate
- **Target:** 25-50 plates/day
- **Areas:** Kilimani, Westlands, Upper Hill, Lavington, etc.
- **Revenue:** 4,750 - 9,500 KSh/day profit target

## 🛠️ Development

### Project Structure
```
choprice/
├── server.js              # Backend entry point
├── package.json           # Backend dependencies
├── database/
│   └── schema.sql         # Database schema
├── customer-pwa/          # Customer React PWA
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── ...
│   └── public/
│       ├── manifest.json  # PWA manifest
│       └── ...
├── admin-pwa/             # Admin dashboard (TODO)
├── rider-pwa/             # Rider app (TODO)
└── render.yaml            # Deployment config
```

### API Endpoints

**Public:**
- `GET /api/menu` - Get menu items
- `GET /health` - Health check

**Authenticated:**
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `POST /api/mpesa/stkpush` - Initiate payment
- `PATCH /api/orders/:id/status` - Update order status

### Adding New Features

1. **Backend:** Add routes in `server.js`
2. **Frontend:** Add components in respective PWA
3. **Database:** Update schema if needed
4. **Deploy:** Push to trigger auto-deployment

## 🧪 Testing

```bash
# Backend tests
npm test

# Frontend tests
cd customer-pwa
npm test

# E2E tests with browser MCP
browser mcp
```

## 📞 Support

- **Email:** support@choprice.co.ke
- **WhatsApp:** +254 700 000 000
- **Hours:** Mon-Fri, 11AM-4PM EAT

## 📄 License

Copyright © 2024 Choprice. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Built with ❤️ for Nairobi's corporate community