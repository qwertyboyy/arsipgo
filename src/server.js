require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const authRoutes = require("./routes/auth.routes");
const serviceRoutes = require("./routes/services.routes");
const bookingRoutes = require("./routes/bookings.routes");
const adminRoutes = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payments.routes"); 

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map(value => value.trim())
        : true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
    res.json({
        message: "ArsipGo API berjalan",
        version: "1.1.0",
        endpoints: ["/api/health", "/api/auth", "/api/services", "/api/bookings", "/api/admin"]
    });
});

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok", database: "connected" });
    } catch (error) {
        console.error("Health check database error:", error.message);
        res.status(503).json({ status: "error", database: "disconnected" });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res) => res.status(404).json({ message: "Endpoint tidak ditemukan." }));
app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.status || 500).json({
        message: error.status ? error.message : "Terjadi kesalahan pada server."
    });
});

app.listen(port, () => console.log(`ArsipGo API berjalan di http://localhost:${port}`));
