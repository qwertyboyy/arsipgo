const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

function createToken(user) {
    return jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role || "user" },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );
}

router.post("/register", async (req, res, next) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const whatsapp = String(req.body.whatsapp || "").trim();
        const password = String(req.body.password || "");

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Nama, email, dan password wajib diisi." });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "Format email tidak valid." });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password minimal 8 karakter." });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO users (name, email, whatsapp, password_hash, role)
             VALUES ($1, $2, $3, $4, 'user')
             RETURNING id, name, email, whatsapp, role, created_at`,
            [name, email, whatsapp || null, passwordHash]
        );

        const user = result.rows[0];
        return res.status(201).json({
            message: "Pendaftaran berhasil.",
            token: createToken(user),
            user
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "Email sudah terdaftar." });
        }
        next(error);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password wajib diisi." });
        }

        const result = await pool.query(
            `SELECT id, name, email, whatsapp, password_hash, role, created_at
             FROM users WHERE email = $1`,
            [email]
        );
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: "Email atau password salah." });
        }

        delete user.password_hash;
        return res.json({ message: "Login berhasil.", token: createToken(user), user });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
