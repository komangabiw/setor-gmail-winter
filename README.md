# 🚀 Setor Gmail Winter

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=flat&logo=cloudflare)](https://pages.cloudflare.com/)
[![OWASP Secured](https://img.shields.io/badge/OWASP-Top%2010%20Compliant-shield?style=flat&color=brightgreen)](#-security--hardening)

**Setor Gmail Winter** adalah platform web modern untuk layanan setor akun Gmail secara aman, cepat, dan transparan. Dibangun dengan performa tinggi, optimasi caching global, proteksi anti-fraud, dan enkripsi tingkat tinggi berbasis standar OWASP Top 10.

---

## 🇲🇨 Bahasa Indonesia

### ✨ Fitur Utama
- **Autentikasi Aman:** Login praktis via Google OAuth & Supabase Auth.
- **Setor Gmail & Tracking Realtime:** Pemrosesan status setoran (Pending, Di Cek, Diterima, Ditolak) secara transparan.
- **Manajemen E-Wallet & Penarikan Saldo:** Pengelolaan akun DANA, OVO, GoPay, ShopeePay dengan validasi nomor otomatis.
- **Program Referral & Bonus:** Misi ajak teman dengan skema tracking bonus dan kode referral unik di halaman Profil.
- **Keamanan OWASP Top 10 & Anti-Fraud:** Proteksi transaksi atomic (Anti-Double Spending), rate-limiting penarikan saldo, verifikasi webhook signature, dan security headers.

### 🛠️ Tech Stack
- **Framework:** Next.js (App Router, React 19)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, RPC Atomic Functions)
- **Deployment & Edge:** Cloudflare Pages & Cloudflare Workers
- **Styling & UI:** Tailwind CSS, Lucide Icons, Skeleton Loaders
- **Security & Validation:** Zod Schema Validation, OWASP Hardening, Custom Security Headers

---

## 🇬🇧 English

### ✨ Key Features
- **Secure Authentication:** Seamless login via Google OAuth & Supabase Auth.
- **Gmail Deposit & Realtime Tracking:** Transparent status tracking (Pending, Checking, Approved, Rejected).
- **E-Wallet & Withdrawal Management:** Manage DANA, OVO, GoPay, and ShopeePay accounts with automated validation.
- **Referral Program & Bonuses:** Invite friends mission with unique referral codes and bonus tracking built into the Profile section.
- **OWASP Top 10 Security & Anti-Fraud:** Atomic transaction processing (Anti-Double Spending), withdrawal rate-limiting, webhook signature verification, and HTTP security headers.

### 🛠️ Tech Stack
- **Framework:** Next.js (App Router, React 19)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, RPC Atomic Functions)
- **Deployment & Edge:** Cloudflare Pages & Cloudflare Workers
- **Styling & UI:** Tailwind CSS, Lucide Icons, Skeleton Loaders
- **Security & Validation:** Zod Schema Validation, OWASP Hardening, Custom Security Headers

---

## 🛡️ Security & Hardening

Proyek ini telah melalui audit dan hardening keamanan komprehensif:
- **A01 & A07 (Access Control & Auth):** Verifikasi sesi pengguna server-side via `supabase.auth.getUser()` untuk mencegah IDOR.
- **A02 (Secrets Protection):** Enkripsi kunci rahasia dan pengisolasian `SUPABASE_SERVICE_ROLE_KEY` pada Server-Side saja.
- **A03 (Input Sanitization):** Sanitasi input teks dari XSS/Injeksi dan validasi tipe data ketat via Zod.
- **A04 (Anti-Double Spending):** Pemotongan saldo *atomic* di PostgreSQL database level untuk mencegah *race conditions*.
- **A10 & Fraud Protection:** Verifikasi token pada webhook payment gateway (Flip) & pembatasan frekuensi penarikan saldo (max 3x / 24 jam).

---

## 🚀 Getting Started (Development)

1. **Clone repository:**
   ```bash
   git clone https://github.com/komangabiw/setor-gmail-winter.git
   cd setor-gmail-winter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   Buat file `.env.local` dan isi kredensial Supabase serta Telegram:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   ```

4. **Jalankan development server:**
   ```bash
   npm run dev
   ```
