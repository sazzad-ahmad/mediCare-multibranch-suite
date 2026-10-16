# 🏥 MediCare - Multi-Branch Cloud Pharmacy Suite
> **A cloud-native, enterprise-grade multi-tenant pharmacy suite featuring real-time multi-branch inventory tracking, batch expiry detection, POS checkout, and distributed SQL persistence.**

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Frontend%20Live-black?style=flat-square&logo=vercel)](https://medi-care-multibranch-suite.vercel.app)
[![Render Backend](https://img.shields.io/badge/Render-Backend%20Live-46E3B7?style=flat-square&logo=render&logoColor=black)](https://medicare-multibranch-suite.onrender.com)
[![Database](https://img.shields.io/badge/Database-TiDB%20Serverless-F04D36?style=flat-square&logo=pingcap&logoColor=white)](https://tidbcloud.com)

---

## 🌐 Live Deployments
- 💻 **Web Application (Vercel):** [medi-care-multibranch-suite.vercel.app](https://medi-care-multibranch-suite.vercel.app)
- 🔌 **REST API Service (Render):** [medicare-multibranch-suite.onrender.com](https://medicare-multibranch-suite.onrender.com)
- 🗄️ **Cloud Database:** TiDB Cloud (Distributed MySQL-compatible Serverless Engine)

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, Lucide React (Deployed on **Vercel** with automated CI/CD) |
| **Backend API** | PHP 8.2 Custom REST Router, Secure PDO Data Access Layer, Native CORS Handling |
| **Containerization** | Dockerized runtime environment deployed as a Web Service on **Render** |
| **Database** | TiDB Serverless Cloud with SSL/TLS encryption driving **13 normalized relational tables** |

---

## ⚡ Core Modules & System Features

- 🏢 **Multi-Branch Hierarchy:** Isolated stock management and cross-branch inventory visibility across physical locations (*Dhanmondi*, *UIU Madani*, *Uttara*).
- 💊 **Inventory & Batch Tracking:** Lot/Batch number tracking, unit costing, profit margins, and shelf-life monitoring.
- 🚨 **Automated Alert Engine:** Real-time triggers for low-stock thresholds (stock $\le 10$) and approaching expiry dates.
- 💳 **Point of Sale (POS):** Fast SKU/brand lookup, live cart computation, discount/tax calculations, and transaction records.
- 📦 **Procurement & Stock Transfers:** Supplier purchase orders, receiving workflows with auto-stock updates, and inter-branch transfers.
- 👥 **Role-Based Access Control (RBAC):** Distinct permission boundaries and dashboards for Admin, Pharmacist, and Viewer profiles.

---

## 🗄️ Database Schema Design (13 Tables)
`branches` • `users` • `categories` • `suppliers` • `medicines` • `medicine_batches` • `inventory` • `purchase_orders` • `purchase_order_items` • `sales` • `sale_items` • `stock_transfers` • `audit_logs`

---

## 📖 Live Demo & User Guide

Explore the live system directly without registration using the pre-configured accounts:

### 🔑 Demo Credentials
| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@medicare.com` | `admin123` | Full access (Inventory, POS, Branch Transfers, Settings) |
| **Pharmacist** | `pharmacist@medicare.com` | `pharma123` | POS Sales, Stock updates, Expiry tracking |
| **Viewer / Auditor** | `viewer@medicare.com` | `viewer123` | Read-only reports & stock monitoring |

### 🕹️ Quick Walkthrough
1. **Sign In:** Go to the [Live Portal](https://medi-care-multibranch-suite.vercel.app), select a demo role chip (e.g., **Admin**), and log in.
2. **Branch Switching:** Switch locations from the top bar dropdown (*Dhanmondi*, *UIU Madani*, *Uttara*) to see live stock sync per branch.
3. **Manage Inventory:** Navigate to **Inventory** to search medicines, view batch expiration alerts, or click **+ Add New Medicine**.
4. **POS Billing:** Head to **POS**, select medicines into the cart, adjust quantities, and click **Checkout** to process immediate inventory deductions.

---

## 💻 Local Development Setup

To run the full stack locally:

```bash
# 1. Clone the repository
git clone [https://github.com/sazzad-ahmad/mediCare-multibranch-suite.git](https://github.com/sazzad-ahmad/mediCare-multibranch-suite.git)

# 2. Frontend Setup
pnpm install
pnpm dev

# 3. Backend Setup (PHP 8.2) in a separate terminal
php -S localhost:8000 server.php
```

## 👨‍💻 Author
Sazzad Ahmad

GitHub: @sazzad-ahmad
