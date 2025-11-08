# Sistem Absensi Siswa Berbasis QR Code

Aplikasi ini menghadirkan alur absensi cepat untuk guru: cukup buka pemindai QR berbasis web, arahkan kamera ke kartu siswa, lalu data otomatis tercatat di Google Sheets dan dapat memicu notifikasi WhatsApp. Seluruh stack sengaja dibuat ringan agar mudah dipahami dan dipasang di lingkungan sekolah tanpa infrastruktur rumit.

## Fitur Utama
- **Scanner kamera langsung** — Halaman `index.html` (Tailwind + jsQR) berjalan di browser apa pun, mendukung pemilihan kamera, torch, dan tiga mode status (`MASUK`, `SHOLAT`, `PULANG`).
- **Integrasi Google Apps Script** — Permintaan `POST` ringan (`text/plain`) memastikan tidak ada preflight CORS dan bisa langsung ditanam di Google Apps Script.
- **Log & toast realtime** — Guru mendapat umpan balik audio, visual, dan tulisan sehingga tahu setiap pemindaian berhasil/gagal.
- **Notifikasi WhatsApp** — Backend (Apps Script) dapat menghubungi layanan Fonnte untuk memberi tahu orang tua saat anak pulang.
- **Proxy Telegram opsional** — Folder `api/` berisi fungsi serverless yang meneruskan webhook Telegram bot ke Apps Script.

## Arsitektur Singkat
1. **Frontend static (`index.html`)** memindai QR yang hanya berisi `student_id`.
2. **Google Apps Script** menerima payload `{ token, student_id, status }`, memvalidasi token, membaca master siswa di sheet `SISWA`, dan mencatat ke sheet `ABSENSI`.
3. **Fonnte API (opsional)** dipanggil Apps Script sesaat setelah status `PULANG` tercatat untuk mengirim pesan WhatsApp.
4. **Telegram webhook proxy (opsional)** meneruskan event masuk ke Apps Script agar bisa mengirim laporan absensi via bot.

## Struktur Direktori
```
.
├── index.html          # Halaman pemindai QR (statik)
├── api/
│   └── tg-webhook.js   # Proxy webhook Telegram → Google Apps Script
└── README.md
```

## Prasyarat
- Google Account dengan akses ke Google Sheets & Google Apps Script.
- Spreadsheet dengan minimal dua sheet: `SISWA` (master data) dan `ABSENSI` (log harian).
- Akun Fonnte (atau layanan sejenis) jika ingin mengirim WhatsApp otomatis.
- Akun Vercel (atau hosting statik lain) untuk men-deploy scanner & fungsi serverless opsional.
- Node.js 18+ hanya diperlukan bila ingin menjalankan server statik lokal atau fungsi Vercel secara lokal.

## Menyiapkan Google Sheets & Apps Script
1. **Struktur Sheet `SISWA`**: gunakan kolom `student_id`, `nama`, `kelas`, `no_ortu`, dll. Pastikan `student_id` unik.
2. **Struktur Sheet `ABSENSI`**: minimal kolom `tanggal`, `student_id`, `status`, `timestamp`, `keterangan`.
3. **Apps Script**:
   - Buat proyek Apps Script di spreadsheet tersebut.
   - Tambahkan endpoint `doPost(e)` yang membaca `e.postData.contents` dan memproses JSON.
   - Validasi `token` yang datang dari frontend.
   - Terapkan logika idempoten (satu status per siswa per hari) sebelum menulis ke `ABSENSI`.
   - Di bagian `status === 'PULANG'`, panggil API Fonnte untuk memberi tahu orang tua.
4. **Publikasi**: Deploy sebagai *Web App* dengan setting **Anyone** (atau Anyone with the link) dan catat URL Web App beserta `API_TOKEN` yang digunakan untuk validasi.

> Contoh payload yang dikirim frontend:
> ```json
> {
>   "token": "Tokenku12345",
>   "student_id": "STD123",
>   "status": "MASUK"
> }
> ```

## Konfigurasi Frontend (`index.html`)
Di bagian awal berkas (`index.html`), sesuaikan konstanta berikut:

