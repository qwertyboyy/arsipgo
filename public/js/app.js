let userName = "Ayu";
let documentCount = 10;

let selectedService = {
    icon: "📑",
    name: "Pemilahan Arsip",
    pricingType: "document",
    pricePerUnit: 5000,
    description: "Membantu memilah arsip berdasarkan jenis, kategori, tahun, atau kebutuhan pengguna."
};


const API_BASE = window.location.origin;
let authToken = sessionStorage.getItem("arsipgo_token") || "";
let currentUser = JSON.parse(sessionStorage.getItem("arsipgo_user") || "null");
let apiServices = [];
let bookingDraft = { userType: "Mahasiswa", description: "", startDate: "", documentCount: 10 };
let lastBooking = null;

async function apiRequest(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Permintaan gagal (${response.status})`);
    return data;
}

function saveSession(data) {
    authToken = data.token;
    currentUser = data.user;
    userName = data.user.name;
    sessionStorage.setItem("arsipgo_token", authToken);
    sessionStorage.setItem("arsipgo_user", JSON.stringify(currentUser));
}

function clearSession() {
    authToken = "";
    currentUser = null;
    sessionStorage.removeItem("arsipgo_token");
    sessionStorage.removeItem("arsipgo_user");
}

function requireLogin() {
    if (!authToken || !currentUser) {
        alert("Silakan masuk ke akun ArsipGo terlebih dahulu.");
        login();
        return false;
    }
    return true;
}

async function loadApiServices() {
    try {
        const data = await apiRequest("/api/services");
        apiServices = data.services || [];
    } catch (error) {
        console.error("Gagal mengambil layanan dari API:", error);
    }
}

function getSelectedServiceId() {
    const found = apiServices.find(item => item.name === selectedService.name);
    return found ? Number(found.id) : null;
}

function formatRupiah(value) {
    return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

let selectedPackage = {
    name: "Paket 1",
    workers: 1,
    days: 1,
    price: 150000
};


/* =========================
   HEADER
========================= */

function header(loggedIn = false) {

return `
<header>

<div class="logo">📁 ArsipGo</div>

<nav>
<a href="#" onclick="home()">Beranda</a>
<a href="#" onclick="services()">Layanan</a>
<a href="#" onclick="about()">Tentang Kami</a>
<a href="#" onclick="contact()">Kontak</a>
</nav>

<div>

${loggedIn

? `<button class="btn btn-primary" onclick="dashboard()">Dashboard</button>`

: `<button class="btn btn-outline" onclick="login()">Masuk</button>
   <button class="btn btn-primary" onclick="register()">Daftar</button>`
}

</div>

</header>
`;
}


/* =========================
   HOME
========================= */

function home() {

document.getElementById("app").innerHTML = `

${header()}

<section class="hero">

<div class="container hero-content">

<div>

<div class="badge">
📁 Jasa tenaga kearsipan fleksibel
</div>

<h1>
Solusi tenaga kearsipan saat arsip
<span>mulai overload.</span>
</h1>

<p>
ArsipGo menyediakan tenaga bantuan kearsipan
untuk membantu instansi, museum, perusahaan,
organisasi, dan mahasiswa ketika volume arsip
meningkat dan pekerjaan mulai menumpuk.
</p>

<div class="hero-buttons">

<button class="btn btn-primary"
onclick="login()">
Pesan Layanan →
</button>

<button class="btn btn-outline"
onclick="about()">
Pelajari Lebih Lanjut
</button>

</div>

</div>


<div class="hero-image">
📚
</div>

</div>

</section>


<section>

<div class="container">

<div class="section-title">

<h2>
Siapa yang bisa menggunakan ArsipGo?
</h2>

<p>
Bantuan kearsipan untuk berbagai kebutuhan.
</p>

</div>


<div class="cards">

${audienceCard("🎓","Mahasiswa","Arsip tugas, penelitian, organisasi")}

${audienceCard("🏛️","Instansi Pemerintah","Volume dokumen yang besar")}

${audienceCard("🏢","Perusahaan","Membantu mengatasi backlog")}

${audienceCard("🏛","Museum","Arsip dan dokumentasi koleksi")}

${audienceCard("🤝","Organisasi","Dokumen kegiatan dan program")}

</div>

</div>

</section>


<section style="background:white">

<div class="container">

<div class="section-title">

<h2>
Layanan ArsipGo
</h2>

<p>
Pilih layanan sesuai kebutuhan arsipmu.
</p>

</div>


<div class="cards">

${serviceCard("📑","Pemilahan Arsip",
"Memilah arsip berdasarkan jenis atau kategori.",
"Mulai Rp5.000/dokumen")}

${serviceCard("🗂️","Pengelompokan Arsip",
"Mengelompokkan arsip secara sistematis.",
"Mulai Rp5.000/dokumen")}

${serviceCard("📚","Penataan Arsip",
"Menata arsip agar mudah ditemukan kembali.",
"Mulai Rp5.000/dokumen")}

${serviceCard("💻","Pengelolaan Arsip Digital",
"Membantu mengelola dan menata arsip digital.",
"Mulai Rp50.000/hari")}

${serviceCard("📁","Penamaan File & Folder",
"Menyeragamkan nama file dan struktur folder.",
"Mulai Rp5.000/dokumen")}

${serviceCard("📦","Paket Lengkap",
"Layanan kearsipan menyeluruh dari pemilahan hingga penataan.",
"Mulai Rp200.000/paket")}

${serviceCard("🛠️","Layanan Custom",
"Kustomisasi layanan kearsipan sesuai kebutuhan spesifik Anda.",
"Harga menyesuaikan")}

</div>

</div>

</section>


<footer>

<div class="container">

<strong>📁 ArsipGo</strong>

<p style="margin-top:10px">
Solusi tenaga kearsipan saat arsip mulai overload.
</p>

</div>

</footer>
`;
}


function audienceCard(icon,title,text) {

return `

<div class="card" style="text-align:center">

<div class="icon" style="margin:auto auto 15px">
${icon}
</div>

<h3>${title}</h3>

<p>${text}</p>

</div>
`;
}


function serviceCard(icon,title,text,price) {

return `

<div class="card"
onclick="openService('${title}')"
style="cursor:pointer">

<div class="icon">
${icon}
</div>

<h3>${title}</h3>

<p>${text}</p>

<div class="price">
${price}
</div>

</div>
`;
}


/* =========================
   LOGIN
========================= */

function login() {

document.getElementById("app").innerHTML = `

${header()}

<div class="auth">

<div class="auth-box">

<div class="logo" style="text-align:center">
📁 ArsipGo
</div>

<h2>Masuk ke Akun</h2>

<p>
Kelola kebutuhan kearsipanmu bersama ArsipGo.
</p>


<div class="form-group">

<label>
Email
</label>

<input
id="loginEmail"
placeholder="contoh@email.com / 08xxxxxxxxxx"
>

</div>


<div class="form-group">

<label>
Password
</label>

<input
type="password"
id="loginPassword"
placeholder="Masukkan password"
>

</div>


<button
class="btn btn-primary"
onclick="doLogin()">

Masuk

</button>


<div class="switch">

Belum punya akun?

<a onclick="register()">
Daftar di sini
</a>

</div>

</div>

</div>
`;
}



async function doLogin() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Masukkan email dan password.");
        return;
    }

    try {
        const data = await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        // Simpan sesi login dari backend
        saveSession(data);

        // Periksa role akun dari respons backend
        const role = data.user?.role;

        if (role === "admin") {
        window.location.href = "/admin.html";
            return;
        }

        if (role === "user") {
            await loadApiServices();
            dashboard();
            return;
        }

        alert("Role akun tidak dikenali. Silakan periksa data akun.");
    } catch (error) {
        alert(error.message);
    }
}


/* =========================
   REGISTER
========================= */

function register() {

document.getElementById("app").innerHTML = `

${header()}

<div class="auth">

<div class="auth-box">

<div class="logo" style="text-align:center">
📁 ArsipGo
</div>

<h2>Buat Akun ArsipGo</h2>

<p>
Daftar untuk menggunakan layanan ArsipGo.
</p>


<div class="form-group">

<label>
Nama Lengkap
</label>

<input
id="registerName"
placeholder="Masukkan nama lengkap"
>

</div>


<div class="form-group">

<label>
Email
</label>

<input
id="registerEmail"
type="email"
placeholder="contoh@email.com"
>

</div>


<div class="form-group">

<label>
Nomor WhatsApp
</label>

<input
id="registerWhatsapp"
placeholder="08xxxxxxxxxx"
>

</div>


<div class="form-group">

<label>
Password
</label>

<input
type="password"
id="registerPassword"
placeholder="Minimal 8 karakter"
>

</div>


<button
class="btn btn-primary"
onclick="doRegister()">

Daftar

</button>


<div class="switch">

Sudah punya akun?

<a onclick="login()">
Masuk di sini
</a>

</div>

</div>

</div>
`;
}


async function doRegister() {
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const whatsapp = document.getElementById("registerWhatsapp").value.trim();
    const password = document.getElementById("registerPassword").value;
    if (!name || !email || !password) {
        alert("Nama, email, dan password wajib diisi.");
        return;
    }
    try {
        const data = await apiRequest("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, whatsapp, password })
        });
        saveSession(data);
        await loadApiServices();
        alert("Pendaftaran berhasil. Kamu sudah masuk ke ArsipGo.");
        dashboard();
    } catch (error) {
        alert(error.message);
    }
}


/* =========================
   DASHBOARD
========================= */

function dashboard() {

document.getElementById("app").innerHTML = `

${header(true)}

<div class="dashboard">


<aside class="sidebar">

<div class="sidebar-user">

<strong>
👤 ${userName}
</strong>

<small>
Pengguna
</small>

</div>


<a class="menu active">
⌂ Beranda
</a>

<a class="menu"
onclick="services()">
▣ Pesan Layanan
</a>

<a class="menu"
onclick="tracking()">
◷ Pesanan Saya
</a>

<a class="menu"
onclick="about()">
♡ Profil
</a>

<a class="menu"
onclick="logout()"
style="margin-top:30px">
↪ Keluar
</a>

</aside>


<main class="dashboard-main">


<div class="greeting">

<div>

<h1>
Halo, ${userName}! 👋
</h1>

<p>
Butuh bantuan kearsipan? Kami siap membantu.
</p>

</div>

<button
class="btn btn-primary"
onclick="services()">

Pesan Layanan

</button>

</div>


<div class="quick">


<div class="card"
onclick="services()">

<div class="icon">
📁
</div>

<h3>
Lihat Katalog Layanan
</h3>

<p>
Pilih jenis bantuan kearsipan.
</p>

</div>


<div class="card"
onclick="contact()">

<div class="icon">
💬
</div>

<h3>
Hubungi WhatsApp
</h3>

<p>
Konsultasikan kebutuhanmu.
</p>

</div>


<div class="card"
onclick="tracking()">

<div class="icon">
📋
</div>

<h3>
Cek Status Pesanan
</h3>

<p>
Lihat progres pekerjaan.
</p>

</div>

</div>


<div class="card">

<h3>
Pesanan Terbaru
</h3>

<div style="
padding:35px;
text-align:center;
color:#71817b;
">

Belum ada pesanan.

<br><br>

<button
class="btn btn-primary"
onclick="services()">

Mulai Pesan Layanan

</button>

</div>

</div>


</main>

</div>

`;
}


/* =========================
   SERVICES
========================= */

function services() {

document.getElementById("app").innerHTML = `

${header(true)}

<section class="page">

<div class="container">

<a
class="back"
onclick="dashboard()">

← Kembali ke Dashboard

</a>


<div class="section-title">

<h2>
Katalog Layanan
</h2>

<p>
Pilih layanan yang sesuai dengan kebutuhan arsipmu.
</p>

</div>


<div class="cards">

${serviceCard("📑","Pemilahan Arsip",
"Memilah arsip berdasarkan jenis atau kategori.",
"Mulai Rp5.000/dokumen")}

${serviceCard("🗂️","Pengelompokan Arsip",
"Mengelompokkan arsip secara sistematis.",
"Mulai Rp5.000/dokumen")}

${serviceCard("📚","Penataan Arsip",
"Menata arsip agar mudah ditemukan kembali.",
"Mulai Rp5.000/dokumen")}

${serviceCard("💻","Pengelolaan Arsip Digital",
"Membantu mengelola dan menata arsip digital.",
"Mulai Rp50.000/hari")}

${serviceCard("📁","Penamaan File & Folder",
"Menyeragamkan nama file dan struktur folder.",
"Mulai Rp5.000/dokumen")}

${serviceCard("📦","Paket Lengkap",
"Layanan kearsipan menyeluruh dari pemilahan hingga penataan.",
"Mulai Rp200.000/paket")}

${serviceCard("🛠️","Layanan Custom",
"Kustomisasi layanan kearsipan sesuai kebutuhan spesifik Anda.",
"Harga menyesuaikan")}

</div>

</div>

</section>
`;
}


/* =========================
   DETAIL SERVICE
========================= */

function openService(name) {

let icons = {
"Pemilahan Arsip":"📑",
"Pengelompokan Arsip":"🗂️",
"Penataan Arsip":"📚",
"Pengelolaan Arsip Digital":"💻",
"Penamaan File & Folder":"📁",
"Paket Lengkap":"📦",
"Layanan Custom":"🛠️"
};

let descriptions = {
"Pemilahan Arsip":"ArsipGo membantu memilah arsip berdasarkan jenis, kategori, tahun, atau kebutuhan pengguna.",
"Pengelompokan Arsip":"Membantu mengelompokkan dokumen dan arsip secara sistematis dan rapi.",
"Penataan Arsip":"Menata fisik maupun metadata arsip agar mudah ditemukan kembali saat dibutuhkan.",
"Pengelolaan Arsip Digital":"Membantu digitalisasi dan pengelolaan arsip berbasis sistem digital.",
"Penamaan File & Folder":"Menyeragamkan struktur nama file dan folder agar teratur dan efisien.",
"Paket Lengkap":"Solusi menyeluruh dari pemilahan, pengelompokan, hingga penataan arsip secara menyeluruh.",
"Layanan Custom":"Sesuaikan kebutuhan kearsipan Anda secara khusus mulai dari jumlah tenaga, durasi, hingga cakupan tugas."
};

let pricingTypes = {
"Pemilahan Arsip": "document",
"Pengelompokan Arsip": "document",
"Penataan Arsip": "document",
"Penamaan File & Folder": "document",
"Pengelolaan Arsip Digital": "day",
"Paket Lengkap": "package",
"Layanan Custom": "custom"
};

selectedService = {

name: name,
icon: icons[name] || "📁",
pricingType: pricingTypes[name] || "document",
pricePerUnit: pricingTypes[name] === "document" ? 5000 : (pricingTypes[name] === "package" ? 200000 : 50000),
description: descriptions[name] || "ArsipGo membantu menyelesaikan pekerjaan kearsipan sesuai volume dan kebutuhan pengguna."

};

document.getElementById("app").innerHTML = `

${header(true)}

<section class="page">

<div class="container">

<a
class="back"
onclick="services()">

← Kembali ke Layanan

</a>


<div class="detail">


<div>

<div class="detail-main">

<div style="font-size:45px">
${selectedService.icon}
</div>

<h1>
${selectedService.name}
</h1>

<p>
${selectedService.description}
</p>

<div class="price">
${name === 'Layanan Custom' ? 'Harga Menyesuaikan' : (name === 'Paket Lengkap' ? 'Mulai dari Rp200.000/paket' : (name === 'Pengelolaan Arsip Digital' ? 'Mulai dari Rp50.000/hari' : 'Mulai dari Rp5.000/dokumen'))}
</div>

</div>


<div class="card" style="margin-top:20px">

<h3>
Apa yang didapatkan?
</h3>

<br>

<p>✓ Tenaga yang memahami pekerjaan kearsipan</p>

<p>✓ Pekerjaan disesuaikan dengan volume arsip</p>

<p>✓ Durasi bantuan fleksibel</p>

<p>✓ Cocok untuk kebutuhan sementara maupun khusus</p>

</div>

</div>


<div class="card">

<h3>
Siap mulai?
</h3>

<p style="margin:15px 0">

Ceritakan kebutuhan arsipmu,
kemudian ArsipGo akan menyesuaikan
jumlah tenaga dan durasinya.

</p>

<button
class="btn btn-primary"
style="width:100%"
onclick="booking()">

Pesan Sekarang →

</button>

<br><br>

<button
class="btn btn-outline"
style="width:100%"
onclick="contact()">

Konsultasi

</button>

</div>


</div>

</div>

</section>
`;
}


/* =========================
   BOOKING
========================= */

function booking() {

if (!requireLogin()) return;
document.getElementById("app").innerHTML = `

${header(true)}

<section class="page">

<div class="container">

<div class="booking">


<div class="card">

<h2>
Form Pemesanan
</h2>

<br>


<div class="form-group">

<label>
Jenis Pengguna
</label>

<select id="bookingUserType">

<option>Mahasiswa</option>

<option>
Instansi Pemerintah
</option>

<option>
Perusahaan Swasta
</option>

<option>
Museum
</option>

<option>
Organisasi
</option>

</select>

</div>


<div class="form-group">

<label>
Deskripsi Kebutuhan
</label>

<textarea
id="bookingDescription"
rows="5"
placeholder="Contoh: Saya memiliki 10 dokumen yang perlu dipilah dan dikelompokkan..."
></textarea>

</div>


<div class="form-group">

<label>
Jumlah Volume Arsip (Dokumen)
</label>

<input
type="number"
id="inputDocCount"
value="${documentCount}"
min="1"
placeholder="Contoh: 10"
>

</div>


<div class="form-group">

<label>
Tanggal Mulai
</label>

<input type="date" id="bookingStartDate">

</div>


<button
class="btn btn-primary"
style="width:100%"
onclick="submitBookingForm()">

Lanjut Pilih Paket →

</button>

</div>


<div class="card">

<h3>
Layanan Dipilih
</h3>

<br>

<div style="
background:#edf7ef;
padding:20px;
border-radius:12px;
">

<div style="font-size:30px">
${selectedService.icon}
</div>

<strong>
${selectedService.name}
</strong>

<p style="margin-top:8px">
${selectedService.description}
</p>

</div>

</div>


</div>

</div>

</section>
`;
}

function submitBookingForm() {
    const val = parseInt(document.getElementById("inputDocCount").value, 10);
    const userType = document.getElementById("bookingUserType").value;
    const description = document.getElementById("bookingDescription").value.trim();
    const startDate = document.getElementById("bookingStartDate").value;
    if (!description) {
        alert("Deskripsi kebutuhan wajib diisi.");
        return;
    }
    if (!Number.isInteger(val) || val < 1) {
        alert("Jumlah dokumen minimal 1.");
        return;
    }
    documentCount = val;
    bookingDraft = { userType, description, startDate, documentCount: val };
    packages();
}


/* =========================
   PACKAGE
========================= */

function packages() {

document.getElementById("app").innerHTML = `

${header(true)}

<section class="page">

<div class="container">

<div class="booking">


<div class="card">

<h2>
Pilih Paket Tenaga
</h2>

<br>


<div
class="package ${selectedPackage.name === 'Paket 1' ? 'selected' : ''}"
onclick="choosePackage('Paket 1',150000,1,1)">

<strong>
Paket 1
</strong>

<h3>
Rp150.000
</h3>

<p>
1 tenaga × 1 hari
</p>

</div>


<div
class="package ${selectedPackage.name === 'Paket 2' ? 'selected' : ''}"
onclick="choosePackage('Paket 2',400000,2,3)">

<strong>
Paket 2 ⭐
</strong>

<h3>
Rp400.000
</h3>

<p>
2 tenaga × 3 hari
</p>

</div>


<div
class="package ${selectedPackage.name === 'Paket Custom' ? 'selected' : ''}"
onclick="choosePackage('Paket Custom',0,'Custom','Custom')">

<strong>
Paket Custom
</strong>

<h3>
Harga menyesuaikan
</h3>

<p>
Jumlah tenaga dan durasi disesuaikan.
</p>

</div>


<button
class="btn btn-primary"
style="width:100%"
onclick="payment()">

Lanjut Pembayaran →

</button>

</div>


<div class="card">

<h3>
Ringkasan Pesanan
</h3>

<br>

<p>
Layanan:
<strong>
${selectedService.name}
</strong>
</p>

<br>

${selectedService.pricingType === 'document' 
? `<p>Jumlah Dokumen: <strong>${documentCount} dokumen</strong> (Rp${(documentCount * 5000).toLocaleString("id-ID")})</p><p style="font-size:12px; color:#71817b;">(Rp5.000 / dokumen)</p><br>`
: ''
}

<p>
Paket Tenaga:
<strong>
${selectedPackage.name} ${selectedPackage.price ? '(Rp' + selectedPackage.price.toLocaleString("id-ID") + ')' : ''}
</strong>
</p>

<br>

<p>
Tenaga:
<strong>
${selectedPackage.workers}
</strong>
</p>

<br>

<p>
Durasi:
<strong>
${selectedPackage.days} ${selectedPackage.days === 'Custom' ? '' : 'hari'}
</strong>
</p>

<br>

<hr>

<br>

<h2 style="color:#086b58">
${calculateTotalPriceText()}
</h2>

</div>

</div>

</div>

</section>
`;
}


function choosePackage(name,price,workers,days) {

selectedPackage = {
name,
price,
workers,
days
};

packages();

}

function calculateTotalPriceText() {
    if (selectedPackage.name === 'Paket Custom' ||
        selectedService.pricingType === 'custom') {
        return "Custom";
    }

    if (selectedService.pricingType === 'document') {
        let docTotal = documentCount * 5000;
        let packageTotal = selectedPackage.price || 0;
        let grandTotal = docTotal + packageTotal;
        return "Rp" + grandTotal.toLocaleString("id-ID");
    } else if (selectedService.name === 'Paket Lengkap') {
        let grandTotal = 200000 + (selectedPackage.price || 0);
        return "Rp" + grandTotal.toLocaleString("id-ID");
    } else if (selectedPackage.price) {
        return "Rp" + selectedPackage.price.toLocaleString("id-ID");
    } else {
        return "Custom";
    }
}


/* =========================
   PAYMENT
========================= */


function payment() {
    const price = calculateTotalPriceText();
    const docTotal = documentCount * 5000;
    const isCustom = price === "Custom";

    document.getElementById("app").innerHTML = `
        ${header(true)}

        <section class="page">
            <div class="container">
                <div class="booking">
                    <div class="card">
                        <h2>Konfirmasi Pesanan</h2>
                        <br>

                        <p>
                            Periksa ringkasan pesanan sebelum membuat pesanan.
                        </p>

                        <br>

                        <div class="form-group">
                            <label for="paymentWhatsapp">
                                Nomor WhatsApp
                            </label>
                            <input
                                id="paymentWhatsapp"
                                type="tel"
                                placeholder="08xxxxxxxxxx"
                                required
                            >
                            <small>
                                Nomor ini belum disimpan ke database.
                            </small>
                        </div>

                        <button
                            id="submitBookingButton"
                            class="btn btn-primary"
                            style="width:100%"
                            onclick="success()">
                            ${isCustom
                                ? "Kirim Pesanan"
                                : "Buat Pesanan (" + price + ")"}
                        </button>

                        <p style="margin-top:12px;font-size:13px;color:#71817b;">
                            ${isCustom
                                ? "Harga untuk pesanan custom ditetapkan admin. Kamu bisa membayar setelah harga ditetapkan."
                                : "Setelah pesanan dibuat, kamu memilih metode pembayaran dan mengunggah bukti transfer."}
                        </p>
                    </div>

                    <div class="card">
                        <h3>Ringkasan Pesanan</h3>
                        <br>

                        <p>Layanan:<br>
                            <strong>${selectedService.name}</strong>
                        </p>
                        <br>

                        ${selectedService.pricingType === "document"
                            ? `<p>Jumlah Dokumen:<br>
                                <strong>${documentCount} dokumen</strong>
                                (${formatRupiah(docTotal)})</p><br>`
                            : ""}

                        <p>Paket Tenaga:<br>
                            <strong>${selectedPackage.name}</strong>
                        </p>
                        <br>

                        <p>Jumlah Tenaga:
                            <strong>${selectedPackage.workers}</strong>
                        </p>
                        <br>

                        <p>Durasi:
                            <strong>${selectedPackage.days}
                            ${selectedPackage.days === "Custom" ? "" : "hari"}</strong>
                        </p>
                        <br>

                        <hr style="margin:20px 0;">

                        <p style="font-size:12px;color:#71817b;">
                            ${isCustom ? "Harga" : "Total"}
                        </p>
                        <h2 style="color:#086b58">${price}</h2>
                    </div>
                </div>
            </div>
        </section>
    `;
}


/* =========================
   SUCCESS
========================= */


async function success() {
    if (!requireLogin()) return;

    const whatsappInput = document.getElementById("paymentWhatsapp");
    const whatsapp = whatsappInput?.value.trim() || "";

    const normalizedWhatsapp = whatsapp.replace(/[\s-]/g, "");

    if (!/^08[0-9]{8,11}$/.test(normalizedWhatsapp)) {
        alert("Masukkan nomor WhatsApp dengan format 08xxxxxxxxxx.");
        return;
    }

    const button = document.getElementById("submitBookingButton");
    const buttonLabel = button ? button.textContent : "";

    if (button) {
        button.disabled = true;
        button.textContent = "Menyimpan pesanan...";
    }

    try {
        if (!getSelectedServiceId()) {
            await loadApiServices();
        }

        const serviceId = getSelectedServiceId();

        if (!serviceId) {
            throw new Error("Layanan belum berhasil dimuat dari server.");
        }

        const payload = {
            service_id: serviceId,
            user_type: bookingDraft.userType || "Mahasiswa",
            description:
                bookingDraft.description ||
                "Pemesanan layanan " + selectedService.name,
            document_count:
                selectedService.pricingType === "document"
                    ? Number(bookingDraft.documentCount || documentCount)
                    : null,
            start_date: bookingDraft.startDate || null,
            package_name: selectedPackage.name,
            workers: Number.isInteger(selectedPackage.workers)
                ? selectedPackage.workers
                : null,
            duration_days: Number.isInteger(selectedPackage.days)
                ? selectedPackage.days
                : null
        };

        const data = await apiRequest("/api/bookings", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        lastBooking = data.booking;

        const canPayNow =
            lastBooking.amount != null && Number(lastBooking.amount) > 0;

        document.getElementById("app").innerHTML = `
            ${header(true)}

            <section class="success">
                <div class="success-icon">✓</div>
                <h1>Pesanan Berhasil Dibuat!</h1>

                <p>Nomor pesanan:
                    <strong>#${lastBooking.id}</strong>
                </p>

                <p>Total:
                    <strong>${canPayNow
                        ? formatRupiah(lastBooking.amount)
                        : "Menunggu penetapan admin"}</strong>
                </p>

                <p style="margin:15px 0;">
                    ${canPayNow
                        ? "Pilih metode pembayaran, lalu unggah bukti pembayaranmu agar pesanan segera diproses."
                        : "Harga pesanan ini ditetapkan admin. Kamu bisa membayar setelah harga ditetapkan."}
                </p>

                ${canPayNow
                    ? `<button
                        class="btn btn-primary"
                        onclick="payBooking(${Number(lastBooking.id)})">
                        Bayar Sekarang
                       </button>
                       <br><br>`
                    : ""}

                <button
                    class="btn ${canPayNow ? "btn-outline" : "btn-primary"}"
                    onclick="tracking()">
                    ${canPayNow ? "Bayar Nanti" : "Lihat Status Pesanan"}
                </button>
            </section>
        `;
    } catch (error) {
        alert(error.message);

        if (button) {
            button.disabled = false;
            button.textContent = buttonLabel;
        }
    }
}

/* =========================
   PEMBAYARAN MANUAL
========================= */

const PAYMENT_LABELS = {
    unpaid: "Belum dibayar",
    pending: "Belum selesai",
    menunggu_verifikasi: "Menunggu verifikasi admin",
    paid: "Lunas",
    ditolak: "Ditolak",
    expired: "Kedaluwarsa",
    cancelled: "Dibatalkan",
    failed: "Gagal"
};

const METHOD_LABELS = {
    qris: "QRIS",
    ewallet: "E-wallet",
    bank: "Transfer bank"
};

let paymentContext = null;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

// Membuka halaman pembayaran untuk satu pesanan
async function payBooking(bookingId) {
    if (!requireLogin()) return;

    try {
        const [bookingData, infoData] = await Promise.all([
            apiRequest(`/api/bookings/${Number(bookingId)}`),
            apiRequest("/api/payments/info")
        ]);

        paymentContext = {
            booking: bookingData.booking,
            info: infoData.payment_info,
            method: "qris"
        };

        renderPaymentPage();
    } catch (error) {
        alert(error.message);
    }
}

function renderPaymentPage() {
    const booking = paymentContext.booking;

    document.getElementById("app").innerHTML = `
        ${header(true)}

        <section class="page">
            <div class="container">
                <a class="back" onclick="tracking()">
                    ← Kembali ke Pesanan Saya
                </a>

                <div class="booking">
                    <div class="card">
                        <h2>Pembayaran Pesanan #${Number(booking.id)}</h2>
                        <br>

                        ${booking.payment_status === "ditolak" && booking.payment_reject_reason
                            ? `<p style="color:#b42318">
                                <strong>Bukti sebelumnya ditolak:</strong>
                                ${escapeHtml(booking.payment_reject_reason)}
                               </p><br>`
                            : ""}

                        <p>Pilih metode pembayaran:</p>
                        <br>

                        <div style="display:flex;gap:10px;flex-wrap:wrap">
                            ${Object.keys(METHOD_LABELS).map(key => `
                                <button
                                    id="payBtn-${key}"
                                    class="btn btn-outline"
                                    onclick="showPayMethod('${key}')">
                                    ${METHOD_LABELS[key]}
                                </button>
                            `).join("")}
                        </div>

                        <br>
                        <div id="payMethodDetail"></div>
                        <br>

                        <div class="form-group">
                            <label for="proofFile">
                                Bukti pembayaran (JPG, PNG, atau WEBP, maks. 3 MB)
                            </label>
                            <input
                                type="file"
                                id="proofFile"
                                accept="image/jpeg,image/png,image/webp">
                        </div>

                        <button
                            id="submitProofButton"
                            class="btn btn-primary"
                            style="width:100%"
                            onclick="submitPaymentProof()">
                            Kirim Bukti Pembayaran
                        </button>

                        <p style="margin-top:12px;font-size:13px;color:#71817b;">
                            Admin akan mencocokkan pembayaranmu dengan mutasi
                            yang masuk, lalu menyetujuinya.
                        </p>
                    </div>

                    <div class="card">
                        <h3>Ringkasan Pesanan</h3>
                        <br>

                        <p>Layanan:<br>
                            <strong>${escapeHtml(booking.service_name)}</strong>
                        </p>
                        <br>

                        <p>Paket:<br>
                            <strong>${escapeHtml(booking.package_name)}</strong>
                        </p>
                        <br>

                        <hr style="margin:20px 0;">

                        <p style="font-size:12px;color:#71817b;">
                            Total yang harus dibayar
                        </p>
                        <h2 style="color:#086b58">
                            ${formatRupiah(booking.amount)}
                        </h2>
                    </div>
                </div>
            </div>
        </section>
    `;

    showPayMethod(paymentContext.method);
}

// Menampilkan tujuan pembayaran sesuai metode yang dipilih
function showPayMethod(method) {
    if (!paymentContext) return;

    paymentContext.method = method;

    Object.keys(METHOD_LABELS).forEach(key => {
        const button = document.getElementById("payBtn-" + key);
        if (button) {
            button.className =
                key === method ? "btn btn-primary" : "btn btn-outline";
        }
    });

    const info = paymentContext.info;
    const amountText = formatRupiah(paymentContext.booking.amount);
    let html = "";

    const rows = list => list.map(item => `
        <div style="background:#edf7ef;padding:14px;border-radius:12px;margin-bottom:10px">
            <strong>${escapeHtml(item.name)}</strong><br>
            ${escapeHtml(item.number)}<br>
            <small>a.n. ${escapeHtml(item.holder)}</small>
        </div>
    `).join("");

    if (method === "qris") {
        html = `
            <p>${escapeHtml(info.qris.note)}</p>
            <br>
            <img
                src="${API_BASE}${escapeHtml(info.qris.image)}"
                alt="Kode QRIS"
                style="max-width:280px;width:100%;border-radius:12px;border:1px solid #dce7e1">
        `;
    } else if (method === "ewallet") {
        html = `<p>Transfer ke salah satu e-wallet berikut:</p><br>${rows(info.ewallets)}`;
    } else {
        html = `<p>Transfer ke salah satu rekening berikut:</p><br>${rows(info.banks)}`;
    }

    document.getElementById("payMethodDetail").innerHTML = `
        <p style="margin-bottom:12px">
            Nominal yang harus dibayar: <strong>${amountText}</strong>
        </p>
        ${html}
    `;
}

// Mengunggah bukti pembayaran
async function submitPaymentProof() {
    if (!requireLogin() || !paymentContext) return;

    const input = document.getElementById("proofFile");
    const file = input && input.files ? input.files[0] : null;

    if (!file) {
        alert("Pilih file bukti pembayaran terlebih dahulu.");
        return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Bukti pembayaran harus berupa gambar JPG, PNG, atau WEBP.");
        return;
    }

    if (file.size > 3 * 1024 * 1024) {
        alert("Ukuran file maksimal 3 MB.");
        return;
    }

    const button = document.getElementById("submitProofButton");

    if (button) {
        button.disabled = true;
        button.textContent = "Mengirim...";
    }

    try {
        const formData = new FormData();
        formData.append("payment_method", paymentContext.method);
        formData.append("proof", file);

        const response = await fetch(
            `${API_BASE}/api/payments/proof/${Number(paymentContext.booking.id)}`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken}` },
                body: formData
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || `Permintaan gagal (${response.status})`);
        }

        alert(data.message || "Bukti pembayaran terkirim.");
        paymentContext = null;
        tracking();
    } catch (error) {
        alert(error.message);

        if (button) {
            button.disabled = false;
            button.textContent = "Kirim Bukti Pembayaran";
        }
    }
}

