const API = ["5500", "5501"].includes(window.location.port)
  ? "http://localhost:3000/api"
  : "/api";
const $ = (id) => document.getElementById(id);
let token = localStorage.getItem("arsipgo_token") || "";
const statusLabels = {
  menunggu_konfirmasi: "Menunggu konfirmasi",
  dikonfirmasi: "Dikonfirmasi",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan"
};
const statusOptions = Object.keys(statusLabels);

const paymentLabels = {
  paid: "Lunas",
  menunggu_verifikasi: "Menunggu verifikasi",
  unpaid: "Belum dibayar",
  ditolak: "Ditolak",
  pending: "Belum selesai",
  expired: "Kedaluwarsa",
  cancelled: "Pembayaran dibatalkan",
  failed: "Gagal"
};

const methodLabels = {
  qris: "QRIS",
  ewallet: "E-wallet",
  bank: "Transfer bank"
};

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Permintaan gagal (${response.status})`);
  return data;
}

function showMessage(id, message, isError = false) {
  const el = $(id);
  el.textContent = message;
  el.style.color = isError ? "#b42318" : "";
}
function formatDate(value) {
  if (!value) return "Belum ditentukan";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("id-ID");
}
function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("id-ID");
}
function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function showDashboard() {
  $("loginPanel").hidden = true;
  $("dashboardPanel").hidden = false;
  $("logoutBtn").hidden = false;
}

// Kolom pembayaran: badge, metode, nominal, waktu, alasan tolak, dan tombol aksi
function paymentCell(b) {
  const payment = b.payment_status || "unpaid";
  const hasAmount = b.amount != null && Number(b.amount) > 0;
  const needsRefund = payment === "paid" && b.status === "dibatalkan";

  return `
    <span class="pay-pill pay-${esc(payment)}">${esc(paymentLabels[payment] || payment)}</span>
    <small>${hasAmount ? esc(formatRupiah(b.amount)) : "Harga belum ditetapkan"}</small>
    ${b.payment_method
      ? `<small>Metode: ${esc(methodLabels[b.payment_method] || b.payment_method)}</small>`
      : ""}
    ${b.payment_proof_uploaded_at
      ? `<small>Bukti dikirim: ${esc(formatDateTime(b.payment_proof_uploaded_at))}</small>`
      : ""}
    ${payment === "paid" && b.paid_at
      ? `<small>Disetujui: ${esc(formatDateTime(b.paid_at))}</small>`
      : ""}
    ${payment === "ditolak" && b.payment_reject_reason
      ? `<small class="refund-warning">Alasan ditolak: ${esc(b.payment_reject_reason)}</small>`
      : ""}
    ${needsRefund
      ? `<small class="refund-warning">⚠ Pesanan dibatalkan tapi sudah dibayar, perlu refund</small>`
      : ""}
    <div class="pay-actions">
      ${b.has_proof
        ? `<button class="mini-btn" data-action="view-proof" data-id="${esc(b.id)}">Lihat bukti</button>`
        : ""}
      ${payment === "menunggu_verifikasi"
        ? `<button class="mini-btn ok" data-action="approve" data-id="${esc(b.id)}" data-amount="${esc(b.amount)}">Setujui</button>
           <button class="mini-btn danger" data-action="reject" data-id="${esc(b.id)}">Tolak</button>`
        : ""}
    </div>
  `;
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("loginMessage", "Memeriksa akun...");
  try {
    const result = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: $("email").value.trim(), password: $("password").value })
    });
    if (result.user?.role !== "admin") {
      token = "";
      throw new Error("Akun ini belum memiliki akses admin. Atur role admin di database lalu login kembali.");
    }
    token = result.token;
    localStorage.setItem("arsipgo_token", result.token);
    localStorage.setItem("arsipgo_user", JSON.stringify(result.user));
    showDashboard();
    await loadDashboard();
  } catch (error) {
    showMessage("loginMessage", error.message, true);
  }
});

async function checkExistingAdminSession() {
  const savedToken = localStorage.getItem("arsipgo_token");
  const savedUser = localStorage.getItem("arsipgo_user");
  if (!savedToken || !savedUser) return;

  try {
    const user = JSON.parse(savedUser);
    if (user.role !== "admin") return;
  } catch {
    return;
  }

  token = savedToken;
  showDashboard();       // langsung tampilkan dashboard
  await loadDashboard(); // kalau gagal, errornya tampil di tabel, sesi tidak dihapus
}

$("logoutBtn").addEventListener("click", () => {
  token = "";
  localStorage.removeItem("arsipgo_token");
  localStorage.removeItem("arsipgo_user");
  sessionStorage.removeItem("arsipgo_token");
  sessionStorage.removeItem("arsipgo_user");

  window.location.href = "/index.html";
});
$("refreshBtn").addEventListener("click", loadDashboard);
$("filterBtn").addEventListener("click", loadBookings);

// Membuka bukti pembayaran di tab baru (butuh token, jadi diambil lewat fetch)
async function viewProof(id) {
  const win = window.open("about:blank", "_blank");
  try {
    const response = await fetch(`${API}/payments/proof/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Bukti pembayaran tidak ditemukan.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url;
    else window.location.href = url;
  } catch (error) {
    if (win) win.close();
    showMessage("tableMessage", error.message, true);
  }
}

