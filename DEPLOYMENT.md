# Deploy terpisah: Vercel + Railway

Frontend Next.js dijalankan di Vercel. Backend Go, migrasi, dan MySQL berjalan di Railway. Frontend memakai rewrite `/api/*` dan `/uploads/*` agar browser tetap mengakses API pada origin website yang sama; ini mempertahankan alur cookie HttpOnly dan CSRF yang sudah dipakai aplikasi.

## 1. Database dan backend di Railway

1. Buat project Railway dan tambahkan layanan **MySQL**. Gunakan koneksi private Railway untuk backend; jangan publikasikan port database.
2. Tambahkan service dari repository ini. Atur **Root Directory** ke `/Backend` agar Dockerfile, `go.mod`, dan folder migrasi menjadi build context.
3. Buat domain publik untuk service backend melalui Railway **Networking → Generate Domain**.
4. Pasang volume Railway ke `/app/uploads` jika aplikasi menerima unggahan. Storage saat ini memakai filesystem lokal; gunakan satu replica backend dan pastikan volume dapat ditulis oleh user container.
5. Isi variabel service backend berikut. Hubungkan nilai DB ke variabel private dari layanan MySQL Railway.

   ```dotenv
   APP_ENV=production
   DB_HOST=<private host MySQL>
   DB_PORT=<private port MySQL>
   DB_NAME=<nama database>
   DB_USER=<user database>
   DB_PASSWORD=<password database>
   JWT_ACCESS_SECRET=<random secret minimal 32 byte>
   DOCUMENT_HMAC_SECRET=<random secret minimal 32 byte, berbeda dari JWT>
   VISITOR_HMAC_SECRET=<random secret minimal 32 byte, berbeda dari secret lain>
   CORS_ALLOWED_ORIGINS=https://<domain-frontend>
   APP_URL=https://<domain-frontend>
   FILE_STORAGE_PATH=/app/uploads
   ```

   Biarkan `APP_PORT` tidak disetel di Railway agar backend memakai `PORT` yang diberikan platform. Jika deployment tidak menyediakan `PORT`, set `APP_PORT=8080` dan arahkan networking service ke port `8080`.

   Buat secret acak yang berbeda, misalnya dengan `openssl rand -hex 32`. Tambahkan konfigurasi Mailjet dan FlowKirim jika fitur tersebut digunakan. Jangan isi `NEXT_PUBLIC_*` dengan secret.

6. Di pengaturan service backend, set **Pre-deploy Command** agar migrasi dijalankan sebelum versi baru menerima trafik:

   ```sh
   migrate -path /app/migrations -database "$MIGRATIONS_DATABASE_URL" up
   ```

   Buat variabel `MIGRATIONS_DATABASE_URL` berupa URL MySQL private:

   ```text
   mysql://USER:PASSWORD@tcp(PRIVATE_HOST:PRIVATE_PORT)/DATABASE?multiStatements=true&parseTime=true
   ```

   URL-encode karakter khusus pada user/password. Gunakan kredensial dan database yang sama dengan konfigurasi `DB_*` backend. Image Docker backend menyertakan CLI `migrate` dan `/app/migrations` untuk perintah tersebut.

7. Atur healthcheck service ke `GET /readyz`, yang memastikan koneksi database siap, lalu aktifkan restart saat terjadi kegagalan.

## 2. Frontend di Vercel

1. Import repository ke Vercel dan pilih **Root Directory** `Frontend`; framework akan terdeteksi sebagai Next.js.
2. Tambahkan environment variable untuk Production dan Preview sesuai kebutuhan:

   ```dotenv
   API_INTERNAL_URL=https://<domain-backend-railway>
   NEXT_PUBLIC_API_BASE_URL=/api
   NEXT_PUBLIC_SITE_URL=https://<domain-frontend>
   NEXT_PUBLIC_APP_NAME=Website Desa Anabanua
   NEXT_PUBLIC_MOCK_DELAY_MS=0
   ```

   `API_INTERNAL_URL` dipakai Server Components dan rewrite Next.js, jadi harus tersedia saat build dan runtime. Jangan tambahkan `/api` pada nilainya. `NEXT_PUBLIC_API_BASE_URL` tetap `/api` agar browser memakai origin Vercel yang sama.

3. Tambahkan domain frontend produksi ke `CORS_ALLOWED_ORIGINS` backend dan gunakan URL yang sama pada `APP_URL` serta `NEXT_PUBLIC_SITE_URL`. Tambahkan origin preview secara eksplisit bila dibutuhkan.
4. Deploy ulang setelah mengubah environment variable. Nilai `NEXT_PUBLIC_*` tertanam saat build.

## 3. Verifikasi setelah deploy

- Pastikan `https://<domain-backend-railway>/healthz` hidup dan `/readyz` sukses setelah MySQL tersedia.
- Buka website Vercel dan periksa Network browser: request API harus menuju `/api/...` pada domain frontend dan berhasil.
- Uji login, refresh token, logout, pendaftaran dan OTP, upload/unduh lampiran, serta notifikasi SSE. Pastikan cookie sesi memiliki `Secure` di Production.
- Pastikan MySQL tidak memiliki domain publik, volume unggahan terpasang dan dapat ditulis, serta backup database dan file dijadwalkan.

## Catatan operasional

- `docker-compose.yml` di root tetap untuk development satu host; Vercel tidak menggunakannya.
- MySQL Railway harus memiliki penyimpanan persisten dan backup. Jangan mengandalkan container database tanpa volume.
- Backend menyimpan file pada satu volume lokal. Satu replica backend adalah batasan desain saat ini; object storage diperlukan sebelum menjalankan beberapa replica atau mendistribusikan file lintas layanan.
- Endpoint SSE melewati rewrite Vercel dan browser mengulang koneksi saat terputus. Periksa kestabilan stream pada domain produksi.
