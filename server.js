import express from "express";
import dotenv from "dotenv";
import ConnectDB from "./Config/ConnectDB.js";
import cors from "cors";
import cookieParser from "cookie-parser";

import AdminRoute from "./Routes/AdminRoute.js";
import UserRoute from "./Routes/UserRoute.js";
import ProductRoute from "./Routes/ProductRoute.js";
import CategoryRoute from "./Routes/CategoryRoute.js";
import BillingRoute from "./Routes/BillingRoute.js";
import OrderRoute from "./Routes/OrderRoute.js";
import DashboardRoute from "./Routes/DashboardRoute.js";

// Load environment variables FIRST
dotenv.config();

// Connect MongoDB
await ConnectDB();

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  "https://ammaconstructions.vercel.app",
  "http://localhost:5173"
];

// CORS Middleware (Express v5 safe)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / server-to-server
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/admin", AdminRoute);
app.use("/api/user", UserRoute);
app.use("/api/product", ProductRoute);
app.use("/api/category", CategoryRoute);
app.use("/api/billing", BillingRoute);
app.use("/api/orders", OrderRoute);
app.use("/api/dashboard", DashboardRoute);

// Test route
app.get("/", (req, res) => {
  res.send("Backend working successfully!");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
