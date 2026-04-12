# MaliMind AI - Kenya-first AI Super App

## 🚀 Overview
MaliMind is an AI-powered minimal MVP mobile app helping users manage money, save, run chamas, and get intelligent financial recommendations.

## 🛠 Tech Stack
- **Backend:** NestJS, Prisma, PostgreSQL, OpenAI
- **Frontend:** React Native (Expo), TypeScript, Zustand, TailWind UI (NativeWind)

---

## 💻 1. Running the Backend

### Prerequisites
1. Node.js (v18+)
2. PostgreSQL running locally or remotely.

### Steps
1. Navigate to backend:
   ```bash
   cd backend
   npm install
   ```
2. Configure Environment:
   Create `backend/.env`:
   ```env
   # PostgreSQL connection string
   DATABASE_URL="postgresql://user:password@localhost:5432/malimind?schema=public"
   
   # JWT Secret
   JWT_SECRET="super_secret_malimind_key"
   
   # OpenAI Key for AI Chat functionality
   OPENAI_API_KEY="sk-..."
   ```
3. Run Database Migrations & Seed:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```
4. Start Backend Server:
   ```bash
   npm run start:dev
   ```
   *The server runs on http://localhost:3000.* Check Swagger docs at `http://localhost:3000/docs`.

---

## 📱 2. Running the Frontend (React Native/Expo)

### Steps
1. Navigate to frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Expo server:
   ```bash
   npm start
   ```
3. Options to run:
   - **Android Emulator**: Press `a` in the terminal to launch.
   - **iOS Simulator**: Press `i` in the terminal to launch.
   - **Physical Device**: Download the "Expo Go" app on your phone and scan the QR code.

Note: If on a physical phone, you must change `BASE_URL` in `frontend/src/api/client.ts` to your machine's local IP address (e.g., `http://192.168.1.5:3000/api/v1`) instead of `localhost`.

---

## 🧪 3. Test API Calls (via cURL or Postman)

**Register:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
-H "Content-Type: application/json" \
-d '{"name":"John Kamau","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"john@example.com","password":"password123"}'
```

**Add Income:** (Replace Token)
```bash
curl -X POST http://localhost:3000/api/v1/transactions \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"type":"income","amount":15000,"category":"Salary"}'
```

**Get Dashboard:**
```bash
curl -X GET http://localhost:3000/api/v1/users/dashboard \
-H "Authorization: Bearer <YOUR_TOKEN>"
```

**AI Chat:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/chat \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"prompt":"Can I spend 5000 today?"}'
```

**M-Pesa STK Push Deposit:**
```bash
curl -X POST http://localhost:3000/api/v1/mpesa/deposit \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"phone":"254712345678", "amount":10}'
```
*(Ensure `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` are properly set in `.env`)*

---

## 🎯 4. Next Improvements (Post-MVP)
1. **GraphQL:** Migrate from REST to GraphQL for granular data fetching.
2. **Advanced AI:** Implement RAG (Retrieval-Augmented Generation) for personalized financial education articles.
3. **Push Notifications:** Set up Firebase Cloud Messaging for Goal/Chama reminders.
4. **Real-time Chamas:** WebSockets for real-time group chat and contribution updates.
