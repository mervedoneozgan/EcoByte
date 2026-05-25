export const MOCK_CONSULTANCY = {
  summary: {
    total: 18,
    open: 6,
    ongoing: 7,
    completed: 5,
  },
  requests: [
    {
      id: 1,
      title: 'Karbon Ayak İzi Analizi',
      expert: 'Dr. Ahmet Yılmaz',
      date: '25.05.2024',
      status: 'ongoing',
      statusLabel: 'Devam Ediyor',
    },
    {
      id: 2,
      title: 'Sürdürülebilirlik Stratejisi',
      expert: 'Dr. Elif Kaya',
      date: '20.05.2024',
      status: 'open',
      statusLabel: 'Açık',
    },
    {
      id: 3,
      title: 'Enerji Verimliliği Danışmanlığı',
      expert: 'Mehmet Demir',
      date: '15.05.2024',
      status: 'ongoing',
      statusLabel: 'Devam Ediyor',
    },
    {
      id: 4,
      title: 'Emisyon Azaltım Planı',
      expert: 'Dr. Ahmet Yılmaz',
      date: '10.05.2024',
      status: 'completed',
      statusLabel: 'Tamamlandı',
    },
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
    {
      expert: 'Dr. Ahmet Yılmaz',
      service: 'Karbon Ayak İzi Analizi',
      datetime: '01.06.2024, 10:00',
      avatar: 'AY',
    },
    {
      expert: 'Dr. Elif Kaya',
      service: 'Sürdürülebilirlik Stratejisi',
      datetime: '05.06.2024, 14:30',
      avatar: 'EK',
    },
    {
      expert: 'Mehmet Demir',
      service: 'Enerji Verimliliği',
      datetime: '08.06.2024, 11:00',
      avatar: 'MD',
    },
  ],
};
