# Sayfa Etkileşimleri

## Finansal Senaryolar (`#/senaryolar`)

| Öğe | Tıklanınca / Değişince |
|-----|-------------------------|
| **Temkinli / Dengeli / İddialı** | Hazır varsayımlar yüklenir ve sonuçlar yeniden hesaplanır |
| **Varsayım alanları** | Emisyon azaltımı, kota etkisi, geri ödeme, ROI ve NPV anlık güncellenir |
| **Karbon referans değerini dahil et** | Karbon referans değeri ROI, geri ödeme ve NPV hesabına eklenir veya çıkarılır |
| **Sunucuda Doğrula** | Varsayımlar backend tarafından doğrulanır ve sonuçlar sunucuda yeniden hesaplanır |
| **Senaryoyu Kaydet** | Varsayımlar ve hesaplanan sonuçlar kalıcı olarak kaydedilir |
| **JSON İndir** | Güncel senaryo bağlamı, varsayımları ve sonuçları JSON olarak indirilir |
| **Kayıt geçmişi → Yükle** | Kaydedilmiş senaryo yeniden çalışma alanına yüklenir |

## 7. Danışmanlık (`#/danismanlik`)

| Öğe | Tıklanınca |
|-----|------------|
| **Sekmeler** (Talepler, Uzmanlar, Hizmetler, Randevular, Belgelerim) | İlgili panel açılır |
| **Yeni Talep Oluştur** | Form gönderildiğinde talep listeye eklenir ve bildirim gösterilir |
| **Özet kartları** (Toplam/Açık/Devam/Tamamlanan) | Tabloyu duruma göre filtreler |
| **📄 Detay** | Talep ayrıntı penceresi açılır ve kalıcı "Uzmana Yaz" mesaj akışı sunulur |
| **→ Git** | Uzmanlar sekmesine geçer |
| **Randevu kartı** | Randevu penceresi açılır; görüşme bağlantısı kullanılabilir veya yeni tarih sunucuda kaydedilebilir |
| **Uzman → Randevu Al** | Seçilen uzmanla yeni talep formu açılır |
| **Hizmet → Talep Oluştur** | Talep formu açılır ve başlık otomatik doldurulur |
| **Belge ⬇ / 👁** | Belge özetini indir / belge bilgilerini önizle |

## 8. Bildirimler (`#/bildirimler`)

| Öğe | Tıklanınca |
|-----|------------|
| **Sekmeler** (Tümü, Uyarılar, …) | Listeyi kategoriye göre filtreler |
| **Tümünü Okundu İşaretle** | Tüm bildirimler okundu olarak işaretlenir |
| **Bildirim kartı** | Ayrıntı penceresi açılır ve bildirim okundu olarak işaretlenir |
| **Modüle Git** (duyuru) | İlgili sayfaya yönlendirir (`#/raporlama`) |

## 9. Ayarlar (`#/ayarlar`)

| Öğe | Tıklanınca |
|-----|------------|
| **Sekmeler** (8 adet) | İlgili ayar panelini ve kaydedilmiş tercihleri açar |
| **Güncelle** | Profil düzenleme penceresi açılır ve değişiklikler kaydedilir |
| **Sistem Bilgilerini İndir** | JSON dosyası indirilir |
| **Değiştir** (logo) | Dosya seç → optimize et → sunucuda kalıcı olarak kaydet |
| **Kaydet** (diğer sekmeler) | Tip doğrulamalı ayarları sunucuda kalıcı olarak kaydeder |

## Veri bağlama

Danışmanlık, bildirim ve ayar etkileşimleri backend API üzerinden yürütülür ve operasyonel çalışma
deposunda kalıcı olarak saklanır.