| Konstanta      | Fungsi                                                                                         |
|----------------|------------------------------------------------------------------------------------------------|
| `WEBAPP_URL`   | URL Web App Google Apps Script (mis. `https://script.google.com/.../exec`).                   |
| `API_TOKEN`    | Token rahasia yang harus sama dengan token di Apps Script.                                     |
| `COOLDOWN_MS`  | Durasi minimal (ms) sebelum QR yang sama bisa diproses ulang, mencegah double scan tidak sengaja. |

Jika ingin menyembunyikan token saat deploy publik, Anda dapat memindahkan variabel-variabel ini ke file JS terpisah yang di-inject melalui *build* sederhana atau memanfaatkan Secrets Vercel + *edge config*. Namun untuk penggunaan internal, penyimpanan langsung di HTML biasanya sudah cukup.

## Menjalankan Pemindai Secara Lokal
Scanner adalah halaman statik sehingga bisa dijalankan dengan server apa pun. Contoh:

```bash
npm install --global serve
serve .
```

Atau gunakan Live Server / VS Code *Go Live*. Pastikan situs diakses via `https://` (atau `http://localhost`) karena API kamera membutuhkan konteks aman.

## Deploy ke Vercel
### 1. Frontend statik
1. Push repo ini ke Git.
2. Buat proyek baru di Vercel, pilih repo tersebut.
3. Set **Framework Preset** = *Other* (karena hanya HTML statik).
4. Pastikan output directory tetap root (tidak perlu build).

### 2. Fungsi `api/tg-webhook.js` (opsional)
Jika ingin meneruskan webhook Telegram bot ke Apps Script:
1. Di Vercel, buka tab **Environment Variables** dan set:
   - `GAS_WEBAPP_URL` → URL Apps Script `/exec`.
   - `TG_SECRET` → Secret token yang sama dengan `TELEGRAM_WEBHOOK_SECRET` pada Apps Script (opsional namun disarankan).
2. Deploy. Endpoint penuh akan berada di `https://<project>.vercel.app/api/tg-webhook`.
3. Set webhook bot Telegram ke URL tersebut.

Fungsi ini menjawab 200 ke Telegram secepat mungkin, baru kemudian me-*relay* payload ke Apps Script (lihat `api/tg-webhook.js`).

## Alur Penggunaan Harian
1. Guru membuka URL pemindai di perangkat (bisa bookmark / pasang ke home screen).
2. Pilih status (`MASUK`, `SHOLAT`, atau `PULANG`) sesuai kebutuhan harian.
3. Arahkan kartu QR siswa ke kamera. Jika berhasil, guru mendapat bunyi, toast “✓ Terkirim”, dan detail siswa muncul di kartu info.
4. Data langsung tercatat di Google Sheets, sedangkan status `PULANG` dapat memicu pesan WhatsApp ke orang tua.
5. Panel “Log” menyimpan histori singkat untuk verifikasi cepat di lapangan.

## Troubleshooting
- **Kamera tidak muncul** → Pastikan browser sudah diberi izin akses kamera dan situs menggunakan HTTPS.
- **Scan tidak merespons** → Periksa `COOLDOWN_MS`; jika terlalu tinggi, warga kelas dengan antrean cepat bisa terhambat.
- **Status badge “Jaringan error”** → Cek koneksi internet dan pastikan `WEBAPP_URL` dapat diakses dari jaringan sekolah (tidak diblokir firewall).
- **Apps Script menerima CORS preflight** → Pastikan tipe konten tetap `text/plain` seperti pada kode ini agar tidak ada preflight.
- **Token mismatch** → Samakan nilai `API_TOKEN` di frontend dan backend; gunakan secret panjang untuk keamanan.
- **Notifikasi WhatsApp gagal** → Log backend (Apps Script) untuk melihat respons Fonnte, cek juga kuota & validitas nomor orang tua.

## Roadmap Ide Pengembangan
- Tambah dashboard rekap mingguan dengan Google Data Studio atau Next.js.
- Ekspor riwayat notifikasi WhatsApp ke sheet terpisah untuk audit.
- Jadikan scanner sebagai Progressive Web App (PWA) agar bisa tetap dibuka meski koneksi putus.
- Integrasi caching lokal daftar siswa untuk validasi awal tanpa jaringan.

Selamat menggunakan! Jangan ragu menyesuaikan tampilan dan alur sesuai SOP sekolah masing-masing. 🎒
