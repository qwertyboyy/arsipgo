# ArsipGo Backend

Backend REST API awal menggunakan Node.js, Express, dan PostgreSQL. Backend ini menyimpan akun, katalog layanan, dan pesanan. Pembayaran belum terhubung ke payment gateway.

## 1. Persiapan

Pastikan Node.js, npm, dan PostgreSQL sudah terpasang.

Buka terminal di folder `arsipgo-backend`, lalu jalankan:

```bash
npm install
```

Salin `.env.example` menjadi `.env`, lalu isi password PostgreSQL dan `JWT_SECRET`. Jangan pernah mengunggah `.env` ke GitHub.

Contoh `JWT_SECRET` adalah string acak panjang, bukan password yang dipakai di akun lain.

## 2. Buat database

Di pgAdmin, buat database bernama `arsipgo`. Setelah itu buka Query Tool pada database `arsipgo`, lalu jalankan seluruh isi file `database/schema.sql`.

Alternatif melalui terminal PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE arsipgo;"
psql -U postgres -d arsipgo -f database/schema.sql
```

## 3. Jalankan server

```bash
npm run dev
```

Tes melalui browser:
- `http://localhost:3000/`
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/services`

Jika health check menampilkan `database: connected`, koneksi database berhasil.

## 4. Endpoint

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/register` | Membuat akun |
| POST | `/api/auth/login` | Login dan mendapatkan JWT |
| GET | `/api/services` | Daftar layanan |
| POST | `/api/bookings` | Membuat pesanan, perlu token |
| GET | `/api/bookings/mine` | Daftar pesanan milik pengguna, perlu token |
| GET | `/api/bookings/:id` | Detail pesanan milik pengguna, perlu token |

### Contoh register/login

Body JSON untuk `POST /api/auth/register`:

```json
{
  "name": "Nama Pengguna",
  "email": "pengguna@example.com",
  "whatsapp": "081234567890",
  "password": "password-minimal-8"
}
```

Body JSON untuk `POST /api/auth/login`:

```json
{
  "email": "pengguna@example.com",
  "password": "password-minimal-8"
}
```

Simpan `token` dari respons login. Untuk endpoint pesanan, kirim header:

```text
Authorization: Bearer TOKEN_HASIL_LOGIN
```

### Contoh membuat pesanan

`POST /api/bookings` dengan token di header dan body JSON:

```json
{
  "service_id": 1,
  "user_type": "Mahasiswa",
  "description": "Memilah 10 dokumen organisasi",
  "document_count": 10,
  "start_date": "2026-11-01",
  "package_name": "Paket 1",
  "workers": 1,
  "duration_days": 1
}
```

ID layanan bisa dilihat dari `GET /api/services`.

## Catatan penting

- Frontend HTML prototype belum otomatis terhubung ke API ini. Itu langkah berikutnya setelah backend berjalan.
- Pembayaran dan status pesanan belum diverifikasi oleh admin atau payment gateway. Jangan memperlakukan tombol simulasi frontend sebagai transaksi sungguhan.
- JWT berlaku 2 jam.
- Belum ada endpoint admin untuk mengubah status pesanan.
