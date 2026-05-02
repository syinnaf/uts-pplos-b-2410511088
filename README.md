# SportFieldHub

> UTS Pembangunan Perangkat Lunak Berorientasi Service  
> **Studi Kasus:** Sistem Booking Lapangan Olahraga

---

## Identitas Mahasiswa

| Field | Detail |
|---|---|
| **Nama** | Syifa Nafisa |
| **NIM** | 2410511088 |
| **Kelas** | B |
| **Mata Kuliah** | Pembangunan Perangkat Lunak Berorientasi Service |
| **Digit Akhir NIM** | 8 |
| **OAuth Provider** | Google OAuth 2.0 |

---

## Deskripsi Sistem

**SportFieldHub** adalah sistem booking lapangan olahraga berbasis **microservice** yang memungkinkan pengguna untuk:

- melihat daftar lapangan olahraga,
- mengecek slot ketersediaan,
- melakukan booking,
- membayar DP,
- melakukan pelunasan,
- dan melihat dashboard pemilik lapangan.

Sistem ini dibangun menggunakan **3 microservice utama** dan **1 API Gateway** sebagai **single entry point**.

---

## Arsitektur Sistem

Sistem terdiri dari beberapa service berikut:

| Service | Teknologi | Port | Tanggung Jawab |
|---|---|---:|---|
| **API Gateway** | Node.js + Express | `8000` | Routing, JWT validation, blacklist verification, rate limiting |
| **Auth Service** | Laravel 11 | `8001` | Register, login, JWT, refresh token, logout, Google OAuth |
| **Field Service** | Node.js + Express | `8002` | Venue, court, slot jadwal, pagination, filtering |
| **Booking Service** | Node.js + Express | `8003` | Booking, pembayaran DP, pelunasan, dashboard pemilik |

Jika file diagram sudah tersedia, diagram arsitektur dapat dilihat pada:

```text
docs/arsitektur.png
`````

---

## Teknologi yang Digunakan

* **Laravel 11**
* **PHP 8.2**
* **Node.js**
* **Express.js**
* **MySQL / MariaDB**
* **JWT (JSON Web Token)**
* **Google OAuth 2.0**
* **REST API**
* **Docker Compose**
* **Postman**
* **Git & GitHub**

---

## Fitur Utama

### 1) Auth Service

* Register user
* Login menggunakan email/username dan password
* JWT access token
* Refresh token
* Logout dengan token blacklist
* Google OAuth 2.0 Authorization Code Flow
* Mapping akun Google ke user lokal
* Internal endpoint untuk komunikasi antar-service

### 2) Field Service

* CRUD venue
* CRUD court/lapangan
* Listing lapangan dengan pagination
* Filtering berdasarkan jenis olahraga, lokasi, dan harga
* Cek slot ketersediaan berdasarkan tanggal
* Update status slot untuk kebutuhan booking

### 3) Booking Service

* Membuat booking
* Validasi user ke Auth Service
* Validasi slot ke Field Service
* Pembayaran DP
* Pelunasan pembayaran
* Listing booking dengan pagination dan filter status
* Dashboard pemilik lapangan

### 4) API Gateway

* Single entry point untuk client/Postman
* Routing ke seluruh service
* JWT validation di sisi gateway
* Verifikasi token blacklist ke Auth Service
* Rate limiting **60 request per menit per IP**

---

## Struktur Folder

```text
uts-pplos-b-2410511088/
├── README.md
├── docker-compose.yml
├── gateway/
│   ├── src/
│   │   ├── index.js
│   │   ├── middlewares/
│   │   └── routes/
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   └── .env.example
├── services/
│   ├── auth-service/        # Laravel 11 PHP MVC
│   ├── field-service/       # Node.js Express
│   └── booking-service/     # Node.js Express
├── docs/
│   ├── laporan-uts.pdf
│   └── arsitektur.png
├── postman/
│   └── collection.json
└── poster/
    ├── poster-uts.pdf
    └── poster-uts.png
```

---

## Database

Setiap service menggunakan database/schema yang terpisah.

| Service             | Database     |
| ------------------- | ------------ |
| **Auth Service**    | `auth_db`    |
| **Field Service**   | `field_db`   |
| **Booking Service** | `booking_db` |

### Auth Service Tables

* `roles`
* `users`
* `oauth_accounts`
* `refresh_tokens`
* `token_blacklists`

### Field Service Tables

* `owner_profiles`
* `venues`
* `courts`
* `court_slots`
* `court_photos`

### Booking Service Tables

* `bookings`
* `booking_slots`
* `payments`
* `payment_logs`

---

## Konfigurasi Environment

Setiap service menyediakan file `.env.example`.

