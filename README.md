# EcoByte Karbon Yönetim Platformu

EcoByte; enerji tüketimi, GES üretimi, karbon emisyonu, kota yönetimi ve kurumsal raporlamayı tek platformda birleştirir.

Platform yalnızca backend API üzerinden gerçek kaynak verilerini kullanır. Backend erişilemezse arayüz yerel örnek veriye geçmez; bağlantı hatasını açıkça gösterir.

## Teknoloji

- Frontend: Vanilla JavaScript, Vite, Chart.js
- Backend: Node.js, Express
- PDF raporlama: Python 3, ReportLab ve pypdf kalite denetimi
- Kaynak veri: `backend/data/energy/` altındaki doğrulanan CSV dosyaları
- Oturum: süreli ve yeniden başlatmalarda korunan sunucu oturumu
- Operasyonel kayıtlar: atomik olarak `backend/.runtime/operational-state.json` dosyasında saklanır

## Çalıştırma

Backend:

```powershell
cd backend
npm install
py -3 -m pip install -r requirements.txt
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

- Platform: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:5002`

## Gerçek Veri Akışı

Enerji kaynak dosyalarının tamamı backend tarafından okunur, SHA-256 parmak izleri ve satır kontrolleriyle doğrulanır. Hesaplanan ana kaynaklar:

- Elektrik tüketimi ve Kapsam 2 emisyonu
- Doğalgaz tüketimi ve Kapsam 1 emisyonu
- Mazot, benzin ve LPG emisyonları
- GES üretimi ve ayrı gösterilen pozitif etki

Tüm ham kayıtlar, faktörler, formüller ve doğrulama uyarıları platformdaki **Veri ve Formüller** sayfasında görülebilir.

## 5.000 tCO2e Kurumsal Emisyon Kotası

Platformdaki kurumsal kota limiti `5.000 tCO2e` olarak sabitlenmiştir. Bu kurumsal kota planı, resmî ETS tahsisinden ayrı tutulur.

Dönemi doğrulanmamış yakıt emisyonları kota kullanımına dahil edilmez. GES kaynaklı kaçınılan emisyon pozitif etki olarak ayrı izlenir ve brüt emisyonlardan düşülmez. Resmî ETS tahsisi belgelenene kadar satılabilir kota ve tahmini ticaret geliri `0` olarak hesaplanır.

Dashboard dağılım görünümü, seçilen yılın elektrik ve doğalgaz emisyonlarını dönem atanmamış yakıt emisyonlarıyla birlikte gösterir. Dönemi bilinmeyen yakıt ayrı bir dilimdir; seçilen yılın yıllık toplamına ve kota kullanımına dahil edilmez. Kota karşılaştırması her iki yıl için de `5.000 tCO2e` limiti üzerinden yapılır.

Kota sayfasındaki finansal etki, seçilen yılın kota farkını referans karbon fiyatıyla çarpar. Kota altında kalan miktar için referans değer, aşım durumunda tahmini aşım karşılığı gösterilir. Bu tutarlar resmî ETS tahsisi, satılabilir hak, kesinleşmiş gelir veya ceza değildir.

Emisyon Ticareti sayfasında kota altında kalan miktar **satılabilir kota adayı** olarak görünür. Resmî satılabilir ETS kotası ve emir verilebilir kapasite, yalnızca belgelenmiş ETS tahsisi varsa sıfırdan farklı hesaplanır.

Finansal Senaryolar sayfasında elektrik ve doğalgaz azaltım oranları, yatırım, yıllık operasyonel tasarruf, analiz süresi, iskonto oranı ve karbon referans fiyatı değiştirilebilir. Platform; emisyon azaltımı, senaryo sonrası kota bakiyesi, ek kota hareket alanı, geri ödeme süresi, ROI ve net bugünkü değeri anlık hesaplar. Hesap sunucuda doğrulanabilir, JSON olarak indirilebilir ve sonuçlarıyla birlikte kalıcı kaydedilebilir.

Kota planları, satış emirleri, danışmanlık talepleri, bildirim durumları, ayarlar ve rapor arşivi backend yeniden başlatıldığında kaybolmaz. Rapor metrikleri her açılışta güncel gerçek envanterden yeniden hesaplanır. Farklı bir çalışma verisi konumu için `OPERATIONAL_STORE_PATH` tanımlanabilir.

Danışmanlık ekranında talep mesajları, randevu yeniden planlama/katılım kayıtları ve belge özetleri API
üzerinden çalışır. Ayarlar ekranındaki kullanıcı, yetki, bildirim, entegrasyon, veri, güvenlik ve
yedekleme tercihleri tip doğrulamasıyla kalıcı olarak kaydedilir.
Marka logosu yüklenirken tarayıcıda optimize edilir, backend üzerinde saklanır ve sonraki oturumlarda
otomatik olarak geri yüklenir.

## Kurumsal PDF Raporları

Raporlama sayfasındaki PDF dosyaları indirildiği anda gerçek envanterden oluşturulur. PDF içeriği:

- Yönetici özeti
- Elektrik, doğalgaz ve yakıt emisyon dağılımı
- Aylık enerji ve emisyon tablosu
- GES üretim özeti
- Matematiksel formüller
- Emisyon faktörleri ve güncellik bilgisi
- Veri kalitesi kontrolleri ve denetim izi

PDF motoru Python 3 ile çalışır. Üretim sonunda her sayfa pypdf ile denetlenir; 12 sayfadan kısa, boş veya gereksiz seyrek raporlar API tarafından reddedilir. Windows dışında `PYTHON3_BIN=python3` tanımlanabilir.

İlgili API uçları:

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/reports` | Gerçek envanterden oluşturulabilir raporları listeler |
| POST | `/api/reports` | Güncel envanter için yeni rapor kaydı oluşturur |
| GET | `/api/reports/:id/pdf` | Kurumsal PDF raporu üretir ve indirir |
| GET | `/api/data-catalog` | Ham veriler, formüller ve doğrulama kayıtları |
| GET | `/api/emissions` | Hesaplanan emisyon envanteri |

## Doğrulama

```powershell
cd backend
npm test

cd ../frontend
npm run lint
npm test
npm run build
```
