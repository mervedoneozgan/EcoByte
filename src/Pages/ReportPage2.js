// feature/ReportPage-2 - Birebir Görsel Veri Seti

const mockReports = [
  { name: "2024 Sürdürülebilirlik Raporu", type: "Sürdürülebilirlik", period: "2024 Q1", date: "15.05.2024", status: "Yayınlandı" },
  { name: "Mayıs 2024 Emisyon Raporu", type: "Emisyon", period: "Mayıs 2024", date: "10.05.2024", status: "Yayınlandı" },
  { name: "Çevresel Uyum Raporu", type: "Uyum", period: "2024 Q1", date: "05.05.2024", status: "Taslak" },
  { name: "Performans Değerlendirme", type: "Performans", period: "2024 Q1", date: "01.05.2024", status: "Yayınlandı" }
];

function renderTable(reports) {
  const tableBody = document.getElementById('report-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = reports.map(report => {
    let statusBadge = '';
    // Görseldeki rozetlerin (Yayınlandı = Yeşil, Taslak = Turuncu) birebir uygulanması
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
        <td class="px-4 py-2.5 text-right text-slate-500 cursor-pointer hover:text-white">•••</td>
      </tr>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTable(mockReports);
});