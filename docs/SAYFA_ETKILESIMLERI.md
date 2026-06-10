# Sayfa 7, 8, 9 — Tıklama Davranışları

## 7. Danışmanlık (`#/danismanlik`)

| Öğe | Tıklanınca |
|-----|------------|
| **Sekmeler** (Talepler, Uzmanlar, Hizmetler, Randevular, Belgelerim) | İlgili panel açılır |
| **Yeni Talep Oluştur** | Modal form → gönderince listeye eklenir + toast |
| **Özet kartları** (Toplam/Açık/Devam/Tamamlanan) | Tabloyu duruma göre filtreler |
| **📄 Detay** | Talep detay modalı + kalıcı "Uzmana Yaz" mesaj akışı |
| **→ Git** | Uzmanlar sekmesine geçer |
| **Randevu kartı** | Randevu modalı: görüşme bağlantısını aç / yeni tarihi backend üzerine kaydet |
| **Uzman → Randevu Al** | Yeni talep modalı |
| **Hizmet → Talep Oluştur** | Modal, başlık otomatik dolar |
| **Belge ⬇ / 👁** | Belge özetini indir / belge bilgilerini önizle |

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
| **Sekmeler** (8 adet) | İlgili ayar panelini ve kaydedilmiş tercihleri açar |
| **Güncelle** | Profil düzenleme modalı → kaydet |
| **Sistem Bilgilerini İndir** | JSON dosyası indirilir |
| **Değiştir** (logo) | Dosya seç → optimize et → backend üzerine kalıcı kaydet |
| **Kaydet** (diğer sekmeler) | Tip doğrulamalı ayarları backend üzerine kalıcı olarak kaydeder |

## Veri bağlama

Danışmanlık, bildirim ve ayar etkileşimleri backend API üzerinden yürütülür ve operasyonel çalışma
deposunda kalıcı olarak saklanır.
