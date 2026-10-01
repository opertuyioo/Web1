# WebSuite (versi GitHub Pages, terhubung ke Excel)

Semua fitur WebSuite berjalan di browser: `static-api.js` menggantikan `server.js`, data disimpan di `localStorage`.
Akun: `admin` / `admin123` (ubah di baris pertama `static-api.js`).

## Koneksi langsung ke Excel
Di halaman Data Siswa klik **Buka Excel**, lalu pilih file .xlsx yang ada atau buat file baru.
Setelah itu: edit di Excel lalu Save -> web ikut berubah; ubah di web -> file Excel ikut berubah.
Perlu Chrome atau Edge di komputer. Jika file sedang terbuka di Excel, perubahan dari web ditulis otomatis setelah file ditutup.

## Deploy
1. Taruh semua file ini di root repo, commit, push.
2. Settings -> Pages -> Deploy from a branch -> `main` / `(root)` -> Save.
3. Buka `https://<username>.github.io/<nama-repo>/`.
