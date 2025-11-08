# Sistem Absensi Siswa Berbasis QR Code

Proyek ini menyediakan sistem absensi ringan yang memanfaatkan QR Code untuk mencatat kehadiran siswa, terhubung ke Google Sheets, dan mengirim notifikasi WhatsApp otomatis via layanan Fonnte.

## Cara Kerja
1. **Pemindaian QR** – Guru membuka halaman web scanner (HTML + Tailwind + jsQR, di-host di Vercel) lalu memindai QR milik siswa. Kode QR hanya menyimpan `student_id`, sehingga pemindaian cepat dan aman.
2. **Kirim Request** – Hasil pemindaian dikirim sebagai request `POST` ke backend Google Apps Script dengan payload `student_id`, `status`, dan `API_TOKEN`.
3. **Validasi & Pencatatan** – Backend memverifikasi `API_TOKEN`, mencari data siswa di sheet `SISWA`, dan mencatat absensi secara idempoten per hari di sheet `ABSENSI`.
4. **Notifikasi WhatsApp** – Jika `status` bernilai `PULANG`, backend otomatis memicu pengiriman pesan WhatsApp ke nomor orang tua menggunakan template kustom di Fonnte.

## Komponen Utama
- **Frontend Scanner**: Halaman web ringan tanpa login, mudah dipakai di smartphone, dan siap diekspor ke PWA untuk mode offline.
- **Google Apps Script Backend**: Endpoint `POST` yang menangani validasi token, lookup data siswa, pencatatan absensi, dan trigger notifikasi.
- **Google Sheets**: Sheet `SISWA` menyimpan master siswa; sheet `ABSENSI` menyimpan log harian (dengan penguncian idempoten).
- **Fonnte API**: Menangani pengiriman pesan WhatsApp ke orang tua, mendukung template yang bisa disesuaikan.

## Kelebihan
- Tidak memerlukan login; cukup buka URL scanner.
- Ringan dan dapat diakses di perangkat apa pun dengan kamera.
- Pencatatan langsung ke Google Sheets sehingga mudah diaudit.
- Otomatis mengabari orang tua saat siswa pulang.
- Dapat diperluas menjadi PWA untuk pemakaian offline atau ditambah dashboard statistik di masa depan.
