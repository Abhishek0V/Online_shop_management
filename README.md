# Hardware Shop – Online Shopping Application (Django + React)

An online shop for a hardware store. Customers browse products and their **spare parts**, add to a cart, check out and pay with **Razorpay**, and receive an **invoice by email**. An admin adds products (multiple images, spare parts) and views all orders.

## Features

**Customer**
- Register, log in (JWT), forgot / reset password by email
- Browse and search products, paginated; product page with image gallery and spare parts list
- Cart (products and spare parts) with stock checks and GST totals
- Checkout with shipping details and Razorpay payment
- Invoice PDF generated after payment, emailed to the customer, downloadable any time
- My orders with status and invoice download

**Admin**
- Add / edit / hide products with multiple images (choose the primary image) and spare parts
- View all orders, search and filter by status, open order details, download invoices

**Real-world handling**
- Many customers can buy the same product at once: stock rows are locked inside a database transaction, so the last unit is sold only once
- Payments are trusted only after server-side signature verification; verification is safe to repeat
- Failures (payment gateway down, email down) never corrupt an order

## Tech stack

React (Vite) · Django + Django REST Framework · PostgreSQL · JWT (simplejwt) · Razorpay · ReportLab · Git

## Project structure

```
online_shop/
├── backend/
│   ├── config/        settings, urls
│   ├── common/        shared permissions, pagination, base model
│   ├── accounts/      custom user (email login, roles), auth APIs
│   ├── catalog/       products, images, spare parts
│   ├── cart/          cart and cart items
│   ├── orders/        orders, checkout, stock reservation
│   ├── payments/      Razorpay integration
│   ├── invoices/      invoice records, PDF, email
│   └── manage.py
└── frontend/
    └── src/           api, context, components, pages, routes, utils
```

## Prerequisites

Python 3.12+ (required by Django 6.1), Node 20.19+ (required by current Vite), PostgreSQL 14+, Git, and a Razorpay account in test mode. A Gmail account with an App Password is optional: it is only needed to really send invoice emails (see *Email* below).

## Setup

```bash
git clone <repository-url>
cd <repository-folder>
```

### 1. Database
```bash
sudo -u postgres psql
CREATE DATABASE hardware_shop;
CREATE USER shop_user WITH PASSWORD 'choose_a_password';
ALTER DATABASE hardware_shop OWNER TO shop_user;
ALTER USER shop_user CREATEDB;
\q
```

### 2. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # then fill in your values
python manage.py migrate
python manage.py seed_catalog                       # demo products with spare parts
python manage.py createsuperuser                    # creates the ADMIN account
python manage.py runserver                          # http://localhost:8000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev                                         # http://localhost:5173
```

## Environment variables (`backend/.env`)

| Key | Purpose |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection |
| `FRONTEND_URL` | Used in password-reset links and CORS (default `http://localhost:5173`) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay **test** keys (the secret stays on the server) |
| `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | _(optional)_ Gmail address and 16-character App Password. If left empty, emails are printed in the backend terminal instead of being sent |
| `GST_PERCENT` | GST added to the subtotal (default 18) |
| `PENDING_ORDER_TIMEOUT_MINUTES` | Unpaid orders older than this are released (default 30) |
| `SHOP_NAME`, `SHOP_ADDRESS`, `SHOP_GSTIN` | Shown on the invoice |

`frontend/.env`: `VITE_API_BASE_URL=http://localhost:8000/api/v1`

## Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | _(created with `createsuperuser`)_ | _(your password)_ |
| Customer | _(register on the site)_ | _(your password)_ |

Public registration always creates a **customer**. Admin accounts are created only by the owner (`createsuperuser`, or by changing a user's role in the Django admin at `/admin/`).

## Email

If `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are set, password-reset links and invoices are sent through Gmail SMTP. If they are empty, the emails are printed in the terminal where the backend runs (the reset link can be copied from there). The invoice can always be downloaded from the order page.

## Testing a payment

Use Razorpay **test mode** keys (they start with `rzp_test_`). In the payment window use one of these:

- **Card (domestic):** `5267 3181 8797 5449`, any future expiry date, any CVV. At the mock bank page enter any OTP of 4 to 10 digits to succeed (fewer than 4 digits fails the payment on purpose).
- **UPI:** `success@razorpay` to succeed, `failure@razorpay` to fail.

Avoid test cards that Razorpay lists as *international*, because they are rejected unless international payments are enabled on the account. No real money is charged in test mode. After payment you are taken to the success page, and the invoice is emailed (if SMTP is configured) and downloadable.

## Running the tests

```bash
cd backend
python manage.py test
```

75 tests cover authentication, catalog, cart, checkout, payments, invoices, and a concurrency test where two buyers compete for the last unit (the concurrency test needs PostgreSQL). Razorpay and email are mocked in automated tests.

## Useful commands

```bash
python manage.py release_stale_orders      # release stock held by unpaid orders
python manage.py send_pending_invoices     # retry invoice emails that failed
```

## API overview (`/api/v1/`)

| Area | Endpoints |
|---|---|
| Auth | `auth/register/`, `auth/login/`, `auth/token/refresh/`, `auth/forgot-password/`, `auth/reset-password/`, `auth/me/` |
| Catalog | `products/`, `products/<slug>/`; admin: `admin/products/`, `admin/spare-parts/`, `admin/product-images/<id>/` |
| Cart | `cart/`, `cart/items/`, `cart/items/<id>/` |
| Orders | `orders/checkout/`, `orders/`, `orders/<order_number>/`, `orders/<order_number>/invoice/`; admin: `admin/orders/`, `admin/orders/<order_number>/` |
| Payments | `payments/verify/`, `payments/failed/` |

## Design notes

- Business logic lives in `services.py` of each app, so the API, tests and commands share the same code.
- Money uses `DecimalField`. Order items store a **snapshot** of name and price, so later catalog changes never alter past orders or invoices.
- Invoice PDFs are generated on request from the order's stored data and are not kept in a public folder.
- Known limitation: a payment that arrives after its order was released is recorded and flagged for a manual refund; a Razorpay webhook would handle this automatically in production.
