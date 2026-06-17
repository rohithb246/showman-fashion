# The Show Man — Luxury Fashion E-Commerce

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

```
showman-fashion/
├── backend/          # Django REST API
├── frontend/         # React Vite SPA
├── deploy/           # Nginx configuration
└── docker-compose.yml
```

## Quick Start (Local Development)

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL (optional — SQLite works for dev)

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
# Edit .env — set USE_SQLITE=True for quick start without PostgreSQL

python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

API runs at `http://localhost:8000`

**Default admin credentials (after seed):**
- Email: `admin@theshowman.com`
- Password: `admin123`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5173`

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

- `POST /api/auth/register/` — Register
- `POST /api/auth/login/` — Login (returns JWT)
- `POST /api/auth/logout/` — Logout (blacklist refresh token)
- `POST /api/auth/token/refresh/` — Refresh access token
- `POST /api/auth/forgot-password/` — Password reset email
- `POST /api/auth/reset-password/` — Reset password
- `POST /api/auth/verify-email/` — Email verification

## Database Tables

Users, Profiles, Categories, SubCategories, Products, ProductImages, ProductVariants, Sizes, Colors, Inventory, Cart, CartItems, Wishlist, Orders, OrderItems, Payments, Coupons, Reviews, Addresses, Notifications, ContactMessages, AdminLogs

## Features

### Customer
- Home page with hero, collections, testimonials, newsletter
- Shop with filters (category, size, color, price), search, sorting
- Product details with image zoom, variants, reviews
- Cart with coupon codes
- Wishlist
- Checkout with COD / Razorpay / Stripe ready
- User dashboard (orders, profile, addresses)
- JWT authentication with email verification

### Admin Panel (`/admin`)
- Dashboard with analytics
- Product, order, inventory management
- User management (block/delete)
- Coupon & banner management
- Review approval
- Contact/support tickets

## Payment Integration

Configure in `backend/.env`:

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

### Backend (VPS)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn config.wsgi:application -c gunicorn.conf.py
```

Use `deploy/nginx.conf` as a reference for reverse proxy setup.

### Frontend (Vercel)

1. Set root directory to `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable: `VITE_API_URL=https://your-api-domain.com/api`

### Docker

```bash
docker-compose up --build
```

## Security

- JWT authentication with token rotation & blacklisting
- CORS configuration
- CSRF protection
- Rate limiting (100/hr anon, 1000/hr authenticated)
- Password hashing & validation
- Secure headers in production mode
- Role-based access control (customer, staff, admin)

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all configuration options.

## License

Proprietary — The Show Man © 2026
