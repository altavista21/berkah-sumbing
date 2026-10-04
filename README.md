# Berkah Sumbing POS

POS multi-cabang dan membership berdasarkan PRD Aplikasi Kasir Berkah Sumbing v1.1.

## Status implementasi

### Sudah dibuat
- Next.js App Router + TypeScript + responsive POS UI.
- Modul navigasi: Dashboard, Kasir, Produk, Stok, Member, Laporan, Pengaturan.
- Katalog kasir dengan pencarian nama/SKU dan kategori.
- Keranjang, quantity, diskon member, metode Tunai/QRIS/Transfer/Poin.
- Penyimpanan lokal berbasis `localStorage` untuk produk, member, dan transaksi.
- Checkout lokal yang mengurangi stok dan menyimpan riwayat transaksi di perangkat.
- Endpoint `/api/health` untuk mengecek aplikasi.

### Belum dianggap selesai
- Login/PIN dan role Kasir/Admin Cabang/Manajemen Pusat.
- CRUD produk, member, cabang, harga, dan stok melalui UI.
- Laporan omzet, laba-rugi, produk terlaris, dan analitik member.
- Printer thermal Bluetooth/USB dan struk WhatsApp.
- Sinkronisasi realtime antar perangkat/cabang.
- Barcode/QR scanner perangkat.
- Refund dan riwayat transaksi yang lebih lengkap.
- Backup/restore data dan ekspor laporan.

## Catatan PRD

Implementasi mengikuti kebutuhan PRD v1.1. Nilai diskon tier, rasio poin, aturan pajak, dan aturan bisnis lain yang belum ditentukan eksplisit di PRD tidak boleh dianggap sebagai aturan final hanya karena ada di UI demo.

## Tahap berikutnya

Fokus berikutnya adalah menyelesaikan modul Produk, Stok, Member, Laporan, backup/restore, dan alur transaksi lokal sebelum mempertimbangkan sinkronisasi cloud.

## Deployment

Production deployment menggunakan integrasi GitHub → Vercel. Setiap perubahan pada branch `main` akan memicu deployment production.