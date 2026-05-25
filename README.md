# EcoByte — Karbon Yönetim Platformu

TÜBİTAK projesi kapsamında geliştirilen karbon emisyon yönetim dashboard'u.

**Frontend:** Vanilla JavaScript + Tailwind CSS + Vite  
**Backend:** Node.js + Express (mock API — veritabanı bağlantısı eklenecek)  
**Veritabanı:** PostgreSQL (`database/` klasörü — şema sizin tarafınızdan)

---

## Teknoloji

| Katman | Kullanılan |
|--------|------------|
| Arayüz | HTML, CSS (Tailwind 4), JavaScript (ES modules) |
| Build | Vite 8 |
| Grafikler | Chart.js |
| API | Express 4 + CORS |
| (Planlanan) DB | PostgreSQL |

> Grafikler için isteğe bağlı **ApexCharts** eklenebilir: `npm install apexcharts`

---

## Proje yapısı

```
ecobyte/
├── database/                 # PostgreSQL şema & seed (siz ekleyeceksiniz)
│   └── README.md
├── backend/
│   ├── src/
│   │   ├── index.js          # Express sunucu
│   │   ├── data/mockData.js  # Geçici mock JSON
│   │   └── routes/           # API route'ları
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── ecobyte-logo-transparent.png
│   └── src/
│       ├── main.js
│       ├── app.js
│       ├── router.js           # Hash tabanlı sayfa yönlendirme
│       ├── api/client.js       # Backend istekleri
│       ├── pages/              # Sayfa HTML + etkileşimler
│       ├── render/             # Sidebar, header, KPI, grafikler
│       ├── charts/chartSetup.js
│       ├── data/mock*.js       # Backend yokken örnek veri
│       ├── styles/brand.css    # Marka renkleri
│       └── utils/              # ui (modal/toast), navigation, logo
├── docs/
│   └── SAYFA_ETKILESIMLERI.md  # Sayfa 7-8-9 tıklama davranışları
└── README.md
```

---

## Sayfalar (sol menü)

| # | Sayfa | Hash route | Durum |
|---|--------|------------|--------|
| 1 | Genel Bakış | `#/` | Tam dashboard (KPI, grafikler, AI içgörüler) |
| 2–6 | Emisyon, Raporlama, Kota, Ticaret, Senaryolar, AI | `#/emisyon` … | Placeholder |
| **7** | **Danışmanlık** | `#/danismanlik` | Talepler, uzmanlar, randevular, belgeler |
| **8** | **Bildirimler** | `#/bildirimler` | Filtreli bildirim listesi |
| **9** | **Ayarlar** | `#/ayarlar` | Profil, sistem, logo |

Tıklanabilir öğelerin detaylı listesi: [docs/SAYFA_ETKILESIMLERI.md](docs/SAYFA_ETKILESIMLERI.md)

---

## Kurulum ve çalıştırma

### Gereksinimler

- Node.js 18+
- npm

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Tarayıcı: **http://localhost:5173** (port doluysa 5174)

Production build:

```bash
npm run build
npm run preview
```

### 2. Backend (isteğe bağlı)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: **http://localhost:5000**

- Backend **çalışıyorsa** → frontend API'den veri çeker  
- Backend **kapalıysa** → `frontend/src/data/mock*.js` kullanılır (sarı uyarı bandı görünmez)

---

## API uç noktaları

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/health` | Sunucu durumu |
| GET | `/api/dashboard/company` | Firma bilgisi |
| GET | `/api/dashboard/summary` | KPI özet |
| GET | `/api/dashboard/trend` | Emisyon trendi |
| GET | `/api/dashboard/distribution` | Emisyon dağılımı |
| GET | `/api/dashboard/scenarios` | Finansal senaryolar |
| GET | `/api/dashboard/ai-insights` | AI içgörüleri |
| GET | `/api/consultancy` | Danışmanlık sayfası verisi |
| GET | `/api/notifications` | Bildirimler |
| GET | `/api/settings` | Ayarlar |

Vite dev sunucusu `/api` isteklerini `localhost:5000`'e proxy eder.

---

## Marka renkleri

Tanımlı dosya: `frontend/src/styles/brand.css`

| Kullanım | Hex | CSS değişkeni |
|----------|-----|----------------|
| Primary Button | `#67D2F5` | `--color-primary` |
| Hover | `#42B7D6` | `--color-hover` |
| Accent | `#A5F279` | `--color-accent` |
| Secondary Accent | `#6DCC5B` | `--color-secondary` |
| Light Text | `#BDF4FF` | `--color-text` |

Gradient: `linear-gradient(135deg, #67D2F5 0%, #42B7D6 55%, #A5F279 100%)`

Logo: `frontend/public/ecobyte-logo-transparent.png` (şeffaf arka plan)

---

## Veri bağlama (backend / database)

1. **`database/`** — `schema.sql`, `seed.sql` yazın  
2. **`backend/src/routes/`** — `mockData.js` yerine PostgreSQL sorguları  
3. **`backend/src/db.js`** — bağlantı modülü ekleyin (pg)  
4. Frontend **`api/client.js`** endpoint yolları aynı kalabilir  

Frontend sayfa mantığı:

- `pages/consultancy.js` → `initConsultancyPage()`
- `pages/notifications.js` → `initNotificationsPage()`
- `pages/settings.js` → `initSettingsPage()`

Bu dosyalardaki demo işlemler gerçek `POST/PUT` API çağrılarıyla değiştirilir.

---

## Ekip notları

- **Frontend (Merve & Şeyma):** Tailwind + JS ile arayüz; `pages/` ve `index.css` üzerinde çalışın  
- **Veri tarafı:** `database/` + `backend/` — API'yi bağlayınca mock kaldırılır  
- **Grafik:** Chart.js hazır; ApexCharts tercih edilebilir  

---

## GitHub

```bash
git init
git add .
git commit -m "EcoByte: frontend + backend iskelet"
git remote add origin https://github.com/mervedoneozgan/EcoByte.git
git branch -M main
git push -u origin main
```

`.gitignore` kök dizinde — `node_modules`, `.env`, `dist` hariç tutulur.
