# Product Requirements Document (PRD) - Choprice

## 1. Overview

**Product Name:** Choprice  
**Product Type:** Food Delivery Service (Website + Progressive Web Apps)  
**Mission:** Deliver affordable, diverse rice-based meals (e.g., Pilau, Biryani, Coconut Rice) to corporate workers in Nairobi's upscale areas (Kilimani, Kileleshwa, Lavington, Hurlingham, Upperhill, Westlands, Parklands), offering a premium alternative to fast food and kibanda options with free delivery.  
**Target Launch Date:** Q4 2025 (Target: November 2025)  
**Target Audience:** Middle and upper-class professionals (25-45 years, corporate employees) in target Nairobi areas.  
**Business Goals:** Achieve 25 plates/day minimum, generating 4,750 KSh/day profit, with scalability to 50+ plates/day within 6 months.

## 2. Objectives

**Primary Objective:** Provide a seamless ordering and delivery experience for rice dishes at 390 KSh/plate with free delivery via PWAs.

**Secondary Objectives:**
- Establish Choprice as a unique, affordable lunch brand.
- Integrate M-Pesa for local payments and Google Maps for delivery optimization.
- Support kitchen operations (Kawangware, Kangemi) with real-time order management.
- Enable future growth (e.g., corporate subscriptions, new kitchens).

## 3. Features

### 3.1 Core Features

**User Authentication:**
- Sign-up/login with phone number or email using Clerk (SMS/email verification).
- Guest checkout option.

**Menu Display:**
- List of 11 rice dishes (Pilau, Biryani Rice, Coconut Rice, Cashewnut Rice, Rice Peas, Chinese Rice, Egg Fry Rice, Risotto, Rice and Chicken, Rice and Fish, Rice and Beef) at 390 KSh each.
- Filter by category (e.g., Local Favorites, International Delights).
- Add-ons (e.g., kachumbari, drinks) at 100-150 KSh.

**Order Placement:**
- Cart system with quantity selection.
- Delivery address input with Google Maps integration (autocomplete for target areas).
- M-Pesa payment via STK Push (390 KSh/order minimum for free delivery).

**Order Tracking:**
- Real-time status updates (e.g., Preparing, Out for Delivery, Delivered) via WebSocket or Firebase.
- Estimated delivery time (30-45 minutes).

**Customer Support:**
- Contact via WhatsApp or email (support@choprice.co.ke).
- FAQ section on PWA.

### 3.2 Admin Features

**Order Management:**
- Dashboard for kitchen staff to view, accept, and mark orders as prepared.
- Filter by status (Pending, Preparing, Delivered).

**Menu Management:**
- Add/edit/delete menu items (name, price, description) with image uploads to Neon storage.
- Upload dish images.

**Reports:**
- Daily sales (e.g., 25 plates = 9,750 KSh revenue).
- Delivery performance (e.g., average time).

### 3.3 Rider Features

**Delivery PWA:**
- Accept/decline orders from kitchen dashboard.
- Real-time navigation with Google Maps.
- Update delivery status (e.g., Picked Up, Delivered).

## 4. Technical Requirements

**Platform:**
- Website & PWAs: Responsive design using React.js with PWA capabilities (Service Workers, Manifest.json).
- No native apps; PWAs hosted on Render, accessible via browser and installable on homescreens.

**Backend:**
- Node.js with Express.js for APIs.
- Neon (Serverless PostgreSQL) for database and file storage (e.g., menu images).

**Integrations:**
- M-Pesa (Safaricom Daraja API) for payments.
- Google Maps API for address lookup and route optimization.
- Clerk for authentication (replacing Firebase Auth).
- WebSocket or Firebase for real-time updates (optional).

**Hosting/Deployment:**
- Render for website, backend, and PWAs (free tier initially, scalable to paid plans).

**Security:**
- HTTPS for all connections (managed by Render).
- Clerk JWTs for authentication.
- Input validation to prevent injection attacks.

**Performance:**
- Load time < 3 seconds for PWA/website.
- Handle 50 concurrent orders at launch, scalable to 200.

## 5. User Stories

- **As a Customer**, I want to browse the Choprice menu and order a Pilau for 390 KSh with free delivery on my phone's PWA, so I can enjoy a quick lunch at my office in Kilimani.
- **As a Kitchen Staff**, I want to see new orders in real-time on the admin PWA and mark them as prepared, so I can manage cooking for 25 plates/day efficiently.
- **As a Rider**, I want a PWA with a map to navigate from Kawangware to Westlands, so I can deliver orders within 45 minutes.
- **As an Admin**, I want to add a new dish like Cashewnut Rice via the admin PWA, so I can update the menu based on customer feedback.

## 6. Non-Functional Requirements

- **Availability:** 99.9% uptime during lunch hours (12 PM - 3 PM EAT).
- **Scalability:** Support growth to 100 plates/day within 12 months.
- **Compliance:** Adhere to Kenya's Data Protection Act 2019 and food safety regulations.
- **Accessibility:** WCAG 2.1 compliant for screen readers and keyboard navigation.
- **PWA Standards:** Offline capability, push notifications, installable on homescreen.

