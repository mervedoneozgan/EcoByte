import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE_PATH = process.env.OPERATIONAL_STORE_PATH
  || (process.env.VERCEL ? '/tmp/ecobyte/operational-state.json' : null)
  || fileURLToPath(new URL('../../.runtime/operational-state.json', import.meta.url));

function readStore() {
  if (!existsSync(STORE_PATH)) return {};
  const value = JSON.parse(readFileSync(STORE_PATH, 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Operasyonel veri deposu geçerli bir JSON nesnesi olmalıdır.');
  }
  return value;
}

export function loadRuntimeSection(key, fallback) {
  const stored = readStore()[key];
  return stored === undefined ? structuredClone(fallback) : stored;
}

export function persistRuntimeSections(sections) {
  const next = { ...readStore(), ...sections };
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  const temporaryPath = `${STORE_PATH}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(next, null, 2), { encoding: 'utf8', mode: 0o600 });
  renameSync(temporaryPath, STORE_PATH);
}