// Melihat bukti pembayaran milik sendiri
async function viewPaymentProof(bookingId) {
    if (!requireLogin()) return;

    const win = window.open("about:blank", "_blank");

    try {
        const response = await fetch(
            `${API_BASE}/api/payments/proof/${Number(bookingId)}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Bukti pembayaran tidak ditemukan.");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (win) {
            win.location.href = url;
        } else {
            window.location.href = url;
        }
    } catch (error) {
        if (win) win.close();
        alert(error.message);
    }
}

async function tracking() {
    if (!requireLogin()) return;

    document.getElementById("app").innerHTML = `
        ${header(true)}
        <section class="page">
            <div class="container">
                <p>Memuat pesanan...</p>
            </div>
        </section>
    `;

    try {
        const data = await apiRequest("/api/bookings/mine");
        const bookings = data.bookings || [];

        document.getElementById("app").innerHTML = `
            ${header(true)}

            <section class="page">
                <div class="container">
                    <a class="back" onclick="dashboard()">
                        ← Kembali ke Dashboard
                    </a>

                    <div class="section-title">
                        <h2>Pesanan Saya</h2>
                        <p>
                            Pantau status pesanan dan pembayaran ArsipGo.
                        </p>
                    </div>

                    ${bookings.length
                        ? `<div class="cards">
                            ${bookings.map(b => {
                                const paymentStatus =
                                    b.payment_status || "unpaid";

                                const hasAmount =
                                    b.amount != null && Number(b.amount) > 0;

                                const amount = hasAmount
                                    ? formatRupiah(b.amount)
                                    : "Menunggu penetapan admin";

                                const canPay =
                                    b.status !== "dibatalkan" &&
                                    hasAmount &&
                                    ["unpaid", "pending", "ditolak"].includes(paymentStatus);

                                return `
                                    <div class="card">
                                        <h3>${escapeHtml(b.service_name)}</h3>

                                        <p>Nomor pesanan:
                                            <strong>#${Number(b.id)}</strong>
                                        </p>

                                        <p>Paket: ${escapeHtml(b.package_name)}</p>

                                        <p>Status pesanan:
                                            <strong>${escapeHtml(b.status)}</strong>
                                        </p>

                                        <p>Status pembayaran:
                                            <strong>${escapeHtml(PAYMENT_LABELS[paymentStatus] || paymentStatus)}</strong>
                                        </p>

                                        ${b.payment_method
                                            ? `<p>Metode:
                                                <strong>${escapeHtml(METHOD_LABELS[b.payment_method] || b.payment_method)}</strong>
                                               </p>`
                                            : ""}

                                        <p>Total:
                                            <strong>${amount}</strong>
                                        </p>

                                        <p>${escapeHtml(b.description || "")}</p>

                                        <p style="font-size:12px;color:#71817b">
                                            Dibuat:
                                            ${new Date(b.created_at).toLocaleString("id-ID")}
                                        </p>

                                        ${canPay
                                            ? `<button
                                                class="btn btn-primary"
                                                onclick="payBooking(${Number(b.id)})">
                                                ${paymentStatus === "ditolak"
                                                    ? "Kirim Ulang Bukti Bayar"
                                                    : "Bayar Sekarang"}
                                               </button>`
                                            : ""}

                                        ${paymentStatus === "menunggu_verifikasi"
                                            ? `<p style="margin-top:12px;color:#71817b">
                                                Bukti pembayaran sedang diperiksa admin.
                                               </p>
                                               <button
                                                class="btn btn-outline"
                                                style="margin-top:8px"
                                                onclick="viewPaymentProof(${Number(b.id)})">
                                                Lihat Bukti
                                               </button>`
                                            : ""}

                                        ${paymentStatus === "ditolak" && b.payment_reject_reason
                                            ? `<p style="margin-top:12px;color:#b42318">
                                                Ditolak: ${escapeHtml(b.payment_reject_reason)}
                                               </p>`
                                            : ""}

                                        ${!hasAmount && b.status !== "dibatalkan"
                                            ? `<p style="margin-top:12px;color:#71817b">
                                                Menunggu admin menetapkan harga sebelum pembayaran.
                                               </p>`
                                            : ""}

                                        ${paymentStatus === "paid"
                                            ? `<p style="margin-top:12px">
                                                Pembayaran berhasil diterima.
                                               </p>`
                                            : ""}
                                    </div>
                                `;
                            }).join("")}
                        </div>`
                        : `<div class="card">
                            <p>Belum ada pesanan di akun ini.</p>
                            <br>
                            <button
                                class="btn btn-primary"
                                onclick="services()">
                                Pesan Layanan
                            </button>
                        </div>`
                    }
                </div>
            </section>
        `;
    } catch (error) {
        alert(error.message);
        dashboard();
    }
}

function timeline(icon,title,text) {

return `

<div class="timeline-item">

<div class="dot">
${icon}
</div>

<div>

<h4>
${title}
</h4>

<p>
${text}
</p>

</div>

</div>
`;
}


function logout() {
    clearSession();
    userName = "Ayu";
    home();
}

/* =========================
   ABOUT
========================= */

function about() {

document.getElementById("app").innerHTML = `

${header(true)}

<section class="page">

<div class="container">

<div class="detail-main">

<div class="badge">
Tentang ArsipGo
</div>

<h1>
Tenaga tambahan khusus kearsipan.
</h1>

<p>
ArsipGo hadir ketika volume arsip meningkat
dan tenaga internal terbatas.

Pengguna dapat memesan bantuan berdasarkan
volume pekerjaan, jumlah tenaga, dan durasi
yang dibutuhkan.
</p>

</div>

<br><br>

<div class="cards">

<div class="card">

<div class="icon">
👥
</div>

<h3>
Profesional
</h3>

<p>
Tenaga yang memahami dasar pekerjaan kearsipan.
</p>

</div>


<div class="card">

<div class="icon">
⚙️
</div>

<h3>
Fleksibel
</h3>

<p>
Jumlah tenaga dan durasi dapat disesuaikan.
</p>

</div>


<div class="card">

<div class="icon">
❤️
</div>

<h3>
Terpercaya
</h3>

<p>
Fokus pada kualitas dan ketepatan waktu.
</p>

</div>

</div>

</div>

</section>
`;
}


/* =========================
   CONTACT
========================= */

function contact() {
    // Ganti nomor berikut dengan nomor WhatsApp admin, format internasional tanpa + atau spasi.
    const nomorWhatsApp = "62881036195969";

    if (nomorWhatsApp.includes("x")) {
        alert("Ganti nomorWhatsApp di fungsi contact() dengan nomor WhatsApp admin ArsipGo terlebih dahulu.");
        return;
    }

    const pesan = "Halo Admin ArsipGo, saya ingin berkonsultasi mengenai layanan kearsipan.";
    const urlWhatsApp = "https://wa.me/" + nomorWhatsApp + "?text=" + encodeURIComponent(pesan);

    window.open(urlWhatsApp, "_blank");
}


/* =========================
   START
========================= */

if (currentUser) userName = currentUser.name;
loadApiServices();
home();
