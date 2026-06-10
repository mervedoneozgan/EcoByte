import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { after, before, test } from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

let server;
let baseUrl;
let authToken;
let runtimeDirectory;
let userStorePath;
let sessionStorePath;
let operationalStorePath;

before(async () => {
  runtimeDirectory = mkdtempSync(join(tmpdir(), 'ecobyte-auth-test-'));
  userStorePath = join(runtimeDirectory, 'users.json');
  sessionStorePath = join(runtimeDirectory, 'sessions.json');
  operationalStorePath = join(runtimeDirectory, 'operational-state.json');
  process.env.AUTH_USER_STORE_PATH = userStorePath;
  process.env.AUTH_SESSION_STORE_PATH = sessionStorePath;
  process.env.OPERATIONAL_STORE_PATH = operationalStorePath;
  process.env.AUTH_ADMIN_PASSWORD = 'EcoByte2026!';
  const { app } = await import('../src/index.js');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}/api`;
      resolve();
    });
  });
  const auth = await request('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: 'admin@ecobyte.com', password: 'EcoByte2026!' }),
  });
  authToken = auth.token;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(runtimeDirectory, { recursive: true, force: true });
});

async function request(path, options) {
  const { auth = true, headers = {}, ...fetchOptions } = options ?? {};
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(auth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    ...fetchOptions,
  });
  const body = await response.json();
  assert.ok(response.ok, body.message);
  return body;
}

test('rejects protected API requests without a session', async () => {
  const response = await fetch(`${baseUrl}/dashboard/summary`);
  assert.equal(response.status, 401);
});

test('serves API information from the backend root', async () => {
  const response = await fetch(baseUrl.replace(/\/api$/u, '/'));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.name, 'EcoByte API');
  assert.equal(body.health, '/api/health');
});

test('sets API security headers and returns structured 404 errors', async () => {
  const response = await fetch(`${baseUrl}/missing`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal((await response.json()).message, 'API uç noktası bulunamadı.');
});

test('rejects malformed JSON and invalid write payloads', async () => {
  const malformed = await fetch(`${baseUrl}/quota/plans`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: '{"title":',
  });
  assert.equal(malformed.status, 400);

  const invalidSection = await fetch(`${baseUrl}/settings/not-a-section`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(invalidSection.status, 400);

  const invalidTitle = await fetch(`${baseUrl}/consultancy/requests`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'x'.repeat(161) }),
  });
  assert.equal(invalidTitle.status, 400);

  const invalidReportYear = await fetch(`${baseUrl}/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ year: 2026 }),
  });
  assert.equal(invalidReportYear.status, 400);

  const invalidRememberMe = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ecobyte.com', password: 'EcoByte2026!', rememberMe: 'false' }),
  });
  assert.equal(invalidRememberMe.status, 400);

  const weakPassword = await fetch(`${baseUrl}/auth/change-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'EcoByte2026!', newPassword: '1234' }),
  });
  assert.equal(weakPassword.status, 400);
});

test('returns the authenticated user and session', async () => {
  const auth = await request('/auth/me');
  assert.equal(auth.user.email, 'admin@ecobyte.com');
  assert.equal(auth.user.role, 'admin');
  assert.ok(auth.session.expiresAt);
});

test('keeps active sessions after an auth service restart', () => {
  assert.equal(existsSync(sessionStorePath), true);
  const authServiceUrl = pathToFileURL(join(process.cwd(), 'src/auth/authService.js')).href;
  const output = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', `import { authenticateToken } from '${authServiceUrl}'; console.log(JSON.stringify(authenticateToken(process.env.TEST_TOKEN)));`],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        AUTH_USER_STORE_PATH: userStorePath,
        AUTH_SESSION_STORE_PATH: sessionStorePath,
        TEST_TOKEN: authToken,
      },
    }
  );
  assert.equal(JSON.parse(output).user.email, 'admin@ecobyte.com');
});

test('serves data for every platform page', async () => {
  const paths = [
    '/dashboard/summary',
    '/emissions',
    '/data-catalog',
    '/reports',
    '/quota',
    '/trading',
    '/scenarios',
    '/ai-analysis',
    '/consultancy',
    '/notifications',
    '/settings',
  ];
  const responses = await Promise.all(paths.map((path) => request(path)));
  assert.equal(responses.length, paths.length);
  assert.doesNotMatch(JSON.stringify(responses), /[ÃÄÅÂâ�]/);
});

test('limits AI analysis to measured graph observations', async () => {
  const analysis = await request('/ai-analysis');
  const renderedText = JSON.stringify(analysis);

  assert.ok(analysis.summary.latestPeriod);
  assert.ok(analysis.summary.peakPeriod);
  assert.equal(analysis.risks.length, 0);
  assert.doesNotMatch(renderedText, /varsay|kabul edilir|optimizasyonuna uygun|azaltılabilir/i);
});

test('serves the complete 2024 and 2025 dashboard emission trend', async () => {
  const trend = await request('/dashboard/trend');
  assert.equal(trend.length, 24);
  assert.deepEqual([...new Set(trend.map((item) => item.year))], [2024, 2025]);
  assert.ok(trend.every((item) => Number.isFinite(item.electricityEmission)));
  assert.ok(trend.every((item) => Number.isFinite(item.naturalGasEmission)));
});

test('exposes factor publication and 2026 currency metadata', async () => {
  const catalog = await request('/data-catalog');
  assert.equal(catalog.factors.electricityGrid.publishedAt, '26.12.2025');
  assert.equal(catalog.factors.naturalGas.publishedAt, '10.06.2025');
  assert.equal(catalog.factors.naturalGas.checkedAt, '05.06.2026');
  assert.match(catalog.factors.naturalGas.currencyStatus, /2026 faktör seti henüz yayımlanmadığı/);
  assert.equal(
    catalog.validationChecks.find((check) => check.key === 'factor-currency').status,
    'verified'
  );
});

test('generates a corporate PDF report from the real inventory', async () => {
  const reports = await request('/reports');
  assert.equal(reports.source.rawRecordCount, 91);
  assert.equal(reports.items[0].format, 'PDF');

  const response = await fetch(`${baseUrl}/reports/${reports.items[0].id}/pdf`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const pdf = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/pdf/);
  assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(pdf.length > 100000);

  const audit = JSON.parse(execFileSync(
    'py',
    ['-3', '-c', [
      'import io,json,sys',
      'from pypdf import PdfReader',
      'r=PdfReader(io.BytesIO(sys.stdin.buffer.read()))',
      'lengths=[len((p.extract_text() or "").strip()) for p in r.pages]',
      'text="\\n".join((p.extract_text() or "") for p in r.pages)',
      'bad=set("ÃÄÅÂâ�")',
      'print(json.dumps({"pages":len(r.pages),"lengths":lengths,"mojibake":bool(set(text)&bad),"oldTypo":"tükerimi" in text},ensure_ascii=False))',
    ].join(';')],
    { input: pdf, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  ));
  assert.ok(audit.pages >= 12);
  assert.ok(audit.lengths[0] >= 180);
  assert.ok(audit.lengths.slice(1).every((length) => length >= 300));
  assert.equal(audit.mojibake, false);
  assert.equal(audit.oldTypo, false);
});

test('persists operational actions in the runtime store', async () => {
  const order = await request('/trading/orders', {
    method: 'POST',
    body: JSON.stringify({ amount: 10, price: 25.4, type: 'Alış emri' }),
  });
  const plan = await request('/quota/plans', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test azaltım planı', targetTco2e: 12 }),
  });
  const recommendation = await request('/ai-analysis/recommendations/1/plan', {
    method: 'POST',
    body: '{}',
  });

  assert.match(order.id, /^ORD-/);
  assert.equal(plan.status, 'planned');
  assert.equal(recommendation.status, 'planned');
  assert.equal(existsSync(operationalStorePath), true);
  const persisted = JSON.parse(readFileSync(operationalStorePath, 'utf8'));
  assert.equal(persisted.trading.orders[0].id, order.id);
  assert.equal(persisted.quotaPlans.some((item) => item.id === plan.id), true);
  assert.equal(persisted.aiAnalysis.recommendations.find((item) => item.id === 1).status, 'planned');

  const operationalDataUrl = pathToFileURL(join(process.cwd(), 'src/data/operationalData.js')).href;
  const restarted = JSON.parse(execFileSync(
    process.execPath,
    ['--input-type=module', '-e', `import { trading, quotaPlans } from '${operationalDataUrl}'; console.log(JSON.stringify({order:trading.orders[0].id,plan:quotaPlans.some((item)=>item.id===${plan.id})}));`],
    { encoding: 'utf8', env: { ...process.env, OPERATIONAL_STORE_PATH: operationalStorePath } }
  ));
  assert.equal(restarted.order, order.id);
  assert.equal(restarted.plan, true);
});

test('persists profile updates and reflects them in company data', async () => {
  const profile = await request('/settings/profile', {
    method: 'PUT',
    body: JSON.stringify({
      companyName: 'EcoByte Test Üniversitesi',
      sector: 'Eğitim',
      employees: 251,
      country: 'Türkiye',
      currency: 'TRY',
    }),
  });
  const company = await request('/dashboard/company');
  assert.equal(profile.companyName, 'EcoByte Test Üniversitesi');
  assert.equal(company.name, profile.companyName);

  const persisted = JSON.parse(readFileSync(operationalStorePath, 'utf8'));
  assert.equal(persisted.settings.profile.employees, 251);

  const platformDataUrl = pathToFileURL(join(process.cwd(), 'src/data/platformData.js')).href;
  const restartedCompany = JSON.parse(execFileSync(
    process.execPath,
    ['--input-type=module', '-e', `import { company } from '${platformDataUrl}'; console.log(JSON.stringify(company));`],
    { encoding: 'utf8', env: { ...process.env, OPERATIONAL_STORE_PATH: operationalStorePath } }
  ));
  assert.equal(restartedCompany.name, profile.companyName);
});

test('validates and persists typed settings preferences', async () => {
  const result = await request('/settings/bildirim', {
    method: 'PUT',
    body: JSON.stringify({
      emailNotifications: false,
      criticalAlerts: true,
      weeklySummary: false,
    }),
  });
  assert.equal(result.values.emailNotifications, false);
  assert.equal(result.values.criticalAlerts, true);
  assert.ok(result.values.savedAt);

  const settings = await request('/settings');
  assert.equal(settings.preferences.bildirim.weeklySummary, false);

  const invalid = await fetch(`${baseUrl}/settings/entegrasyon`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportService: true, fileStorage: true, syncIntervalMinutes: 1 }),
  });
  assert.equal(invalid.status, 400);

  await request('/settings/guvenlik', {
    method: 'PUT',
    body: JSON.stringify({ twoFactorRequired: true, sessionMinutes: 45, ipRestriction: false }),
  });
  const sessionLogin = await request('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: 'admin@ecobyte.com', password: 'EcoByte2026!' }),
  });
  const sessionMinutes = (new Date(sessionLogin.expiresAt).getTime() - Date.now()) / 60_000;
  assert.ok(sessionMinutes > 44 && sessionMinutes <= 45);

  const logoDataUrl = 'data:image/png;base64,iVBORw0KGgo=';
  const logo = await request('/settings/logo', {
    method: 'PUT',
    body: JSON.stringify({ dataUrl: logoDataUrl }),
  });
  assert.equal(logo.brandLogoDataUrl, logoDataUrl);
  assert.equal((await request('/settings')).brandLogoDataUrl, logoDataUrl);

  const invalidLogo = await fetch(`${baseUrl}/settings/logo`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }),
  });
  assert.equal(invalidLogo.status, 400);
});

test('completes consultancy messaging, document and appointment actions', async () => {
  const message = await request('/consultancy/requests/1/messages', {
    method: 'POST',
    body: JSON.stringify({ message: 'Test danışmanlık mesajı' }),
  });
  assert.equal(message.text, 'Test danışmanlık mesajı');

  const preview = await request('/consultancy/documents/1/preview');
  assert.match(preview.description, /karbon envanteri/i);

  const download = await fetch(`${baseUrl}/consultancy/documents/1/download`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /ecobyte-consultancy-document-1\.txt/);
  assert.match(await download.text(), /EcoByte Danışmanlık Belge Özeti/);

  const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const appointment = await request('/consultancy/appointments/1/reschedule', {
    method: 'PATCH',
    body: JSON.stringify({ scheduledAt: future }),
  });
  assert.equal(appointment.scheduledAt, future);

  const joined = await request('/consultancy/appointments/1/join', {
    method: 'POST',
    body: '{}',
  });
  assert.match(joined.joinUrl, /^https:\/\/meet\.jit\.si\//);

  const persisted = JSON.parse(readFileSync(operationalStorePath, 'utf8'));
  assert.equal(persisted.consultancy.requests[0].messages.at(-1).text, message.text);
  assert.equal(persisted.consultancy.appointments[0].scheduledAt, future);
  assert.ok(persisted.consultancy.appointments[0].lastJoinedAt);
});

test('persists report definitions and rebuilds metrics from the inventory', async () => {
  const report = await request('/reports', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Kalıcı denetim raporu',
      type: 'Kurumsal Karbon Envanteri',
      year: 2025,
      status: 'published',
      statusLabel: 'PDF hazır',
    }),
  });
  const persisted = JSON.parse(readFileSync(operationalStorePath, 'utf8'));
  assert.equal(persisted.reportDefinitions[0].id, report.id);
  assert.equal(persisted.reportDefinitions[0].metrics, undefined);

  const reportServiceUrl = pathToFileURL(join(process.cwd(), 'src/services/reportService.js')).href;
  const restartedReport = JSON.parse(execFileSync(
    process.execPath,
    ['--input-type=module', '-e', `import { getReport } from '${reportServiceUrl}'; console.log(JSON.stringify(getReport(${report.id})));`],
    { encoding: 'utf8', env: { ...process.env, OPERATIONAL_STORE_PATH: operationalStorePath } }
  ));
  assert.equal(restartedReport.name, report.name);
  assert.equal(restartedReport.metrics.grossEmission, report.metrics.grossEmission);
});

test('does not create sellable capacity without an official ETS allocation', async () => {
  const trading = await request('/trading');
  const summary = await request('/dashboard/summary');
  assert.equal(summary.etsEligible, false);
  assert.equal(summary.sellableSurplus, 0);
  assert.equal(trading.availableCapacity, 0);

  const response = await fetch(`${baseUrl}/trading/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1, price: 25.4, type: 'Limit satış' }),
  });
  assert.equal(response.status, 400);
});

