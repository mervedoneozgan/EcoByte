# Veri Saklama

EcoByte şu anda harici PostgreSQL bağlantısı kullanmaz.

- Denetlenebilir enerji kaynakları: `backend/data/energy/*.csv`
- Kullanıcı ve oturum kayıtları: `backend/.runtime/auth-users.json` ve oturum dosyası
- Operasyonel kayıtlar: `backend/.runtime/operational-state.json`

Çalışma verisi dosyaları atomik yazılır ve Git'e dahil edilmez. Üretimde konumları
`AUTH_USER_STORE_PATH`, `AUTH_SESSION_STORE_PATH` ve `OPERATIONAL_STORE_PATH`
ortam değişkenleriyle kalıcı, yedeklenen bir diske yönlendirilmelidir.
