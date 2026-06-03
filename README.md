# AasaMedChem Inventory and Order Management System

A high-performance, enterprise-grade full-stack web application designed for chemical inventory tracking, high-precision price and quantity conversion, and role-based order workflow management.

---

## Project Overview

In chemical and laboratory supply chains, inventory quantities are measured in varying dimensions (Weight, Volume, Count) and units (grams, kilograms, milliliters, liters, units). A major industry challenge is **IEEE 754 floating-point inaccuracies** and **imprecise conversion math** that lead to stock discrepancies, financial leakages, and order processing errors.

**AasaMedChem** solves this by implementing:
1. **Base-Unit Internal Storage**: Storing all weight items in grams (`g`), volume items in milliliters (`mL`), and counted items in `unit`.
2. **Fixed-Decimal Arithmetic**: Storing and executing all financial and quantity parameters as exact `NUMERIC(30,5)` fields via PostgreSQL and `decimal.js`, preventing binary float rounding errors.
3. **Role-Based Access Control (RBAC)**: Distinct permissions for Sellers (requesting quotations, converting them to orders) and Admins (updating catalog, approving orders, tracking stock).

---

## Features

- **Dynamic Search & Filtering**: Multi-parameter search by Name, SKU, or Category, with filters for dimension types and categories.
- **Precision Unit Conversion Engine**: Seamless translation between buyer-facing units (e.g., `kg`, `L`) and internal database base units (`g`, `mL`).
- **Interactive Cart & Quotations**: Sellers can add items to a quotation drawer, customize quantity and unit, view calculated prices in real-time, and save quotations.
- **Workflow State Machine**: Orders undergo status transitions (`PENDING` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`), with automatic inventory deduction on approval and automatic inventory restoration on cancellation.
- **Admin Dashboard**: Overview cards tracking total products, active stock volume, quotations count, and recent transactions.
- **Seller Dashboard**: Visual summary of own quotation counts, purchase orders, total spending, and recent activity.
- **Secure Authentication**: NextAuth.js credentials provider using JWT session tokens and bcrypt password hashing.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, React Hook Form, Zod.
- **Backend API**: Next.js Route Handlers.
- **Database ORM**: Prisma Client v6.
- **Database Engine**: Neon Serverless PostgreSQL.
- **Testing**: Vitest & JSDom.
- **Deployment**: Vercel.

---

## System Architecture

```mermaid
graph TD
    User([Sellers & Admins]) -->|HTTPS Requests| Next[Next.js 15 App Router]
    Next -->|Auth State| NextAuth[NextAuth.js JWT Provider]
    Next -->|Validation| Zod[Zod Form/API Schemas]
    Next -->|Logic| Conversion[Precision Unit Conversion Engine]
    Next -->|ORM Queries| Prisma[Prisma ORM Client]
    Prisma -->|Raw Decimal Types| Neon[(Neon PostgreSQL Database)]
```

---

## Database Schema

The database consists of six tables, designed to maintain relational integrity and audit trails:

1. **User**: Represents Sellers and Admins with emails, hashed passwords, and roles (`ADMIN` | `SELLER`).
2. **Product**: Catalog registry of products. Holds pricing and inventory in internal base units.
3. **Quotation**: Header table for quotation requests containing total amount and creator ID.
4. **QuotationItem**: Line-item details of a quotation, detailing the ordered unit and quantity, alongside the converted internal base quantity and unit price.
5. **Order**: Purchase order transformed from a quotation, containing fulfillment status (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
6. **OrderItem**: Line-item details of an active order matching the quotation specifications.

---

## Unit Conversion Strategy

Quantities entered by Sellers are instantly converted into base units before storage:

| Dimension Type | Base Unit | Supported Input Units | Conversion Factor to Base |
| :--- | :--- | :--- | :--- |
| **WEIGHT** | Grams (`g`) | `g`, `kg` | `1 kg = 1000 g` |
| **VOLUME** | Milliliters (`mL`) | `mL`, `L` | `1 L = 1000 mL` |
| **COUNT** | Units (`unit`) | `unit` | `1 unit = 1 unit` |

### Conversion Engine Utility Functions

Located at `src/lib/conversion.ts`:
- `convertToBaseUnit(quantity, unit)`: Multiplies inputs of `kg` or `L` by `1000` to yield `g` or `mL`.
- `convertFromBaseUnit(baseQuantity, targetUnit)`: Divides internal values by `1000` to format back to `kg` or `L` for user display.
- `calculatePrice(baseQuantity, basePrice)`: Computes subtotal as `baseQuantity * basePrice`.

### Numerical Example:
- **Product**: Sugar (Base Unit: `g`, Base Price: `₹0.08` per gram).
- **Seller Orders**: `2.50000 kg`.
- **Conversion Process**:
  $$\text{Base Quantity} = 2.50000 \times 1000 = 2500.00000\text{ g}$$
  $$\text{Subtotal} = 2500.00000 \times 0.08000 = \text{₹}200.00000$$

---

## Price Storage Strategy & Precision Rules

To protect calculations from floating-point errors (e.g., `0.1 + 0.2 = 0.30000000000000004`), we enforce the following:
- **Database DataType**: `Decimal(30, 5)` mapping to `NUMERIC(30, 5)` in PostgreSQL. This stores numbers as strings internally in the DB and prevents precision degradation.
- **Precision Scale**: Supports numbers up to 30 digits long with exactly **5 decimal places** (e.g., `1250.98765 g` or `₹999999999999.99999`).
- **Engine Library**: All JavaScript/TypeScript arithmetic is performed using the `decimal.js` library, bypassing native float types entirely.

---

## Installation & Setup

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd Assigment
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@hostname/dbname?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="3b1859c25bbd2d3adfa28c40ffb0b0213009bf6d6e7f2258bb0e09210c490a61"
```

### 3. Run Migrations & Database Seeding
Push the database schema to your Neon PostgreSQL and run the seed script:
```bash
npx prisma db push
npx prisma db seed
```

### 4. Run Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Local Tests
Ensure all unit conversions and inventory status transitions work as expected by running the Vitest suite:
```bash
npm run test
```

---

## Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@aasamedchem.com` | `Admin@123` |
| **Seller** | `seller@aasamedchem.com` | `Seller@123` |

---

## User Guide & Workflows

### 1. Product Setup (Admin)
- Log in as Admin. Navigate to **Manage Products** -> **Add New Product**.
- Select **Dimension Type** (Weight/Volume/Count). The system automatically pins the internal base unit (grams for weight, mL for volume, units for count).
- Enter SKU, Name, Description, Category, Base Price, and Starting Stock. Submit.

### 2. Quotation Workflow (Seller)
- Log in as Seller. Navigate to **Browse Products**.
- Search/filter the catalog. Click **Add to quote** for desired items.
- In the side drawer, enter quantity and select unit (e.g., convert grams to kilograms).
- Preview the converted base values and calculated subtotal. Click **Generate Quotation**.

### 3. Order Workflow (Seller & Admin)
- **Seller**: Navigate to **My Quotations**. Locate your pending quotation, and click **Convert to Purchase Order**.
- **Admin**: Log in as Admin. Navigate to **Manage Orders**.
- Locate the pending order. Select **PROCESSING** from the status dropdown.
- **Inventory Check**: The system validates stock. If available inventory is lower than the order's base quantity, it blocks the transition and throws a warning error. Otherwise, it updates status and decreases stock.
- **Cancellation Rule**: If the Admin changes status to **CANCELLED**, the database transaction immediately restores all deducted item quantities to the product stock registry.

---

## Assumptions Made

1. **Base Currency**: Stored and transacted in Indian Rupees (₹) by default.
2. **Standard Hashing**: Passwords stored using bcrypt with a salt factor of 10.
3. **Admin Actions**: Only Admins can modify order states and alter product prices.

---

## Future Improvements

- **Real-time Notifications**: Trigger SMS/Email updates when order status changes.
- **Analytics & Projections**: Charting monthly spendings, top-selling chemicals, and low-stock alerts.
- **Multi-Currency Support**: Support conversion of prices into USD, EUR, etc.
- **Comprehensive Audit Logs**: Dedicated log schema to track database changes and Admin approvals.
