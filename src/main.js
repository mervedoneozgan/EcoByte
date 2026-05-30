import './index.css';

// Görseldeki şablonun HTML yapısını #app div'ine enjekte ediyoruz
document.getElementById('app').innerHTML = `
  <div class="w-56 bg-[#090F17] border-r border-[#2E8FB0]/10 p-4 flex flex-col justify-between shrink-0">
    <div class="space-y-6">
      <div class="flex items-center gap-2 px-2">
        <div class="w-4 h-4 rounded-full bg-[#6DCC5B]"></div>
        <span class="text-base font-extrabold tracking-wider text-white">EcoByte</span>
      </div>
      
      <nav class="space-y-1">
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded text-slate-400 hover:text-[#67D2F5] transition-colors">📊 Genel Bakış</a>
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded text-slate-400 hover:text-[#67D2F5] transition-colors">🌱 Emisyon Ölçümü</a>
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded text-slate-400 hover:text-[#67D2F5] transition-colors">📉 Emisyon Azaltım Sistemi</a>
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded bg-[#131E2B] text-[#A5F279] font-medium border-l-2 border-[#6DCC5B]">📋 Raporlama</a>
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded text-slate-400 hover:text-[#67D2F5] transition-colors">💼 Emisyon Ticaret Sistemi</a>
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded text-slate-400 hover:text-[#67D2F5] transition-colors">🔮 Finansal Senaryolar</a>
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded text-slate-400 hover:text-[#67D2F5] transition-colors">🤖 AI Destekli Analiz</a>
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded text-slate-400 hover:text-[#67D2F5] transition-colors">🎯 Danışmanlık</a>
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded text-slate-400 hover:text-[#67D2F5] transition-colors">🔔 Bildirimler</a>
        <a href="#" class="flex items-center gap-2.5 px-2 py-2 rounded text-slate-400 hover:text-[#67D2F5] transition-colors">⚙️ Ayarlar</a>
      </nav>
    </div>

    <div class="bg-[#131E2B]/50 p-2.5 rounded border border-[#2E8FB0]/10 text-[10px]">
      <div class="font-bold text-slate-300">Eco Destek</div>
      <div class="text-slate-500 mt-0.5">Sektör standartları aktif.</div>
    </div>
  </div>

  <div class="flex-1 p-5 space-y-5 overflow-y-auto">
    
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white tracking-wide">Raporlama</h2>
        <button class="bg-[#6DCC5B] hover:bg-[#5bb34c] text-[#0D1520] font-bold px-3 py-1 rounded text-[11px] transition-colors shadow-sm">
          Yeni Rapor Oluştur
        </button>
      </div>

      <div class="flex items-center gap-4 border-b border-[#2E8FB0]/10 pb-1 text-slate-400">
        <span class="text-[#67D2F5] border-b border-[#67D2F5] pb-1 font-bold cursor-pointer">Raporlar</span>
        <span class="hover:text-white cursor-pointer transition-colors">Rapor Şablonları</span>
        <span class="hover:text-white cursor-pointer transition-colors">Uyum Raporları</span>
        <span class="hover:text-white cursor-pointer transition-colors">Performans Raporları</span>
        <span class="hover:text-white cursor-pointer transition-colors">Özel Raporlar</span>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-[#111A24] border border-[#2E8FB0]/10 p-3 rounded shadow-sm">
        <span class="text-slate-400 text-[10px] block">Toplam Rapor</span>
        <div class="text-xl font-bold text-[#67D2F5] mt-1">24</div>
      </div>
      <div class="bg-[#111A24] border border-[#2E8FB0]/10 p-3 rounded shadow-sm">
        <span class="text-slate-400 text-[10px] block">Taslak</span>
        <div class="text-xl font-bold text-[#42B7D6] mt-1">5</div>
      </div>
      <div class="bg-[#111A24] border border-[#2E8FB0]/10 p-3 rounded shadow-sm">
        <span class="text-slate-400 text-[10px] block">Yayınlanan</span>
        <div class="text-xl font-bold text-[#A5F279] mt-1">18</div>
      </div>
      <div class="bg-[#111A24] border border-[#2E8FB0]/10 p-3 rounded shadow-sm">
        <span class="text-slate-400 text-[10px] block">Planlanan</span>
        <div class="text-xl font-bold text-orange-400 mt-1">1</div>
      </div>
    </div>

    <div class="space-y-2">
      <h3 class="text-xs font-bold text-slate-300">Rapor Türleri</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div class="bg-[#111A24] border border-[#2E8FB0]/10 p-3 rounded text-center flex flex-col items-center justify-center cursor-pointer hover:border-[#67D2F5] transition-colors">
          <div class="text-[#6DCC5B] text-base mb-1">📄</div>
          <span class="text-[10px] text-slate-300">Sürdürülebilirlik Raporu</span>
        </div>
        <div class="bg-[#111A24] border border-[#2E8FB0]/10 p-3 rounded text-center flex flex-col items-center justify-center cursor-pointer hover:border-[#67D2F5] transition-colors">
          <div class="text-[#67D2F5] text-base mb-1">📑</div>
          <span class="text-[10px] text-slate-300">Emisyon Raporu</span>
        </div>
        <div class="bg-[#111A24] border border-[#2E8FB0]/10 p-3 rounded text-center flex flex-col items-center justify-center cursor-pointer hover:border-[#67D2F5] transition-colors">
          <div class="text-[#A5F279] text-base mb-1">🅿️</div>
          <span class="text-[10px] text-slate-300">Uyum Raporu</span>
        </div>
        <div class="bg-[#111A24] border border-[#2E8FB0]/10 p-3 rounded text-center flex flex-col items-center justify-center cursor-pointer hover:border-[#67D2F5] transition-colors">
          <div class="text-[#42B7D6] text-base mb-1">📊</div>
          <span class="text-[10px] text-slate-300">Performans Raporları</span>
        </div>
        <div class="bg-[#111A24] border border-[#2E8FB0]/10 p-3 rounded text-center flex flex-col items-center justify-center cursor-pointer hover:border-[#67D2F5] transition-colors">
          <div class="text-slate-400 text-base mb-1">🛡️</div>
          <span class="text-[10px] text-slate-300">Özel Rapor</span>
        </div>
      </div>
    </div>

    <div class="bg-[#111A24] border border-[#2E8FB0]/10 rounded overflow-hidden shadow-md">
      <div class="px-3 py-2 border-b border-[#2E8FB0]/10 bg-[#141F2D]">
        <h3 class="text-xs font-bold text-white">Son Raporlar</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#090F17]/60 border-b border-[#2E8FB0]/10 text-slate-400 text-[10px] font-bold">
              <th class="px-4 py-2">Rapor Adı</th>
              <th class="px-4 py-2">Tür</th>
              <th class="px-4 py-2">Dönem</th>
              <th class="px-4 py-2">Oluşturma Tarihi</th>
              <th class="px-4 py-2">Durum</th>
              <th class="px-4 py-2 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody id="report-table-body" class="divide-y divide-[#2E8FB0]/5 text-slate-300">
            </tbody>
        </table>
      </div>
    </div>

    <div class="bg-[#111A24] border border-[#2E8FB0]/10 rounded p-3">
      <h3 class="text-xs font-bold text-white mb-2">Rapor Takvimi</h3>
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4 text-slate-400 text-[11px]">
        <div>📅 Mayıs 2024 Zaman Çizelgesi Aktif</div>
        <div class="space-y-1 text-right w-full sm:w-auto">
          <div><span class="text-[#A5F279] font-bold">15 Mayıs 2024:</span> 2024 Sürdürülebilirlik Raporu</div>
          <div><span class="text-[#42B7D6] font-bold">10 Mayıs 2024:</span> Mayıs 2024 Emisyon Raporu</div>
          <div><span class="text-[#67D2F5] font-bold">01 Haziran 2024:</span> 2024 Q2 Performans Raporu</div>
        </div>
      </div>
    </div>

  </div>
`;

