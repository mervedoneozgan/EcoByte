const MOJIBAKE_MARKERS = /[\u00C2\u00C3\u00C4\u00C5\u00E2\uFFFD]/g;
const CP1252_SPECIAL_BYTES = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

function mojibakeScore(value) {
  return (String(value).match(MOJIBAKE_MARKERS) ?? []).length;
}

function windows1252Bytes(value) {
  const bytes = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
    } else if (CP1252_SPECIAL_BYTES.has(codePoint)) {
      bytes.push(CP1252_SPECIAL_BYTES.get(codePoint));
    } else {
      return null;
    }
  }
  return bytes;
}

function decodeWindows1252Fragment(value) {
  const bytes = windows1252Bytes(value);
  if (!bytes) return null;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
}

function decodeWindows1252AsUtf8(value) {
  let output = '';
  for (let index = 0; index < value.length;) {
    let best = null;
    const maxEnd = Math.min(value.length, index + 12);
    for (let end = index + 2; end <= maxEnd; end += 1) {
      const fragment = value.slice(index, end);
      const repaired = decodeWindows1252Fragment(fragment);
      if (!repaired) continue;
      const improvement = mojibakeScore(fragment) - mojibakeScore(repaired);
      if (improvement > 0 && (!best || improvement >= best.improvement)) {
        best = { end, improvement, repaired };
      }
    }
    if (best) {
      output += best.repaired;
      index = best.end;
    } else {
      output += value[index];
      index += 1;
    }
  }
  return output;
}

export function normalizeDisplayText(value) {
  let normalized = String(value ?? '');
  for (let attempt = 0; attempt < 2 && mojibakeScore(normalized); attempt += 1) {
    const repaired = decodeWindows1252AsUtf8(normalized);
    if (mojibakeScore(repaired) >= mojibakeScore(normalized)) break;
    normalized = repaired;
  }
  return normalized;
}

export function normalizeApiPayload(value) {
  if (typeof value === 'string') return normalizeDisplayText(value);
  if (Array.isArray(value)) return value.map(normalizeApiPayload);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeApiPayload(item)])
    );
  }
  return value;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
