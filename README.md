# Multi-Tenant Restaurant SaaS Web Application

A full-stack, single-codebase, multi-tenant Restaurant SaaS platform built with **Node.js, Express, MongoDB Mongoose, Socket.io, Next.js 14 (App Router), and Tailwind CSS**.

---

## 🌟 Key Features

* **Multi-Tenant Architecture:** Single database with strict tenant isolation (`restaurantId`) across restaurants, categories, menu items, orders, and fleet riders.
* **4-Tier Role-Based Access Control (RBAC):**
  * `SUPERADMIN`: Tenant onboarding, subscription tier management, live visual theme customizer, 12-switch feature & UI toggle engine.
  * `RESTAURANT`: Live kitchen order board with Socket.io audio alerts, full menu CRUD (size variants, add-ons, stock toggle, image upload), delivery rider fleet management.
  * `RIDER`: Mobile-friendly delivery portal, real-time dispatch queue, one-click claim (`OUT_FOR_DELIVERY`), Google Maps navigation, COD payment settlement.
  * `CUSTOMER`: Public customer registration, authenticated storefront order tracking, auto-filled checkout details.
* **Dynamic Storefront Engine (`/restaurant/[slug]`):**
  * Custom branding per tenant (Primary color, Accent color, Canvas background, Card background, Base font size, 10 Google fonts, and interactive edge roundness / border-radius).
  * 12 configurable UI toggles (card hover enlarge, mini-cart hover preview, sticky category navigation, promotional hero banner, live search & dietary filter, star ratings, delivery ETA badge, COD/Mock card payment).
  * Real-time order tracker (`/restaurant/[slug]/order/[orderId]`) with a 6-stage live stepper powered by Socket.io.

---

## 🛠 Tech Stack

### Backend (`/backend`)
* **Runtime:** Node.js, Express.js
* **Database:** MongoDB (via Mongoose)
* **Real-time:** Socket.io (with room-based scoping: `superadmin`, `restaurant_<id>`, `order_<id>`)
* **Security & Auth:** JWT (`jsonwebtoken`), `bcryptjs`, RBAC middleware
* **Uploads:** Multer (local disk storage with validation)

### Frontend (`/frontend`)
* **Framework:** Next.js 14 (App Router)
* **Styling:** Tailwind CSS, Lucide Icons
* **Networking:** Axios, Socket.io-client
* **Typography:** Google Fonts integration (Inter, Roboto, Poppins, Montserrat, Lato, Playfair Display, Merriweather, Cinzel, Oswald, Pacifico)

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18 or higher recommended)
* MongoDB database instance (MongoDB Atlas or local MongoDB)

### 2. Backend Setup
```bash
cd Backend
cp .env.example .env
# Edit .env and configure your MONGODB_URI and JWT_SECRET
npm install
npm run seed  # Seeds default Super Admin (superadmin@platform.com / admin123)
npm run dev   # Starts backend server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd Frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev   # Starts Next.js app on http://localhost:3000
```

---

## 🔑 Default Credentials

* **Super Admin:**
  * Email: `superadmin@platform.com`
  * Password: `admin123`
  * Portal: `http://localhost:3000/login` &rarr; Redirects to `/admin/super`

* **Restaurant Admin & Riders:**
  * Created dynamically via the Super Admin portal (`/admin/super/onboarding`) or Restaurant Rider management (`/admin/restaurant/riders`).

* **Customer:**
  * Register directly via the storefront header or login screen (`/login`).