// Görseldeki Mock Rapor Verileri
const mockReports = [
  { name: "2024 Sürdürülebilirlik Raporu", type: "Sürdürülebilirlik", period: "2024 Q1", date: "15.01.2024", status: "Yayınlandı" },
  { name: "Mayıs 2024 Emisyon Raporu", type: "Emisyon", period: "Mayıs 2024", date: "10.05.2024", status: "Yayınlandı" },
  { name: "Çevresel Uyum Raporu", type: "Uyum", period: "2024 Q1", date: "05.05.2024", status: "Taslak" },
  { name: "Performans Değerlendirme", type: "Performans", period: "2024 Q1", date: "01.05.2024", status: "Yayınlandı" }
];

// Tabloyu DOM'a Basan Fonksiyon
const tableBody = document.getElementById('report-table-body');
if (tableBody) {
  tableBody.innerHTML = mockReports.map(report => {
    let statusBadge = '';
    if (report.status === "Yayınlandı") {
      statusBadge = `<span class="bg-[#6DCC5B]/10 text-[#A5F279] px-2 py-0.5 rounded text-[10px] font-bold">Yayınlandı</span>`;
    } else {
      statusBadge = `<span class="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-[10px] font-bold">Taslak</span>`;
    }

    return `
      <tr class="hover:bg-[#152335] transition-colors">
        <td class="px-4 py-2.5 font-medium text-white">${report.name}</td>
        <td class="px-4 py-2.5 text-slate-400">${report.type}</td>
        <td class="px-4 py-2.5 text-slate-400">${report.period}</td>
        <td class="px-4 py-2.5 text-slate-400">${report.date}</td>
        <td class="px-4 py-2.5">${statusBadge}</td>
        <td class="px-4 py-2.5 text-right text-slate-500 cursor-pointer hover:text-white font-bold">•••</td>
      </tr>
    `;
  }).join('');
}

