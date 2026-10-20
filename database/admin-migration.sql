-- Jalankan sekali pada database arsipgo melalui pgAdmin Query Tool.
-- Role default untuk semua akun lama adalah user.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin'));

-- GANTI email di bawah dengan email akun yang memang kamu kontrol.
-- Jangan jadikan akun publik sebagai admin.
-- Jalankan UPDATE ini hanya untuk akun admin yang kamu tentukan.
-- UPDATE users SET role = 'admin' WHERE email = 'email-admin-kamu@example.com';
