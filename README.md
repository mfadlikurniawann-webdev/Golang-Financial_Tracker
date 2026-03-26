# 💰 FinTrack — Aplikasi Pencatat Keuangan

Aplikasi web pencatat keuangan pribadi berbasis React + Supabase.

## Fitur
- ✅ Dashboard ringkasan dengan grafik arus kas
- ✅ Pencatatan transaksi pemasukan & pengeluaran
- ✅ Kategorisasi otomatis dengan 12 kategori default
- ✅ Anggaran per kategori dengan progress bar
- ✅ Laporan visual: bar chart, donut chart, tren kekayaan
- ✅ Autentikasi Email + Google OAuth
- ✅ Responsif untuk mobile & desktop
- ✅ CI/CD otomatis via GitHub Actions + Vercel

---

## Tech Stack

| Layer     | Teknologi                              |
|-----------|----------------------------------------|
| Frontend  | React 18 + Vite 5                      |
| Styling   | Tailwind CSS 3                         |
| Charts    | Recharts 2                             |
| Backend   | Supabase (PostgreSQL + Auth + RLS)     |
| Hosting   | Vercel                                 |
| CI/CD     | GitHub Actions                         |

---

## Cara Setup Lokal

### 1. Clone & Install
```bash
git clone https://github.com/username/financial-tracker.git
cd financial-tracker
npm install
```

### 2. Setup Supabase
1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Buka **SQL Editor** → New Query
4. Copy-paste isi file `supabase-schema.sql` → klik **Run**
5. Buka **Project Settings** → **API** → catat:
   - Project URL
   - anon/public key

### 3. Setup Google OAuth (opsional)
1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Buat project → **APIs & Services** → **Credentials**
3. Buat **OAuth 2.0 Client ID** (tipe: Web Application)
4. Tambah Authorized redirect URI:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
5. Catat Client ID & Client Secret
6. Di Supabase: **Authentication** → **Providers** → **Google** → aktifkan → isi Client ID & Secret

### 4. Buat file .env.local
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Jalankan dev server
```bash
npm run dev
# Buka http://localhost:5173
```

---

## Deploy ke Vercel

### Via Vercel Dashboard (mudah)
1. Push kode ke GitHub
2. Buka [vercel.com](https://vercel.com) → **New Project** → Import dari GitHub
3. Framework: **Vite** (auto-detect)
4. **Environment Variables** → tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Klik **Deploy**

### Via GitHub Actions (otomatis)
Tambahkan secrets di GitHub repo → **Settings** → **Secrets** → **Actions**:

| Secret Name            | Cara mendapatkan                                      |
|------------------------|-------------------------------------------------------|
| `VERCEL_TOKEN`         | vercel.com → Settings → Tokens → Create               |
| `VERCEL_ORG_ID`        | `vercel env pull` lalu lihat `.vercel/project.json`   |
| `VERCEL_PROJECT_ID`    | sama seperti di atas                                  |
| `VITE_SUPABASE_URL`    | Supabase → Project Settings → API                     |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API                  |

Setelah itu setiap `git push` ke `main` akan otomatis deploy!

### Update Supabase Auth URL setelah deploy
Di Supabase Dashboard → **Authentication** → **URL Configuration**:
```
Site URL: https://nama-project-kamu.vercel.app
Redirect URLs: https://nama-project-kamu.vercel.app/**
```

---

## Struktur Project

```
src/
├── components/
│   ├── Layout.jsx           # Sidebar + navigation
│   ├── TransactionForm.jsx  # Modal tambah/edit transaksi
│   └── TransactionList.jsx  # Daftar transaksi per tanggal
├── context/
│   └── AuthContext.jsx      # Global auth state
├── hooks/
│   ├── useTransactions.js   # CRUD transaksi
│   ├── useCategories.js     # Manajemen kategori
│   └── useBudgets.js        # CRUD anggaran
├── lib/
│   ├── supabase.js          # Supabase client
│   └── utils.js             # Format Rupiah, tanggal, dll
└── pages/
    ├── Login.jsx            # Halaman login/register
    ├── Dashboard.jsx        # Ringkasan + grafik
    ├── Transactions.jsx     # Daftar transaksi + filter
    ├── Budgets.jsx          # Manajemen anggaran
    └── Reports.jsx          # Laporan & analisis
```

---

## Lisensi
MIT
