# RideEarn — AI-Powered Vehicle Rental and Earning Platform

A beginner-friendly student project starter. Includes a frontend, Express API, optional MongoDB persistence, demo vehicle listings, booking/earnings calculations, and a simple AI-assisted price estimator.

## Requirements
- Node.js LTS
- VS Code
- Optional: MongoDB Community Server or MongoDB Atlas
- Optional AI service: Python 3.10+ (Flask and scikit-learn)

## Run the web application
1. Open this folder in VS Code.
2. Open Terminal → New Terminal.
3. Install packages:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env`. For MongoDB persistence, make sure MongoDB is running and leave the example local URI, or replace it with your MongoDB Atlas connection string.
5. Start:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000`.

Without MongoDB, the app runs in demo-memory mode. New listings and bookings are lost when the server restarts.

## Optional Python AI service
In a second terminal:
```bash
pip install flask scikit-learn numpy
python ai_model.py
```
The current frontend calls the built-in demo price estimator at `/api/ai/price`; the optional Python service is provided separately as an example. To connect it, update the `/api/ai/price` route in `server.js` to call `AI_SERVICE_URL/predict`.

## Important project limitations
- The registration endpoint is a demo profile creator, not secure authentication. Do not use real passwords or personal data.
- No payment processing, identity checks, booking conflict prevention, or production-grade security is included.
- The AI model uses synthetic sample data and is only for demonstrating the workflow.
- The earnings figure is a gross booking estimate, not verified income or payment.
