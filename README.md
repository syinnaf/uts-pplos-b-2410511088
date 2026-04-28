Nama: Syifa Nafisa
NIM: 2410511088
Kelas: B
Mata Kuliah: Pembangunan Perangkat Lunak Berorientasi Service
Studi Kasus: Sistem Booking Lapangan Olahraga
OAuth Provider: Google OAuth 2.0

## Deskripsi Singkat

SportFieldHub adalah sistem booking lapangan olahraga berbasis service-oriented architecture. Sistem ini menyediakan fitur listing lapangan, jadwal slot per jam, booking dengan DP, pembayaran lunas, autentikasi JWT, Google OAuth, dan dashboard pemilik lapangan.

## Arsitektur Service

Sistem terdiri dari:

1. API Gateway
   - Teknologi: Node.js Express
   - Fungsi: single entry point, routing, validasi JWT, rate limiting

2. Auth Service
   - Teknologi: Laravel 11
   - Fungsi: register, login, JWT, refresh token, logout, Google OAuth

3. Field Service
   - Teknologi: Node.js Express
   - Fungsi: venue, lapangan, slot jadwal, filtering, pagination

4. Booking Service
   - Teknologi: Node.js Express
   - Fungsi: booking, DP, pelunasan, dashboard owner

uts-pplos-b-2410511088/ 
├── README.md             #identitas, cara menjalankan, peta endpoint 
├── docker-compose.yml    #opsional namun direkomendasikan jika ingin 
├── gateway/              #konfigurasi API Gateway 
├── services/ 
│   ├── auth-service/     #JWT + OAuth 
│   ├── field-service/      #PHP MVC 
│   └── booking-service/      #bebas (Node) 
├── docs/ 
│   ├── laporan-uts.pdf 
│   └── arsitektur.png    #diagram arsitektur 
├── poster/ 
│   ├── poster-uts.pdf #bonus 
│   └── poster-uts.png #bonus 
└── postman/ 
    └── collection.json 