# Sayfaları ayrı branch ile gönderme

Merve'nin sistemi: `main` ← dokunma · `develop` ← birleştirme · `feature/...` ← senin işin

## Branch isimleri (öneri)

| Sayfa | Branch adı |
|-------|------------|
| 7 – Danışmanlık | `feature/ConsultancyPage-7` |
| 8 – Bildirimler | `feature/NotificationsPage-8` |
| 9 – Ayarlar | `feature/SettingsPage-9` |

## Sıra (önemli)

1. Önce **Sayfa 7** PR → `develop`
2. Merve merge edince → `git pull origin develop`
3. Sonra **Sayfa 8** PR
4. Merge sonrası → **Sayfa 9** PR

> Eski tek branch `feature/pages-7-8-9` varsa PR'ı kapatın veya kullanmayın.

## Hangi dosyalar hangi sayfada?

### Sayfa 7
- `frontend/src/pages/consultancy.js`
- Danışmanlık verisi backend API üzerinden yüklenir.
- `backend/src/routes/consultancy.js`
- `docs/SAYFA_ETKILESIMLERI.md` (7. bölüm)

### Sayfa 8
- `frontend/src/pages/notifications.js`
- Bildirim verisi backend API üzerinden yüklenir.
- `backend/src/routes/notifications.js`

### Sayfa 9
- `frontend/src/pages/settings.js`
- Ayar verisi backend API üzerinden yüklenir.
- `backend/src/routes/settings.js`
- `frontend/src/utils/ecobyteLogo.js`
- `frontend/public/ecobyte-logo-transparent.png`

### Ortak (her PR'da veya ilk PR'da)
- `frontend/src/router.js`, `navigation.js`, `api/client.js`, `utils/ui.js`
- `frontend/src/render/sidebar.js`, `app.js`, `main.js`, `index.css`, `styles/brand.css`
- `backend/src/index.js`, `backend/src/data/platformData.js`
- Dashboard vb. (`pages/dashboard.js`, `render/*`, `charts/*`)

İlk PR (Sayfa 7) tüm proje iskeletini içerir; 8 ve 9 sonraki PR'larda sadece kendi dosyalarını ekler.
