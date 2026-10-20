const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Token login diperlukan." });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa." });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Akses khusus admin." });
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
