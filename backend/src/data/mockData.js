/** Geçici mock veriler — veritabanı bağlandığında route'lardan kaldırılacak */

export const company = {
  name: 'Eco Demo A.Ş.',
  sector: 'Kimya',
  export_status: 'AB İhracatçı',
  slogan: 'Daha az emisyon, daha iyi gelecek',
};

export const dashboard = {
  company,
  summary: {
    totalEmission: 12450,
    trendPercent: 8.3,
    quotaLimit: 15000,
    usedPercent: 83,
    remaining: 2550,
    quotaStatus: 'AŞILMADI',
    quotaExceeded: false,
    potentialProfit: 125480,
    marketPrice: 25.4,
    sellableSurplus: 2550,
    estimatedTradingProfit: 64770,
  },
  trend: [
    { month: 'Ara', actual: 9800, quota: 12500 },
    { month: 'Oca', actual: 10200, quota: 12500 },
    { month: 'Şub', actual: 10800, quota: 12500 },
    { month: 'Mar', actual: 11500, quota: 12500 },
    { month: 'Nis', actual: 11800, quota: 12500 },
    { month: 'May', actual: 12450, quota: 12500 },
  ],
  distribution: {
    total: 12450,
    items: [
      { name: 'Enerji Kullanımı', value: 5229, percent: 42, color: '#67D2F5' },
      { name: 'Üretim Süreçleri', value: 3486, percent: 28, color: '#42B7D6' },
      { name: 'Lojistik', value: 2116.5, percent: 17, color: '#A5F279' },
      { name: 'Atık Yönetimi', value: 996, percent: 8, color: '#6DCC5B' },
      { name: 'Diğer', value: 622.5, percent: 5, color: '#2E8FB0' },
    ],
  },
  scenarios: [
    { type: 'base', label: 'Temel', value: 125480, trend: [45, 52, 48, 55, 60, 58, 62, 65] },
    { type: 'pessimistic', label: 'Kötümser', value: 98500, trend: [60, 58, 55, 52, 50, 48, 45, 42] },
    { type: 'optimistic', label: 'İyimser', value: 158200, trend: [40, 45, 50, 55, 60, 68, 72, 78] },
  ],
  aiInsights: [
    { type: 'suggestion', title: 'Azaltım Önerisi', description: 'Enerji verimliliği ile %12 azaltım mümkün.', impact: '1.494 tCO2e/ay' },
    { type: 'risk', title: 'Risk Uyarısı', description: 'Haziran ayında kota aşım riski %78.', impact: 'Kota aşımı riski' },
    { type: 'opportunity', title: 'Fırsat Analizi', description: 'Yenilenebilir enerji yatırımı potansiyeli.', impact: '+2.100.000 €' },
  ],
};

export const consultancy = {
  summary: { total: 18, open: 6, ongoing: 7, completed: 5 },
  requests: [
    { id: 1, title: 'Karbon Ayak İzi Analizi', expert: 'Dr. Ahmet Yılmaz', date: '25.05.2024', status: 'ongoing', statusLabel: 'Devam Ediyor' },
    { id: 2, title: 'Sürdürülebilirlik Stratejisi', expert: 'Dr. Elif Kaya', date: '20.05.2024', status: 'open', statusLabel: 'Açık' },
    { id: 3, title: 'Enerji Verimliliği Danışmanlığı', expert: 'Mehmet Demir', date: '15.05.2024', status: 'ongoing', statusLabel: 'Devam Ediyor' },
    { id: 4, title: 'Emisyon Azaltım Planı', expert: 'Dr. Ahmet Yılmaz', date: '10.05.2024', status: 'completed', statusLabel: 'Tamamlandı' },
  ],
  experts: [
    { id: 1, name: 'Dr. Ahmet Yılmaz', specialty: 'Karbon Muhasebesi', rating: 4.9, requests: 12 },
    { id: 2, name: 'Dr. Elif Kaya', specialty: 'Sürdürülebilirlik', rating: 4.8, requests: 9 },
    { id: 3, name: 'Mehmet Demir', specialty: 'Enerji Verimliliği', rating: 4.7, requests: 7 },
  ],
  services: [
    { id: 1, name: 'Karbon Ayak İzi Analizi', duration: '2-4 hafta', price: '15.000 ₺' },
    { id: 2, name: 'Sürdürülebilirlik Stratejisi', duration: '4-6 hafta', price: '28.000 ₺' },
    { id: 3, name: 'Enerji Verimliliği Danışmanlığı', duration: '3 hafta', price: '12.500 ₺' },
    { id: 4, name: 'Emisyon Azaltım Planı', duration: '6 hafta', price: '35.000 ₺' },
  ],
  documents: [
    { id: 1, name: 'Karbon Raporu 2024 Q1.pdf', date: '15.05.2024', size: '2.4 MB' },
    { id: 2, name: 'Danışmanlık Sözleşmesi.pdf', date: '01.05.2024', size: '890 KB' },
    { id: 3, name: 'Emisyon Azaltım Taslağı.docx', date: '22.05.2024', size: '1.1 MB' },
  ],
  appointments: [
    { expert: 'Dr. Ahmet Yılmaz', service: 'Karbon Ayak İzi Analizi', datetime: '01.06.2024, 10:00', avatar: 'AY' },
    { expert: 'Dr. Elif Kaya', service: 'Sürdürülebilirlik Stratejisi', datetime: '05.06.2024, 14:30', avatar: 'EK' },
    { expert: 'Mehmet Demir', service: 'Enerji Verimliliği', datetime: '08.06.2024, 11:00', avatar: 'MD' },
  ],
};

export const notifications = {
  items: [
    { id: 0, category: 'duyuru', type: 'announcement', title: 'Yeni Karbon Raporlama Modülü', description: '2024 Q2 raporlama modülü yayında.', time: '01.06.2024', unread: true, actionLabel: 'Modüle Git', actionRoute: 'reporting' },
    { id: 1, category: 'uyari', type: 'warning', title: 'Yüksek Emisyon Uyarısı', description: 'Mayıs 2024 emisyon değerleriniz %12 artış gösterdi.', time: '10:30', unread: true },
    { id: 2, category: 'hatirlatma', type: 'reminder', title: 'Kota Kullanım Hatırlatması', description: 'Yıllık kota kullanımınız %80 seviyesine ulaştı.', time: '31.05.2024', unread: false },
    { id: 3, category: 'hatirlatma', type: 'reminder', title: 'Rapor Teslim Hatırlatması', description: '2024 Q1 Sürdürülebilirlik Raporu son teslim 15.06.2024.', time: '31.05.2024', unread: false },
    { id: 4, category: 'uyari', type: 'alert', title: 'Piyasa Fiyat Alerti', description: 'CO2 fiyatları son 24 saatte %5 arttı.', time: '30.05.2024', unread: false },
    { id: 5, category: 'sistem', type: 'system', title: 'Sistem Bakım Bildirimi', description: 'Sistem 02.06.2024 02:00-04:00 bakımda.', time: '30.05.2024', unread: false },
  ],
};

export const settings = {
  profile: {
    companyName: 'Eco Demo A.Ş.',
    sector: 'Kimya',
    employees: 250,
    country: 'Türkiye',
    currency: 'TRY',
  },
  system: {
    version: '2.1.0',
    lastUpdate: '20.05.2024',
    database: 'Aktif',
    license: 'Premium',
  },
};
