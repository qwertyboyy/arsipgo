const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Harga paket tenaga kerja ditentukan di backend.
const PACKAGE_PRICES = {
    "Paket 1": 150000,
    "Paket 2": 400000
};

router.post("/", requireAuth, async (req, res, next) => {
    let client;

    try {
        const serviceId = Number(req.body.service_id);
        const description = String(req.body.description || "").trim();
        const userType = String(req.body.user_type || "Mahasiswa").trim();
        const documentCount = req.body.document_count == null
            ? null
            : Number(req.body.document_count);
        const startDate = req.body.start_date || null;
        const packageName = String(
            req.body.package_name || "Belum dipilih"
        ).trim();
        const workers = req.body.workers == null
            ? null
            : Number(req.body.workers);
        const durationDays = req.body.duration_days == null
            ? null
            : Number(req.body.duration_days);

        // Validasi input
        if (!Number.isSafeInteger(serviceId) || serviceId < 1) {
            return res.status(400).json({
                message: "service_id wajib berupa ID layanan yang valid."
            });
        }

        if (!description) {
            return res.status(400).json({
                message: "Deskripsi kebutuhan wajib diisi."
            });
        }

        if (
            documentCount !== null &&
            (!Number.isSafeInteger(documentCount) || documentCount < 1)
        ) {
            return res.status(400).json({
                message: "Jumlah dokumen harus bilangan bulat minimal 1."
            });
        }

        if (
            workers !== null &&
            (!Number.isSafeInteger(workers) || workers < 1)
        ) {
            return res.status(400).json({
                message: "Jumlah tenaga harus minimal 1."
            });
        }

        if (
            durationDays !== null &&
            (!Number.isSafeInteger(durationDays) || durationDays < 1)
        ) {
            return res.status(400).json({
                message: "Durasi harus minimal 1 hari."
            });
        }

        // Ambil harga resmi dari database.
        const serviceResult = await pool.query(
            `SELECT id, name, pricing_type, price_per_unit
             FROM services
             WHERE id = $1 AND active = TRUE`,
            [serviceId]
        );

        if (serviceResult.rowCount === 0) {
            return res.status(404).json({
                message: "Layanan tidak ditemukan."
            });
        }

        const service = serviceResult.rows[0];

        // Paket Custom perlu ditentukan harganya oleh admin.
        const isCustomPackage = packageName === "Paket Custom";
        const isCustomService = service.pricing_type === "custom";

        let amount = null;

        if (!isCustomPackage && !isCustomService) {
            if (!Object.hasOwn(PACKAGE_PRICES, packageName) &&
                packageName !== "Belum dipilih") {
                return res.status(400).json({
                    message: "Pilihan paket tidak valid."
                });
            }

            const packagePrice = PACKAGE_PRICES[packageName] || 0;
            const unitPrice = Number(service.price_per_unit);

            if (
                service.pricing_type !== "package" &&
                (!Number.isSafeInteger(unitPrice) || unitPrice < 0)
            ) {
                return res.status(400).json({
                    message: "Harga layanan belum valid."
                });
            }

            if (service.pricing_type === "document") {
                if (documentCount === null) {
                    return res.status(400).json({
                        message: "Jumlah dokumen wajib diisi."
                    });
                }

                amount = documentCount * unitPrice + packagePrice;
            } else if (service.pricing_type === "day") {
                if (durationDays === null) {
                    return res.status(400).json({
                        message: "Durasi layanan wajib diisi."
                    });
                }

                amount = durationDays * unitPrice + packagePrice;
            } else if (service.pricing_type === "package") {
                amount = unitPrice + packagePrice;
            } else {
                return res.status(400).json({
                    message: "Jenis harga layanan tidak dikenali."
                });
            }

            if (!Number.isSafeInteger(amount) || amount <= 0) {
                return res.status(400).json({
                    message: "Nominal pesanan tidak valid."
                });
            }
        }

        client = await pool.connect();

        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO bookings
             (
                 user_id,
                 service_id,
                 user_type,
                 description,
                 document_count,
                 start_date,
                 package_name,
                 workers,
                 duration_days,
                 status,
                 amount,
                 payment_status
             )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,
                     'menunggu_konfirmasi',$10,'unpaid')
             RETURNING
                 id,
                 service_id,
                 user_type,
                 description,
                 document_count,
                 start_date,
                 package_name,
                 workers,
                 duration_days,
                 status,
                 amount,
                 payment_status,
                 created_at`,
            [
                req.user.id,
                serviceId,
                userType,
                description,
                documentCount,
                startDate,
                packageName,
                workers,
                durationDays,
                amount
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: amount === null
                ? "Pesanan dicatat. Harga perlu ditetapkan admin sebelum pembayaran."
                : "Pesanan berhasil dicatat. Silakan lanjutkan pembayaran.",
            booking: result.rows[0]
        });
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        if (error.code === "23503") {
            return res.status(400).json({
                message: "Data layanan atau pengguna tidak valid."
            });
        }

        return next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
});

// Daftar pesanan pengguna
router.get("/mine", requireAuth, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                 b.id,
                 b.user_type,
                 b.description,
                 b.document_count,
                 b.start_date,
                 b.package_name,
                 b.workers,
                 b.duration_days,
                 b.status,
                 b.amount,
                 b.payment_status,
                 b.paid_at,
                 b.payment_method,
                 b.payment_proof_uploaded_at,
                 b.payment_reject_reason,
                 b.created_at,
                 s.name AS service_name
             FROM bookings b
             JOIN services s ON s.id = b.service_id
             WHERE b.user_id = $1
             ORDER BY b.created_at DESC`,
            [req.user.id]
        );

        return res.json({ bookings: result.rows });
    } catch (error) {
        return next(error);
    }
});

// Detail pesanan milik pengguna
router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        const bookingId = Number(req.params.id);

        if (!Number.isSafeInteger(bookingId) || bookingId < 1) {
            return res.status(400).json({
                message: "ID pesanan tidak valid."
            });
        }

        const result = await pool.query(
            `SELECT
                 b.id,
                 b.user_type,
                 b.description,
                 b.document_count,
                 b.start_date,
                 b.package_name,
                 b.workers,
                 b.duration_days,
                 b.status,
                 b.amount,
                 b.payment_status,
                 b.paid_at,
                 b.payment_method,
                 b.payment_proof_uploaded_at,
                 b.payment_reject_reason,
                 b.created_at,
                 s.name AS service_name
             FROM bookings b
             JOIN services s ON s.id = b.service_id
             WHERE b.id = $1 AND b.user_id = $2`,
            [bookingId, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Pesanan tidak ditemukan."
            });
        }

        return res.json({ booking: result.rows[0] });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;