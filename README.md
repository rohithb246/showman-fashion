# The Show Man - Luxury Fashion E-Commerce

A production-ready full-stack e-commerce platform for **The Show Man** luxury fashion brand.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), React Router, Axios, Context API, Framer Motion |
| Backend | Django 6, Django REST Framework, JWT Auth |
| Database | PostgreSQL (SQLite for local dev) |
| Deployment | Gunicorn, Nginx, Docker, Vercel-ready frontend |

## Brand Colors

- **Primary Gold:** `#FFD700`
- **Primary Purple:** `#4A0560`

## Project Structure

```text
showman-fashion/
├── backend/          # Django REST API
├── frontend/         # React Vite SPA
├── deploy/           # Nginx configuration
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL for production, or SQLite for quick local development

### Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Set USE_SQLITE=True for a quick local run without PostgreSQL.

python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

API runs at `http://localhost:8000`.

Default seeded admin credentials:

- Email: `admin@theshowman.com`
- Password: `admin123`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5173`.

## API Endpoints

| Module | Base URL |
|--------|----------|
| Auth | `/api/auth/` |
| Products | `/api/products/` |
| Cart | `/api/cart/` |
| Orders | `/api/orders/` |
| Core | `/api/core/` |
| Admin | `/api/admin/` |

### Authentication

- `POST /api/auth/register/` - Register
- `POST /api/auth/login/` - Login and return JWT tokens
- `POST /api/auth/logout/` - Logout and blacklist refresh token
- `POST /api/auth/token/refresh/` - Refresh access token
- `POST /api/auth/forgot-password/` - Start password reset
- `POST /api/auth/reset-password/` - Complete password reset
- `POST /api/auth/verify-email/` - Verify email token

## Database Tables

Users, Profiles, Categories, SubCategories, Products, ProductImages, ProductVariants, Sizes, Colors, Inventory, Cart, CartItems, Wishlist, Orders, OrderItems, Payments, Coupons, Reviews, Addresses, Notifications, ContactMessages, AdminLogs.

## Features

### Customer

- Home page with hero, collections, testimonials, newsletter, and footer
- Shop with category, size, color, price, search, and sorting filters
- Product details with image zoom, variants, reviews, cart, and wishlist actions
- Cart with quantity controls and coupon support
- Wishlist, checkout, payment success/failure, and order confirmation pages
- User dashboard with profile, orders, wishlist, addresses, and account settings
- JWT authentication with registration, login, logout, password reset, and email verification

### Admin Panel

Available at `/admin`.

- Dashboard analytics for users, orders, products, revenue, recent orders, and sales trends
- Product, image, variant, stock, category, size, and color management APIs
- Order status, shipment tracking, cancellation, and return-ready workflows
- User blocking/deletion and role management
- Coupon, banner, review, contact, and admin log management

## Payment Integration

Configure keys in `backend/.env`:

```env
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
```

Payment flow endpoints:

- `GET /api/orders/payment/config/`
- `POST /api/orders/payment/confirm/`

## Production Deployment

### Backend on VPS

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn config.wsgi:application -c gunicorn.conf.py
```

Use `deploy/nginx.conf` as the Nginx reverse proxy reference.

### Frontend on Vercel

1. Set the root directory to `frontend`.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Add `VITE_API_URL=https://your-api-domain.com/api`.

### Docker

```bash
docker-compose up --build
```

## Security

- JWT authentication with refresh token rotation and blacklisting
- CORS and CSRF configuration
- Password hashing and validation
- Rate limiting for anonymous and authenticated users
- Secure headers in production mode
- Role-based access control for customer, staff, and admin roles

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for supported configuration.

## License

Proprietary - The Show Man (c) 2026
