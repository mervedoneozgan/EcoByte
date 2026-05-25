# Sayfa 7, 8, 9 — Tıklama Davranışları

## 7. Danışmanlık (`#/danismanlik`)

| Öğe | Tıklanınca |
|-----|------------|
| **Sekmeler** (Talepler, Uzmanlar, Hizmetler, Randevular, Belgelerim) | İlgili panel açılır |
| **Yeni Talep Oluştur** | Modal form → gönderince listeye eklenir + toast |
| **Özet kartları** (Toplam/Açık/Devam/Tamamlanan) | Tabloyu duruma göre filtreler |
| **📄 Detay** | Talep detay modalı + "Uzmana Yaz" |
| **→ Git** | Uzmanlar sekmesine geçer |
| **Randevu kartı** | Randevu modalı: Katıl / Yeniden planla |
| **Uzman → Randevu Al** | Yeni talep modalı |
| **Hizmet → Talep Oluştur** | Modal, başlık otomatik dolar |
| **Belge ⬇ / 👁** | İndir / önizle toast (API bekleniyor) |

## 8. Bildirimler (`#/bildirimler`)

| Öğe | Tıklanınca |
|-----|------------|
| **Sekmeler** (Tümü, Uyarılar, …) | Listeyi kategoriye göre filtreler |
| **Tümünü Okundu İşaretle** | Tüm yeşil noktalar kalkar |
| **Bildirim kartı** | Detay modalı + okundu işaretlenir |
| **Modüle Git** (duyuru) | İlgili sayfaya yönlendirir (`#/raporlama`) |

## 9. Ayarlar (`#/ayarlar`)

| Öğe | Tıklanınca |
|-----|------------|
| **Sekmeler** (8 adet) | İlgili ayar paneli (diğerleri placeholder) |
| **Güncelle** | Profil düzenleme modalı → kaydet |
| **Sistem Bilgilerini İndir** | JSON dosyası indirilir |
| **Değiştir** (logo) | Dosya seç → önizleme güncellenir |
| **Yapılandır** (diğer sekmeler) | "Backend hazır olunca" toast |

## Veri bağlama

Backend hazır olunca aynı endpoint'ler:

- `GET /api/consultancy`
- `GET /api/notifications`
- `POST` endpoint'leri sonradan eklenebilir

Frontend: `src/pages/*.js` içindeki `init*Page()` fonksiyonları API çağrılarıyla güncellenir.
