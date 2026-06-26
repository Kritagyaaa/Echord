const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");

const app = express();

// Debug (Temporary - remove after testing)
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

// Import Routes
const songRoutes = require("./routes/songRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Spotify Backend Running"
    });
});

// Register Routes
app.use("/api/songs", songRoutes);
app.use("/api/recommend", recommendationRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});