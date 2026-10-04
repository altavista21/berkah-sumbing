# Berkah Sumbing POS

Aplikasi Point of Sale (POS) lokal untuk Berkah Sumbing.

## Status implementasi

### Sudah dibuat
- Next.js App Router + TypeScript + responsive POS UI.
- Dashboard dasar.
- Modul Kasir: katalog, pencarian, kategori, keranjang, quantity, member, diskon tier, Tunai/QRIS/Transfer/Poin.
- Riwayat transaksi: pencarian, detail transaksi, dan refund penuh dengan pengembalian stok/poin.
- Checkout lokal dengan validasi stok dan validasi member terbaru.
- Modul Produk: tambah, edit, hapus, pencarian, kategori, SKU, barcode.
- Modul Stok: stok masuk, stok keluar, validasi stok, catatan, dan riwayat pergerakan stok.
- Modul Member: tambah, edit, hapus, pencarian, tier, dan poin.
- Modul Laporan: transaksi, omzet, rata-rata transaksi, pembayaran, inventori, dan transaksi terbaru.
- Modul Pengaturan: backup dan restore seluruh data lokal.
- Endpoint health check `/api/health`.
- Penyimpanan utama menggunakan `localStorage`, sehingga aplikasi dapat digunakan tanpa database/cloud.

## Penyimpanan dan batasan

Versi saat ini adalah **single-device/local-first**:
- Data produk, member, transaksi, dan pergerakan stok tersimpan di browser/perangkat.
- Data tidak otomatis tersinkron ke perangkat atau cabang lain.
- Menghapus data browser dapat menghapus data POS jika belum dibuat backup.
- Backup tersedia dalam format JSON melalui menu Pengaturan.
- Supabase tidak diperlukan untuk menjalankan versi lokal ini.

## Catatan aturan bisnis

Nilai diskon tier member yang saat ini tampil di UI adalah:
- Bronze: 2%
- Silver: 5%
- Gold: 10%

Aturan tersebut masih bersifat konfigurasi/prototipe dan perlu dikonfirmasi sebelum dianggap sebagai aturan bisnis final. Hal yang belum ditentukan eksplisit di PRD tidak boleh dianggap final hanya karena sudah tersedia di UI.

## Belum diimplementasikan

- Login/PIN lokal dan role Kasir/Admin Cabang/Manajemen Pusat.
- Buka/tutup shift kasir dengan modal awal dan kunci sesi.
- Multi-cabang dan sinkronisasi realtime antar perangkat.
- Printer thermal Bluetooth/USB.
- Struk atau notifikasi WhatsApp.
- Barcode/QR scanner perangkat secara native.
- Void/pembatalan sebagian transaksi dan alur approval refund yang lebih lengkap.
- Laporan laba-rugi dan analitik produk/member yang lebih lengkap.
- Integrasi pembayaran online.
- Database/cloud untuk sinkronisasi antar perangkat.

## Development

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
npm start
```

Production deployment menggunakan integrasi GitHub → Vercel pada branch `main`.
