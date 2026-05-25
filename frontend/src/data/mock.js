export const MOCK_DASHBOARD = {
  company: {
    name: 'Eco Demo A.Ş.',
    sector: 'Kimya',
    export_status: 'AB İhracatçı',
    slogan: 'Daha az emisyon, daha iyi gelecek',
  },
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
    {
      type: 'suggestion',
      title: 'Azaltım Önerisi',
      description: 'Enerji verimliliği iyileştirmesi ile aylık %12 emisyon azaltımı mümkün.',
      impact: '1.494 tCO2e/ay',
    },
    {
      type: 'risk',
      title: 'Risk Uyarısı',
      description: 'Haziran ayında kota aşım riski %78 — üretim planını gözden geçirin.',
      impact: 'Kota aşımı riski',
    },
    {
      type: 'opportunity',
      title: 'Fırsat Analizi',
      description: 'Yenilenebilir enerji yatırımı ile 3 yılda 2.1M € tasarruf potansiyeli.',
      impact: '+2.100.000 €',
    },
  ],
};
