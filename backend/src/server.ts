import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from the local backend .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 8001;

app.use(cors({
  origin: "*", // Adjust origins in production
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Clara API Backend" });
});

// Auth Routes
import authRoutes from "./routes/auth.routes";
app.use("/api/auth", authRoutes);

// Entries Routes
import entriesRoutes from "./routes/entries.routes";
app.use("/api/entries", entriesRoutes);

app.listen(port, () => {
  console.log(`[Server] Clara Backend running at http://localhost:${port}`);
});
