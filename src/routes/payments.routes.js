const express = require("express");
const multer = require("multer");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");
const paymentInfo = require("../config/payment-info");

const router = express.Router();

const ALLOWED_METHODS = new Set(["qris", "ewallet", "bank"]);
const MAX_PROOF_SIZE = 3 * 1024 * 1024; // 3 MB

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PROOF_SIZE, files: 1 }
}).single("proof");

// Deteksi jenis gambar dari isi file, bukan dari nama atau tipe kiriman browser.
function detectImageType(buffer) {
    if (!buffer || buffer.length < 12) return null;

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { mime: "image/jpeg" };
    }

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (buffer.subarray(0, 8).equals(pngSignature)) {
        return { mime: "image/png" };
    }

    if (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        return { mime: "image/webp" };
    }

    return null;
}

// Info tujuan pembayaran (QRIS, e-wallet, rekening bank)
router.get("/info", requireAuth, (req, res) => {
    res.json({ payment_info: paymentInfo });
});

// Pelanggan mengunggah bukti pembayaran
router.post(
    "/proof/:bookingId",
    requireAuth,
    (req, res, next) => {
        upload(req, res, (error) => {
            if (error) {
                return res.status(400).json({
                    message: error.code === "LIMIT_FILE_SIZE"
                        ? "Ukuran file maksimal 3 MB."
                        : "File yang diunggah tidak dapat dibaca."
                });
            }
            next();
        });
    },
    async (req, res, next) => {
        try {
            const bookingId = Number(req.params.bookingId);
            const method = String(req.body.payment_method || "").trim();

            if (!Number.isSafeInteger(bookingId) || bookingId < 1) {
                return res.status(400).json({ message: "ID pesanan tidak valid." });
            }

            if (!ALLOWED_METHODS.has(method)) {
                return res.status(400).json({ message: "Pilih metode pembayaran yang valid." });
            }

            if (!req.file) {
                return res.status(400).json({ message: "Pilih file bukti pembayaran terlebih dahulu." });
            }

            const type = detectImageType(req.file.buffer);

            if (!type) {
                return res.status(400).json({
                    message: "Bukti pembayaran harus berupa gambar JPG, PNG, atau WEBP."
                });
            }

            const result = await pool.query(
                `SELECT id, amount, status, payment_status
                 FROM bookings
                 WHERE id = $1 AND user_id = $2`,
                [bookingId, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "Pesanan tidak ditemukan." });
            }

            const booking = result.rows[0];

            if (booking.status === "dibatalkan") {
                return res.status(400).json({ message: "Pesanan yang dibatalkan tidak dapat dibayar." });
            }

            if (booking.payment_status === "paid") {
                return res.status(400).json({ message: "Pesanan ini sudah dibayar." });
            }

            if (booking.payment_status === "menunggu_verifikasi") {
                return res.status(400).json({ message: "Bukti pembayaran sedang diperiksa admin." });
            }

            if (!Number.isSafeInteger(Number(booking.amount)) || Number(booking.amount) <= 0) {
                return res.status(400).json({ message: "Nominal pembayaran belum ditetapkan admin." });
            }

            const updated = await pool.query(
                `UPDATE bookings
                 SET payment_method = $1,
                     payment_proof_data = $2,
                     payment_proof_mime = $3,
                     payment_proof_path = NULL,
                     payment_proof_uploaded_at = NOW(),
                     payment_status = 'menunggu_verifikasi',
                     payment_reject_reason = NULL
                 WHERE id = $4
                   AND user_id = $5
                   AND payment_status IN ('unpaid', 'ditolak', 'pending')
                 RETURNING id, payment_status, payment_method,
                           payment_proof_uploaded_at`,
                [method, req.file.buffer, type.mime, booking.id, req.user.id]
            );

            if (updated.rowCount === 0) {
                return res.status(409).json({
                    message: "Status pesanan berubah. Muat ulang halaman lalu coba lagi."
                });
            }

            return res.json({
                message: "Bukti pembayaran terkirim. Admin akan memeriksa pembayaranmu.",
                payment: updated.rows[0]
            });
        } catch (error) {
            console.error("Gagal menyimpan bukti pembayaran:", error.message);
            next(error);
        }
    }
);

// Melihat bukti pembayaran: hanya pemilik pesanan atau admin
router.get("/proof/:bookingId", requireAuth, async (req, res, next) => {
    try {
        const bookingId = Number(req.params.bookingId);

        if (!Number.isSafeInteger(bookingId) || bookingId < 1) {
            return res.status(400).json({ message: "ID pesanan tidak valid." });
        }

        const isAdmin = req.user.role === "admin";

        const result = await pool.query(
            `SELECT payment_proof_data, payment_proof_mime
             FROM bookings
             WHERE id = $1 AND ($2::boolean OR user_id = $3)`,
            [bookingId, isAdmin, req.user.id]
        );

        const row = result.rows[0];

        if (!row || !row.payment_proof_data) {
            return res.status(404).json({ message: "Bukti pembayaran tidak ditemukan." });
        }

        res.set({
            "Content-Type": row.payment_proof_mime || "application/octet-stream",
            "Content-Disposition": "inline",
            "Cache-Control": "private, max-age=300",
            "X-Content-Type-Options": "nosniff"
        });

        return res.send(row.payment_proof_data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;