test('explains why Turkish sell orders are rejected without an ETS allocation', async () => {
  const response = await fetch(`${baseUrl}/trading/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      amount: 1,
      price: 25.4,
      type: 'Limit satış',
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.match(body.message, /resmî ETS tahsisi bulunmadığı/i);
});

test('exposes the documented and exactly calculated 2026 emission quota', async () => {
  const quota = await request('/quota');

  assert.equal(quota.summary.quotaLimit, 2052.333);
  assert.equal(quota.summary.quotaBaselineEmission, 2160.351);
  assert.equal(quota.summary.quotaLimit, Number((quota.summary.quotaBaselineEmission * 0.95).toFixed(3)));
  assert.equal(quota.summary.quotaReductionTarget, 108.018);
  assert.equal(quota.summary.quotaReductionPercent, 5);
  assert.equal(quota.summary.quotaEmission, quota.summary.energyEmission);
  assert.equal(quota.summary.sellableSurplus, 0);
  assert.match(quota.methodology.title, /kurumsal emisyon kotası/i);
  assert.ok(quota.methodology.sources.length >= 3);
});

test('separates emission distribution from solar production', async () => {
  const distribution = await request('/dashboard/distribution');
  const solar = await request('/dashboard/solar');
  const fuel = distribution.items.find((item) => item.name === 'Yakıt tüketimi');

  assert.equal(distribution.total, 2862.575);
  assert.equal(fuel.value, 702.224);
  assert.equal(fuel.impactType, 'emission');
  assert.equal(distribution.items.length, 3);
  assert.equal(
    distribution.items.reduce((sum, item) => sum + item.percent, 0),
    100
  );
  assert.equal(solar.totalProductionKwh, 2330823);
  assert.equal(solar.facilityCount, 5);
  assert.equal(solar.monthlyAverageKwh, 194235.25);
  assert.equal(solar.positiveImpactTco2, 1454.9);
  assert.equal(solar.monthly.length, 12);
  assert.equal(solar.facilities.length, 5);
  assert.ok(solar.facilities.every((facility) => facility.monthly.length === 12));
  assert.equal(
    solar.facilities.reduce((sum, facility) => sum + facility.productionKwh, 0),
    solar.totalProductionKwh
  );
  assert.equal(
    solar.facilities[0].monthly.reduce((sum, month) => sum + month.productionKwh, 0),
    solar.facilities[0].productionKwh
  );
});

test('revokes a session on logout', async () => {
  const login = await request('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: 'admin@ecobyte.com', password: 'EcoByte2026!' }),
  });
  const response = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${login.token}` },
  });
  assert.equal(response.status, 204);
  const rejected = await fetch(`${baseUrl}/dashboard/summary`, {
    headers: { Authorization: `Bearer ${login.token}` },
  });
  assert.equal(rejected.status, 401);
});

test('locks repeated invalid login attempts', async () => {
  let lastResponse;
  for (let index = 0; index < 6; index += 1) {
    lastResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-user@ecobyte.com', password: 'wrong-password' }),
    });
  }
  assert.equal(lastResponse.status, 429);
  assert.ok(lastResponse.headers.get('retry-after'));
});