> File `.env` **tidak disertakan** di repository karena berisi konfigurasi lokal dan secret.

Buat file `.env` dari `.env.example` pada masing-masing service.

### Linux / macOS

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Pastikan nilai berikut konsisten pada service yang membutuhkan:

```env
JWT_SECRET=sportfieldhub_super_secret_key_2410511088_change_me
INTERNAL_SERVICE_TOKEN=sportfieldhub_internal_token_2410511088
```

---

## Cara Menjalankan Project Secara Lokal

### 1. Jalankan MySQL

Gunakan XAMPP, Laragon, atau MySQL lokal, lalu buat database berikut:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE field_db;
CREATE DATABASE booking_db;
```

---

### 2. Menjalankan Auth Service

Masuk ke folder Auth Service:

```powershell
cd services/auth-service
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8001
```

Auth Service berjalan di:

```text
http://127.0.0.1:8001
```

---

### 3. Menjalankan Field Service

Import schema berikut ke database `field_db`:

```text
services/field-service/database/schema.sql
```

Lalu jalankan service:

```powershell
cd services/field-service
npm install
Copy-Item .env.example .env
npm run dev
```

Field Service berjalan di:

```text
http://127.0.0.1:8002
```

---

### 4. Menjalankan Booking Service

Import schema berikut ke database `booking_db`:

```text
services/booking-service/database/schema.sql
```

Lalu jalankan service:

```powershell
cd services/booking-service
npm install
Copy-Item .env.example .env
npm run dev
```

Booking Service berjalan di:

```text
http://127.0.0.1:8003
```

---

### 5. Menjalankan API Gateway

```powershell
cd gateway
npm install
Copy-Item .env.example .env
npm run dev
```

Gateway berjalan di:

```text
http://127.0.0.1:8000
```

---

## Menjalankan Dengan Docker Compose

Project ini juga dapat dijalankan menggunakan Docker Compose.

### Jalankan seluruh service

```bash
docker compose up --build
```

### Jalankan migration Auth Service

```bash
docker compose exec auth-service php artisan migrate --seed
```

### Catatan

* Auth Service menggunakan migration Laravel
* Field Service menggunakan schema SQL
* Booking Service menggunakan schema SQL

---

## Routing API Gateway

Seluruh request dari client/Postman diarahkan melalui **API Gateway**.

| Endpoint Gateway  | Service Tujuan  |
| ----------------- | --------------- |
| `/api/auth/*`     | Auth Service    |
| `/api/fields/*`   | Field Service   |
| `/api/bookings/*` | Booking Service |
| `/api/owner/*`    | Booking Service |

---

## Endpoint Utama

### Auth Endpoint

| Method | Endpoint                    | Deskripsi                   | Akses  |
| ------ | --------------------------- | --------------------------- | ------ |
| `POST` | `/api/auth/register`        | Register user               | Public |
| `POST` | `/api/auth/login`           | Login user                  | Public |
| `POST` | `/api/auth/refresh`         | Refresh access token        | Public |
| `GET`  | `/api/auth/me`              | Data user yang sedang login | JWT    |
| `POST` | `/api/auth/logout`          | Logout dan blacklist token  | JWT    |
| `GET`  | `/api/auth/google/redirect` | Redirect ke Google OAuth    | Public |
| `GET`  | `/api/auth/google/callback` | Callback Google OAuth       | Public |

### Field Endpoint

| Method   | Endpoint                                 | Deskripsi                    | Akses    |
| -------- | ---------------------------------------- | ---------------------------- | -------- |
| `GET`    | `/api/fields`                            | Listing lapangan             | JWT      |
| `GET`    | `/api/fields/{id}`                       | Detail lapangan              | JWT      |
| `POST`   | `/api/fields`                            | Tambah lapangan              | JWT      |
| `PUT`    | `/api/fields/{id}`                       | Update lapangan              | JWT      |
| `DELETE` | `/api/fields/{id}`                       | Hapus / nonaktifkan lapangan | JWT      |
| `GET`    | `/api/fields/{id}/slots?date=2026-04-30` | Cek slot lapangan            | JWT      |
| `PATCH`  | `/api/fields/{id}/slots/{slotId}/status` | Update status slot           | Internal |

Contoh pagination dan filtering:

```text
GET /api/fields?page=1&per_page=5&sport_type=futsal&location=Jakarta
```

### Booking Endpoint

| Method  | Endpoint                      | Deskripsi                  | Akses |
| ------- | ----------------------------- | -------------------------- | ----- |
| `POST`  | `/api/bookings`               | Membuat booking            | JWT   |
| `GET`   | `/api/bookings`               | Listing booking            | JWT   |
| `GET`   | `/api/bookings/{id}`          | Detail booking             | JWT   |
| `PATCH` | `/api/bookings/{id}/cancel`   | Membatalkan booking        | JWT   |
| `POST`  | `/api/bookings/{id}/dp`       | Membayar DP                | JWT   |
| `POST`  | `/api/bookings/{id}/pay-full` | Membayar pelunasan         | JWT   |
| `GET`   | `/api/owner/dashboard`        | Dashboard pemilik lapangan | JWT   |

---

## Contoh Request

### Register

```json
{
  "name": "Syifa Nafisa",
  "email": "syifa@example.com",
  "username": "syifa",
  "password": "password123",
  "password_confirmation": "password123"
}
```

### Login

```json
{
  "identifier": "syifa@example.com",
  "password": "password123"
}
```

### Create Booking

```json
{
  "user_id": 1,
  "court_id": 1,
  "booking_date": "2026-04-30",
  "slot_ids": [1, 2],
  "notes": "Booking test via API Gateway"
}
```

### Pembayaran DP

```json
{
  "payment_method": "manual_transfer"
}
```

### Pelunasan

```json
{
  "payment_method": "manual_transfer"
}
```

---

## Autentikasi

Untuk endpoint protected, gunakan header:

```text
Authorization: Bearer <access_token>
```

### Aturan token

* Access token berlaku **15 menit**
* Refresh token berlaku **7 hari**
* Logout akan memasukkan token ke blacklist
* API Gateway juga memverifikasi blacklist ke Auth Service, sehingga token yang sudah logout **tidak dapat digunakan lagi**

---

## Google OAuth 2.0

Karena NIM berakhiran **genap**, OAuth provider yang digunakan adalah **Google OAuth 2.0**.

### Alur singkat

1. User mengakses endpoint `/api/auth/google/redirect`
2. User diarahkan ke halaman login Google
3. Google mengirim callback ke `/api/auth/google/callback`
4. Sistem memetakan akun Google ke user lokal
5. Sistem menghasilkan access token dan refresh token

Data Google yang digunakan:

* nama
* email
* avatar
* provider ID
* provider email

---

## Inter-Service Communication

Sistem ini menggunakan komunikasi antar-service berbasis REST API.

| Komunikasi                      | Fungsi                     |
| ------------------------------- | -------------------------- |
| Booking Service → Auth Service  | Validasi user              |
| Booking Service → Field Service | Validasi data lapangan     |
| Booking Service → Field Service | Validasi slot              |
| Booking Service → Field Service | Update status slot         |
| API Gateway → Auth Service      | Proxy endpoint auth        |
| API Gateway → Field Service     | Proxy endpoint field       |
| API Gateway → Booking Service   | Proxy endpoint booking     |
| API Gateway → Auth Service      | Verifikasi blacklist token |

---

## Rate Limiting

API Gateway menerapkan rate limiting:

```text
60 request per menit per IP
```

Jika limit terlampaui, gateway akan mengembalikan response seperti berikut:

```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## Postman Collection

File Postman collection tersedia pada:

```text
postman/collection.json
```

### Skenario pengujian utama

1. Register
2. Login
3. Get current user
4. Refresh token
5. Google OAuth
6. Listing field
7. Detail field
8. Cek slot
9. Create booking
10. Pembayaran DP
11. Pelunasan
12. Owner dashboard
13. Logout
14. Uji token setelah logout

---

## Dokumentasi

Dokumen pendukung project tersedia pada folder berikut:

* Diagram arsitektur: `docs/arsitektur.png`
* Laporan UTS: `docs/laporan-uts.pdf`
* Video demo: `https://youtu.be/rZxyVLOFcg8`

---

## Git Workflow

Repository ini menggunakan **Conventional Commits**.

Contoh commit yang digunakan:

```text
feat: setup Laravel auth-service project
feat: add auth service migrations and models
feat: implement jwt authentication with refresh and logout
feat: integrate Google OAuth authorization code flow
feat: setup field-service with Node Express and MySQL schema
feat: implement field CRUD with pagination and filtering
feat: setup booking-service with MySQL schema
feat: implement booking flow with inter-service validation
feat: setup API gateway with routing and JWT validation
feat: verify token blacklist through API gateway
docs: finalize README with setup instructions and API documentation
```

Branch yang digunakan selama pengembangan:

* `feature/field-service`
* `feature/booking-service`

Final submission menggunakan tag:

```text
submission-v1
```

---

## Catatan Keamanan

* File `.env` tidak disertakan di repository
* Secret disimpan hanya pada file `.env` lokal
* File referensi konfigurasi yang disediakan:

  * `.env.example`
  * `gateway/.env.example`
  * `services/auth-service/.env.example`
  * `services/field-service/.env.example`
  * `services/booking-service/.env.example`