# ShopKart — Labs 01–06

A full-stack shopping app built with an Express + Mongoose backend and a responsive React frontend. It includes authentication, product browsing, wishlist management, cart workflows, Razorpay Test Mode checkout, and order history.

## Overview

This project is designed as a lab-based e-commerce application with a clean frontend and a secure backend. It covers the core flow of a modern shopping app:

- Customer registration and login
- Protected user routes using JWT cookies
- Product catalog with search, category filtering and sorting
- Wishlist and cart operations
- Razorpay Test Mode checkout
- Order history and order status tracking

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose
- Frontend: React, Vite, React Router
- Payments: Razorpay Test Mode
- Authentication: JWT stored in an HttpOnly cookie

## Project Structure

```bash
shopkart/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── index.js
│   ├── package.json
│   ├── seed.js
│   └── ...
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── mongodb-data/
├── postman_collection.json
├── README.md
└── .gitignore
```

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB running locally
- npm

## Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

3. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update the values in both files. At minimum, the backend should include:

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/shopkart
JWT_SECRET=<strong-random-secret>
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=<your-razorpay-test-secret>
```

Frontend:

```env
VITE_API_URL=http://localhost:8000
```

## Run Locally

Start MongoDB before running the app.

### Backend

```bash
cd backend
npm run dev
```

The API runs at:

```text
http://localhost:8000
```

### Frontend

Open a second terminal and run:

```bash
cd frontend
npm run dev
```

The app runs at:

```text
http://localhost:5173
```

## Seed Sample Products

After MongoDB is running:

```bash
cd backend
npm run seed
```

This populates the database with sample products for browsing and testing the catalog.

## Key Endpoints

### Customer Auth

- `POST /customers/register`
- `POST /customers/login`
- `GET /customers/me` (requires auth cookie)
- `POST /customers/logout` (requires auth cookie)
- `PATCH /customers/change-password` (requires auth cookie)

The JWT is stored in the `shopkart_auth` HttpOnly cookie.

### Product Catalog

- `GET /products`
- `GET /products/:id`

Supports search, category filtering, and sorting.

### Wishlist

- `GET /wishlist`
- `POST /wishlist/:productId`
- `DELETE /wishlist/:productId`

### Cart

- `GET /cart`
- `POST /cart/:productId`
- `PATCH /cart/:productId`
- `DELETE /cart/:productId`

### Checkout and Orders

- `POST /orders/create-payment-order`
- `POST /orders/verify-payment`
- `GET /orders`
- `GET /orders/:id`

## Postman Demo

Import `postman_collection.json` from the project root into Postman. Make sure both the API and MongoDB are running and keep Postman’s cookie jar enabled.

This collection demonstrates:

- Access denied without login
- Registration and login flows
- Protected profile access
- Logout behavior
- Password change workflows
- Cart and order-related API checks

## Lab Walkthroughs

The project is structured around the lab flow described in the original project documentation:

- Lab 02: authentication, app setup, cookie flow, and browser verification
- Lab 03: product APIs, search, filtering, sorting, and validation
- Lab 04: wishlist APIs and frontend behavior
- Lab 05: cart APIs and shared React state
- Lab 06: Razorpay checkout, order history, and payment verification



## App Screenshots

The app supports the full shopping lifecycle from login to checkout:

- Login screen
- Product catalog
- Wishlist page
- Cart page
- Checkout flow
- My orders view

## Notes

- Passwords are hashed before persistence.
- Sensitive payment details are kept on the server side.
- The app uses server-side stock validation before order creation.
- Razorpay Test Mode is intended for demo and development use only.

## License

This project is intended for learning and demonstration purposes.
# SHOPCART