async function approvePayment(id, amount) {
  const ok = confirm(
    `Setujui pembayaran pesanan #${id} sebesar ${formatRupiah(amount)}?\n\n` +
    "Pastikan nominal ini sudah masuk di mutasi rekening/e-wallet-mu."
  );
  if (!ok) return;

  try {
    await api(`/admin/bookings/${encodeURIComponent(id)}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ action: "approve" })
    });
    showMessage("tableMessage", `Pembayaran pesanan #${id} disetujui.`);
    await loadDashboard();
  } catch (error) {
    showMessage("tableMessage", error.message, true);
    await loadBookings();
  }
}

async function rejectPayment(id) {
  const reason = prompt(
    `Alasan menolak pembayaran pesanan #${id}?\n(Contoh: nominal kurang, bukti tidak jelas, dana belum masuk)`
  );
  if (reason === null) return;

  if (!reason.trim()) {
    showMessage("tableMessage", "Alasan penolakan wajib diisi.", true);
    return;
  }

  try {
    await api(`/admin/bookings/${encodeURIComponent(id)}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ action: "reject", reason: reason.trim() })
    });
    showMessage("tableMessage", `Pembayaran pesanan #${id} ditolak.`);
    await loadDashboard();
  } catch (error) {
    showMessage("tableMessage", error.message, true);
    await loadBookings();
  }
}

// Satu pendengar klik untuk semua tombol di tabel
$("bookingRows").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id, amount } = button.dataset;

  if (action === "view-proof") viewProof(id);
  else if (action === "approve") approvePayment(id, amount);
  else if (action === "reject") rejectPayment(id);
});

async function loadDashboard() {
  try {
    const result = await api("/admin/summary");
    const s = result.summary;
    const labels = [
      ["total","Semua pesanan"],["menunggu_konfirmasi","Menunggu"],["dikonfirmasi","Dikonfirmasi"],
      ["diproses","Diproses"],["selesai","Selesai"],["dibatalkan","Dibatalkan"],
      ["menunggu_verifikasi","Perlu diverifikasi"],["paid","Sudah dibayar"],["unpaid","Belum dibayar"]
    ];
    $("summary").innerHTML = labels.map(([key,label]) =>
      `<div class="stat ${key === "menunggu_verifikasi" && Number(s[key]) > 0 ? "stat-alert" : ""}"><span>${label}</span><strong>${Number(s[key] || 0)}</strong></div>`
    ).join("") +
      `<div class="stat stat-wide"><span>Total pendapatan</span><strong>${esc(formatRupiah(s.total_pendapatan))}</strong></div>`;
    await loadBookings();
  } catch (error) {
    showMessage("tableMessage", error.message, true);
  }
}

async function loadBookings() {
  showMessage("tableMessage", "Memuat pesanan...");
  const params = new URLSearchParams();
  if ($("statusFilter").value) params.set("status", $("statusFilter").value);
  if ($("paymentFilter").value) params.set("payment_status", $("paymentFilter").value);
  if ($("searchInput").value.trim()) params.set("search", $("searchInput").value.trim());
  try {
    const result = await api(`/admin/bookings?${params.toString()}`);
    const bookings = result.bookings || [];
    if (!bookings.length) {
      $("bookingRows").innerHTML = '<tr><td colspan="7" class="empty">Belum ada pesanan yang cocok.</td></tr>';
    } else {
      $("bookingRows").innerHTML = bookings.map(b => `
        <tr>
          <td><strong>#${esc(b.id)}</strong><small>Dibuat: ${esc(new Date(b.created_at).toLocaleString("id-ID"))}</small></td>
          <td><strong>${esc(b.customer_name)}</strong><small>${esc(b.customer_email)}</small><small>${esc(b.whatsapp || "WhatsApp belum diisi")}</small></td>
          <td><strong>${esc(b.service_name)}</strong><small>Paket: ${esc(b.package_name)}</small><small>${esc(b.document_count ?? "-")} dokumen · ${esc(b.workers ?? "-")} tenaga · ${esc(b.duration_days ?? "-")} hari</small><small>${esc(b.description)}</small></td>
          <td>${esc(formatDate(b.start_date))}</td>
          <td><span class="status-pill">${esc(statusLabels[b.status] || b.status)}</span></td>
          <td>${paymentCell(b)}</td>
          <td><select class="status-select" data-booking-id="${esc(b.id)}" aria-label="Ubah status pesanan ${esc(b.id)}">
            ${statusOptions.map(s => `<option value="${s}" ${s === b.status ? "selected" : ""}>${statusLabels[s]}</option>`).join("")}
          </select></td>
        </tr>`).join("");
      document.querySelectorAll(".status-select").forEach(select => {
        select.addEventListener("change", async () => {
          const id = select.dataset.bookingId;
          const newStatus = select.value;
          select.disabled = true;
          try {
            await api(`/admin/bookings/${id}/status`, {
              method: "PATCH", body: JSON.stringify({ status: newStatus })
            });
            showMessage("tableMessage", `Status pesanan #${id} diperbarui menjadi "${statusLabels[newStatus]}".`);
            await loadDashboard();
          } catch (error) {
            showMessage("tableMessage", error.message, true);
            await loadBookings();
          } finally { select.disabled = false; }
        });
      });
    }
    showMessage("tableMessage", `${bookings.length} pesanan ditampilkan (maksimal 200).`);
  } catch (error) {
    showMessage("tableMessage", error.message, true);
  }
}

checkExistingAdminSession();