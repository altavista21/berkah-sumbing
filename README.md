# Berkah Sumbing POS

POS multi-cabang dan membership berdasarkan PRD Aplikasi Kasir Berkah Sumbing v1.1.

## Status
Fondasi aplikasi sudah dibuat: Next.js + TypeScript, UI responsive, katalog produk dan SKU/barcode, keranjang, diskon member Bronze/Silver/Gold, pembayaran Tunai/QRIS/Transfer/Poin, shift kasir, dashboard, serta struktur database terpusat.

## Menjalankan
npm install
npm run dev

Salin .env.example menjadi .env.local saat backend Supabase mulai dihubungkan.

## Implementasi berikutnya
Target PRD yang belum boleh dianggap selesai: printer thermal/WhatsApp receipt, sinkronisasi real-time antar cabang, GRN penerimaan transfer, autentikasi/role, laporan laba-rugi produksi, dan persistence transaksi. UI sekarang memakai data demo agar pengembangan terminal kasir tidak menunggu kredensial backend.
