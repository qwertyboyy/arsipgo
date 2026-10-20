// Informasi tujuan pembayaran manual yang ditampilkan ke pelanggan.
module.exports = {
    qris: {
        // Taruh gambar QRIS di public/img/qris.png (atau ubah path ini).
        image: "/img/qris.png",
        note: "Scan QRIS ini dengan e-wallet atau mobile banking, lalu masukkan nominal sesuai total pesanan."
    },
    ewallets: [
        // GANTI dengan e-wallet aslimu
        { name: "GoPay", number: "0881036195969", holder: "Ayu illa nur aini" },
        { name: "ShopeePay", number: "0881036195969", holder: "Ayu illa nur aini" }
    ],
    banks: [
        // GANTI dengan rekening aslimu
        { name: "Bank Mandiri", number: "1420023714958", holder: "AYU ILLA NUR AINI" }
    ]
};