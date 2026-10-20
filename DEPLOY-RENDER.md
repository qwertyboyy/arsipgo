# Deploy ArsipGo ke Render gratis

1. Buat repository GitHub lalu upload isi folder proyek. Jangan upload
   `node_modules`, `.env`, atau connection string database.
2. Jika database Neon masih kosong, buka SQL Editor Neon dan jalankan
   `database/neon-schema.sql`. File ini hanya membuat struktur tabel, tanpa
   akun, pesanan, atau katalog layanan. Jangan jalankan pada database yang
   sudah memiliki tabel aplikasi. Jika sudah ada database ArsipGo lengkap,
   lewati langkah ini.
3. Buka https://dashboard.render.com/ lalu pilih **New > Blueprint**.
4. Hubungkan GitHub dan pilih repository proyek ini. Render membaca
   `render.yaml`: satu Web Service gratis di Singapore, tanpa database Render.
5. Isi `DATABASE_URL` dengan connection string dari Neon. Gunakan password
   baru jika password sebelumnya sudah dibagikan. Pertahankan parameter SSL.
   JWT_SECRET dibuat otomatis oleh Render.
6. Pilih **Deploy Blueprint** dan tunggu build selesai.
7. Buka alamat HTTPS yang diberikan Render. Periksa `/api/health` untuk
   memastikan `database: connected`, lalu tes daftar akun dan login.
8. Periksa `/api/services`. Jika kosong, tabel services perlu diisi katalog
   layanan milik tugas kamu; skema tidak menyertakan data layanan.

Frontend dan API berada pada domain yang sama sehingga FRONTEND_URL tidak
wajib untuk deployment ini. Jika ingin membatasi CORS, tambahkan FRONTEND_URL
di Environment dengan nilai URL HTTPS aplikasi yang diberikan Render.

Halaman admin berada di `/admin.html`. Untuk membuat admin, daftar akun
sendiri lalu jalankan SQL berikut di Neon dengan email akun tersebut:

```sql
UPDATE users SET role = 'admin' WHERE email = 'email-kamu@example.com';
```

Login ulang setelah mengubah role. Jangan memberikan role admin kepada akun
yang bukan milikmu.

Paket gratis tidur ketika tidak aktif. Buka website sebelum presentasi.
