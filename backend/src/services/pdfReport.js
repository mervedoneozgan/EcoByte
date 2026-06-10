import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { company } from '../data/platformData.js';
import { getDataCatalog, getEmissionInventory } from './energyData.js';

const generatorPath = fileURLToPath(
  new URL('../../scripts/generate_corporate_report.py', import.meta.url)
);

function pythonCommand() {
  if (process.env.PYTHON3_BIN) {
    return { command: process.env.PYTHON3_BIN, args: [generatorPath] };
  }
  if (process.platform === 'win32') {
    return { command: 'py', args: ['-3', generatorPath] };
  }
  return { command: 'python3', args: [generatorPath] };
}

export function createCorporateReportPdf(report) {
  if (process.env.VERCEL) {
    const error = new Error('PDF üretimi Vercel ortamında desteklenmiyor. Rapor verilerini platform üzerinden görüntüleyebilirsiniz.');
    error.status = 501;
    error.expose = true;
    return Promise.reject(error);
  }

  const payload = {
    report,
    company,
    inventory: getEmissionInventory(),
    catalog: getDataCatalog(),
  };
  const { command, args } = pythonCommand();

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: fileURLToPath(new URL('../../..', import.meta.url)),
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const output = [];
    const errors = [];

    child.stdout.on('data', (chunk) => output.push(chunk));
    child.stderr.on('data', (chunk) => errors.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python 3 PDF üretimi başarısız: ${Buffer.concat(errors).toString('utf8')}`));
        return;
      }
      const pdf = Buffer.concat(output);
      if (pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
        reject(new Error('Python 3 geçerli bir PDF üretmedi.'));
        return;
      }
      resolve(pdf);
    });

    child.stdin.end(JSON.stringify(payload));
  });
}
