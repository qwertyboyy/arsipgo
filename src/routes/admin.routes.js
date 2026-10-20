const express = require("express");
const pool = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireAdmin);

const allowedStatuses = new Set([
    "menunggu_konfirmasi",
    "dikonfirmasi",
    "diproses",
    "selesai",
    "dibatalkan"
]);

const allowedPaymentStatuses = new Set([
    "unpaid",
    "menunggu_verifikasi",
    "paid",
    "ditolak",
    "pending",
    "expired",
    "cancelled",
    "failed"
]);

router.get("/summary", async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'menunggu_konfirmasi')::int AS menunggu_konfirmasi,
              COUNT(*) FILTER (WHERE status = 'dikonfirmasi')::int AS dikonfirmasi,
              COUNT(*) FILTER (WHERE status = 'diproses')::int AS diproses,
              COUNT(*) FILTER (WHERE status = 'selesai')::int AS selesai,
              COUNT(*) FILTER (WHERE status = 'dibatalkan')::int AS dibatalkan,
              COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid,
              COUNT(*) FILTER (WHERE payment_status = 'menunggu_verifikasi')::int AS menunggu_verifikasi,
              COUNT(*) FILTER (
                  WHERE COALESCE(payment_status, 'unpaid') = 'unpaid'
              )::int AS unpaid,
              COALESCE(
                  SUM(amount) FILTER (WHERE payment_status = 'paid'), 0
              )::float8 AS total_pendapatan
            FROM bookings
        `);
        res.json({ summary: result.rows[0] });
    } catch (error) { next(error); }
});

router.get("/bookings", async (req, res, next) => {
    try {
        const status = String(req.query.status || "").trim();
        const paymentStatus = String(req.query.payment_status || "").trim();
        const search = String(req.query.search || "").trim();
        const params = [];
        let where = [];

        if (status) {
            if (!allowedStatuses.has(status)) {
                return res.status(400).json({
                    message: "Filter status tidak valid."
                });
            }

            params.push(status);
            where.push(`b.status = $${params.length}`);
        }

        if (paymentStatus) {
            if (!allowedPaymentStatuses.has(paymentStatus)) {
                return res.status(400).json({
                    message: "Filter status pembayaran tidak valid."
                });
            }

            params.push(paymentStatus);
            where.push(
                `COALESCE(b.payment_status, 'unpaid') = $${params.length}`
            );
        }

        if (search) {
            params.push(`%${search}%`);
            where.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR CAST(b.id AS TEXT) ILIKE $${params.length})`);
        }

        const query = `
            SELECT b.id, b.user_id, b.service_id, b.user_type, b.description,
                   b.document_count, b.start_date, b.package_name, b.workers,
                   b.duration_days, b.status, b.created_at,
                   b.amount,
                   COALESCE(b.payment_status, 'unpaid') AS payment_status,
                   b.paid_at,
                   b.payment_method,
                   b.payment_proof_uploaded_at,
                   b.payment_reject_reason,
                   (b.payment_proof_data IS NOT NULL) AS has_proof,
                   u.name AS customer_name, u.email AS customer_email, u.whatsapp,
                   s.name AS service_name
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            JOIN services s ON s.id = b.service_id
            ${where.length ? "WHERE " + where.join(" AND ") : ""}
            ORDER BY b.created_at DESC
            LIMIT 200
        `;
        const result = await pool.query(query, params);
                res.json({ bookings: result.rows });
    } catch (error) { next(error); }
});

router.patch("/bookings/:id/status", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const status = String(req.body.status || "").trim();
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ message: "ID pesanan tidak valid." });
        }
        if (!allowedStatuses.has(status)) {
            return res.status(400).json({ message: "Status pesanan tidak valid." });
        }
        const result = await pool.query(
            `UPDATE bookings SET status = $1 WHERE id = $2
             RETURNING id, status`,
            [status, id]
        );
        if (!result.rowCount) return res.status(404).json({ message: "Pesanan tidak ditemukan." });
        res.json({ message: "Status pesanan berhasil diperbarui.", booking: result.rows[0] });
    } catch (error) { next(error); }
});

// Admin menyetujui atau menolak bukti pembayaran
router.patch("/bookings/:id/payment", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const action = String(req.body.action || "").trim();
        const reason = String(req.body.reason || "").trim();

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ message: "ID pesanan tidak valid." });
        }

        if (action !== "approve" && action !== "reject") {
            return res.status(400).json({ message: "Aksi pembayaran tidak valid." });
        }

        let result;

        if (action === "approve") {
            result = await pool.query(
                `UPDATE bookings
                 SET payment_status = 'paid',
                     paid_at = COALESCE(paid_at, NOW()),
                     payment_reject_reason = NULL
                 WHERE id = $1 AND payment_status = 'menunggu_verifikasi'
                 RETURNING id, payment_status, paid_at`,
                [id]
            );
        } else {
            if (!reason) {
                return res.status(400).json({ message: "Alasan penolakan wajib diisi." });
            }

            if (reason.length > 300) {
                return res.status(400).json({ message: "Alasan penolakan maksimal 300 karakter." });
            }

            result = await pool.query(
                `UPDATE bookings
                 SET payment_status = 'ditolak',
                     payment_reject_reason = $2
                 WHERE id = $1 AND payment_status = 'menunggu_verifikasi'
                 RETURNING id, payment_status, payment_reject_reason`,
                [id, reason]
            );
        }

        if (!result.rowCount) {
            return res.status(409).json({
                message: "Pesanan ini tidak sedang menunggu verifikasi pembayaran."
            });
        }

        res.json({
            message: action === "approve"
                ? "Pembayaran disetujui."
                : "Pembayaran ditolak.",
            booking: result.rows[0]
        });
    } catch (error) { next(error); }
});

module.exports = router;