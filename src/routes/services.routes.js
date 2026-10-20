const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description, pricing_type, price_per_unit
             FROM services WHERE active = TRUE ORDER BY id`
        );
        res.json({ services: result.rows });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
