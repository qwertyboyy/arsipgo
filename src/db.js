const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === "true"
            ? { rejectUnauthorized: false }
            : undefined
    })
    : new Pool({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || "arsipgo",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD
    });

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error.message);
});

module.exports = pool;
