export function formatNumber(value) {
  return Number(value).toLocaleString('tr-TR');
}

export function formatEuro(value) {
  return `${formatNumber(value)} €`;
}
