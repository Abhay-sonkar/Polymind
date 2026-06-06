import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// ✅ FIX #2 — Restrict CORS to your actual frontend origin.
// Before: cors() with NO options → accepts requests from every origin (any website
//         could call your API). Fine for localhost dev, dangerous in production.
// After:  only the frontend URL in FRONTEND_URL (or localhost:5173 as fallback)
//         is allowed. Add FRONTEND_URL=https://your-prod-domain.com to prod .env.
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));


app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

// ─── Database ───────────────────────────────────────────────────────────────

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI not set in environment variables");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected with Database!");
    } catch (err) {
        console.error("❌ Failed to connect with DB", err.message);
        process.exit(1);
    }
};

// ✅ FIX #1 — Connect to the database BEFORE the HTTP server starts listening.
//
// THE BUG (old code):
//   app.listen(PORT, () => {
//       connectDB();          ← async, but NOT awaited — the server is already
//   });                         accepting connections while Mongoose is still
//                               dialling MongoDB. Any login/register request
//                               that arrives during that window hits an
//                               unconnected Mongoose instance and crashes with
//                               MongoNotConnectedError → 500 "Registration failed"
//                               or "Login failed" — looks like a code bug but
//                               is really a startup-order race condition.
//
// THE FIX: wrap everything in an async function, await connectDB(), then start
// the HTTP server. Now the port is only opened after Mongoose is ready.
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
};

startServer();