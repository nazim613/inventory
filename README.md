# Padlock Inventory & Billing System

A complete full-stack solution for padlock wholesalers and distributors, tailored for Aligarh industry requirements.

## Features
- **Dashboard:** Overview of total products, manufacturers, customers, stocks, low stock alerts, and recent invoices.
- **Manufacturers Module:** Address and sub-brand management.
- **Customers Module:** Custom pricing logic and signature/stamp integrations.
- **Products Module:** Product IDs, variant sizes, multiple manufacturers.
- **Stock Management:** Add or adjust quantities (dozens/pcs), track low stock.
- **Billing System:** Generate beautiful invoices, auto-calculate subtotals, built-in print layout.
- **Admin Settings:** Configure company name, dashboard logo, and invoice branding.

## Tech Stack
- Frontend: React JS, TailwindCSS, DaisyUI, Zustand, Lucide-React
- Backend: Node.js, Express.js, JWT Authentication
- Database: MongoDB (Mongoose)

## How to Run

### 1. Database
Ensure that **MongoDB** is installed and running on your system on `localhost:27017`.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd padlock-system/backend
   ```
2. Seed the database with the initial Admin user:
   ```bash
   npm run seed
   ```
   *Expected Output: "Seed Data Imported Successfully."*
3. Start the backend Node server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd padlock-system/frontend
   ```
2. Start the Vite React app:
   ```bash
   npm run dev
   ```

### 4. Admin Login Details
Open the frontend URL (usually `http://localhost:5173`) in your browser and login:
- **Email:** `admin@gmail.com`
- **Password:** `nazim123`
