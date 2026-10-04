# Berkah Sumbing POS

POS multi-cabang dan membership berdasarkan PRD Aplikasi Kasir Berkah Sumbing v1.1.

## Status implementasi

### Sudah dibuat
- Next.js App Router + TypeScript + responsive POS UI.
- Modul navigasi: Dashboard, Kasir, Produk, Stok, Member, Laporan, Pengaturan.
- Katalog kasir dengan pencarian nama/SKU dan kategori.
- Keranjang, quantity, diskon member, metode Tunai/QRIS/Transfer/Poin.
- Fondasi database terpusat untuk cabang, produk, stok, shift, member, penjualan, mutasi stok, dan transfer stok.
- Supabase client opsional melalui NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.
- RPC checkout_sale untuk checkout atomik: penjualan + detail item + pengurangan stok + mutasi stok + poin member dalam satu transaksi database.
- Endpoint /api/health untuk mengecek apakah backend Supabase sudah terhubung.

### Belum dianggap selesai
- Login/PIN dan role Kasir/Admin Cabang/Manajemen Pusat.
- CRUD produksi untuk Produk, Member, Cabang, Harga, dan Stok.
- Open/close shift yang benar-benar tersimpan.
- Transfer stok + Good Received Note.
- Laporan omzet, laba-rugi, produk terlaris, dan analitik member.
- Printer thermal Bluetooth/USB dan struk WhatsApp.
- Sinkronisasi realtime antar cabang.
- Barcode/QR scanner perangkat.
- Refund dan riwayat transaksi.
- RLS/policy Supabase yang disesuaikan dengan role pengguna.

## Menjalankan

npm install
npm run dev

Buat .env.local dari .env.example dan isi URL serta anon key Supabase.

Setelah schema dijalankan di Supabase, endpoint /api/health dapat digunakan untuk memastikan koneksi backend.

## Catatan PRD

Implementasi mengikuti kebutuhan PRD v1.1. Nilai diskon tier, rasio poin, aturan pajak, dan aturan bisnis lain yang belum ditentukan eksplisit di PRD tidak boleh dianggap sebagai aturan final hanya karena ada di UI demo.

## Tahap berikutnya

Tahap berikutnya adalah mengganti data demo di terminal kasir dengan data Supabase, kemudian mengaktifkan checkout nyata menggunakan checkout_sale. Setelah alur kasir stabil, modul stok/member/produk dan laporan dibangun di atas sumber data yang sama.