## 7. Constraints

- **Budget:** Initial tech cost ~KSh 50,000-100,000 (domain, Render paid plan if needed, APIs), plus development (KSh 200,000-500,000 if outsourcing).
- **Timeline:** MVP in 8-12 weeks, full launch by November 2025.
- **Team:** 1-2 developers (or freelance via Upwork), 1 designer (optional).
- **Infrastructure:** Relies on reliable internet in Kawangware/Kangemi kitchens.

## 8. Success Metrics

- **Adoption:** 100 registered users within 1 month of launch.
- **Sales:** 25 plates/day average within 2 months, scaling to 50 plates/day by Q1 2026.
- **Customer Satisfaction:** 80% positive feedback on delivery time and food quality.
- **Profit:** Achieve 4,750 KSh/day minimum profit, targeting 9,500 KSh/day at 50 plates.

## 9. Risks & Mitigation

**Risk: Low initial orders.**
- Mitigation: Launch with WhatsApp orders, offer 350 KSh/plate promo for first week.

**Risk: Delivery delays.**
- Mitigation: Use electric bikes, optimize routes with Google Maps.

**Risk: Payment issues with M-Pesa.**
- Mitigation: Test Daraja API in sandbox, provide support contact.

**Risk: Competition from Uber Eats/Glovo.**
- Mitigation: Emphasize unique rice menu and free delivery in marketing.

## 10. Next Steps

**Phase 1 (Weeks 1-4):**
- Setup backend (Node.js, Express) on Render.
- Configure Neon database (schema for users, orders, menu).
- Integrate Clerk for authentication.

**Phase 2 (Weeks 5-8):**
- Develop website/PWA (React.js with Service Workers).
- Build admin and rider PWAs, integrate Google Maps.
- Test APIs and payment flow.

**Phase 3 (Weeks 9-12):**
- Implement real-time updates (WebSocket or Firebase).
- Conduct user testing on PWAs.
- Deploy to Render.

**Phase 4 (Weeks 13-16):**
- Launch marketing campaign, soft launch in Kilimani.
- Monitor analytics, iterate based on feedback.

## 11. Appendices

**Menu List:** Pilau, Biryani Rice, Coconut Rice, Cashewnut Rice, Rice Peas, Chinese Rice, Egg Fry Rice, Risotto, Rice and Chicken, Rice and Fish, Rice and Beef.

**Wireframes:** [To be designed – suggest Figma for mockups].

**API Endpoints:**
- `GET /menu`: Retrieve menu items.
- `POST /order`: Submit order with payment.
- `POST /pay`: Trigger M-Pesa STK Push.

**Tech Notes:**
- **Render:** Use free tier for MVP, upgrade to paid ($7/month) for higher traffic.
- **Neon:** Serverless PostgreSQL, free tier (0.5 GB) sufficient for MVP.
- **Clerk:** Free tier supports 10,000 MAUs, ideal for initial launch.
- **PWA:** Add manifest.json and Service Worker for offline support.

## Technical Implementation Notes

### Backend Setup (Node.js + Express):

Install: `npm init -y && npm install express neon-postgres clerk-sdk-node cors`

Sample code (server.js):
```javascript
const express = require('express');
const { Neon } = require('neon-postgres');
const { Clerk } = require('@clerk/clerk-sdk-node');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const db = new Neon({ connectionString: 'YOUR_NEON_URL' });
const clerk = new Clerk({ secretKey: 'YOUR_CLERK_KEY' });

// Menu Table (example schema)
db.query('CREATE TABLE IF NOT EXISTS menu (id SERIAL PRIMARY KEY, name TEXT, price INT)');
app.get('/menu', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM menu');
  res.json(rows);
});

// M-Pesa Integration (basic STK Push)
app.post('/pay', async (req, res) => {
  const { phone, amount } = req.body;
  // Placeholder for Daraja API call (implement with mpesa-node)
  res.send({ status: 'Payment initiated', phone, amount });
});

app.listen(process.env.PORT || 3000, () => console.log('Server on Render'));
```

Deploy to Render with render.yaml for auto-scaling.

### Frontend/PWA (React.js):

Setup: `npx create-react-app choprice --template pwa`
Install: `npm install axios @clerk/react`

Sample Menu component (Menu.js):
```javascript
import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

function Menu() {
  const { userId } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get('/menu').then(res => setItems(res.data));
  }, []);

  return (
    <div>
      <h1>Choprice Menu</h1>
      <ul>
        {items.map(item => <li key={item.id}>{item.name} - 390 KSh</li>)}
      </ul>
      <button onClick={() => axios.post('/pay', { phone: userId, amount: 390 })}>Pay with M-Pesa</button>
    </div>
  );
}

export default Menu;
```

Add manifest.json for PWA installability.

**Rider/Admin PWAs:** Reuse React code, customize with dashboards.