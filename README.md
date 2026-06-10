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

## 2024-2025 Kurumsal Emisyon Kotaları

Platformdaki `1.327,153 tCO2e` ve `2.052,333 tCO2e` kota limitleri, sırasıyla 2024 ve 2025 yıllarında ölçülen elektrik ve doğal gaz kaynaklı Kapsam 1+2 emisyonlarına tam `%5` azaltım uygulanarak hesaplanır. Bu kurumsal kotalar, resmî ETS tahsisinden ayrı tutulur.

Dönemi doğrulanmamış yakıt emisyonları kota kullanımına dahil edilmez. GES kaynaklı kaçınılan emisyon pozitif etki olarak ayrı izlenir ve brüt emisyonlardan düşülmez. Resmî ETS tahsisi belgelenene kadar satılabilir kota ve tahmini ticaret geliri `0` olarak hesaplanır.

Dashboard dağılımı yıllık çalışır: 2024 ve 2025 butonları ilgili yılın elektrik, doğalgaz ve dönem atanmamış yakıt emisyonlarını birlikte gösterir. Dönemi bilinmeyen yakıt ayrı bir dilim olarak gösterilir. Kota karşılaştırması da yalnızca aynı yıl için hem kota hem gerçekleşen emisyon bulunduğunda aşım veya kalan üretir.

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
