# Postman Testing Evidence

Folder ini berisi dokumentasi pengujian API SportFieldHub menggunakan Postman.

## Isi Folder

- `collection.json` berisi Postman Collection untuk pengujian endpoint utama.
- Folder `screenshots/` berisi screenshot hasil pengujian endpoint.

## Skenario Screenshot

1. Register user
2. Login user dan mendapatkan access token serta refresh token
3. Get current user menggunakan JWT
4. Refresh token
5. Google OAuth 2.0
6. Listing lapangan dengan pagination dan filtering
7. Detail lapangan
8. Cek slot lapangan berdasarkan tanggal
9. Create booking
10. Pembayaran DP
11. Pelunasan
12. Owner dashboard
13. Logout
14. Token revoked setelah logout

Seluruh endpoint utama diuji melalui API Gateway pada port `8000`.