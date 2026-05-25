// FHIR API client — supports local or remote base URL via .env
const FHIR_BASE_URL = (typeof __FHIR_BASE_URL__ !== 'undefined' && __FHIR_BASE_URL__)
  ? __FHIR_BASE_URL__
  : '/fhir/r4';

const API_KEY = (typeof __FHIR_API_KEY__ !== 'undefined' && __FHIR_API_KEY__)
  ? __FHIR_API_KEY__
  : '';

function buildUrl(path, params) {
  const url = new URL(path, FHIR_BASE_URL.startsWith('http') ? FHIR_BASE_URL : window.location.origin);
  // If FHIR_BASE_URL is a relative path, build properly
  if (!FHIR_BASE_URL.startsWith('http')) {
    url.pathname = `${FHIR_BASE_URL}/${path}`.replace(/\/+/g, '/');
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

function headers(extra = {}) {
  const h = { 'Content-Type': 'application/fhir+json', ...extra };
  if (API_KEY) h['X-Api-Key'] = API_KEY;
  return h;
}

async function request(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: headers(opts.headers) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.issue?.[0]?.diagnostics || body?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  // 204 No Content (e.g. DELETE) — no body to parse
  if (res.status === 204) return {};
  return res.json();
}

export const fhir = {
  search: (type, params) => request(buildUrl(type, params)),
  read: (type, id) => request(buildUrl(`${type}/${id}`)),
  create: (type, resource) => request(buildUrl(type), {
    method: 'POST',
    body: JSON.stringify(resource),
  }),
  update: (type, id, resource) => request(buildUrl(`${type}/${id}`), {
    method: 'PUT',
    body: JSON.stringify(resource),
  }),
  delete: (type, id) => request(buildUrl(`${type}/${id}`), { method: 'DELETE' }),
  health: async () => {
    // Health endpoint is always local
    const healthUrl = FHIR_BASE_URL.startsWith('http')
      ? FHIR_BASE_URL.replace(/\/fhir\/r4\/?$/, '/health').replace(/\/$/, '') + '/health'
      : '/health';
    try {
      return await request(healthUrl.replace(/\/health\/health/, '/health'));
    } catch {
      // If remote server doesn't have /health, synthesize from metadata
      return { status: 'unknown', resources: {} };
    }
  },
  getBaseUrl: () => FHIR_BASE_URL,
  isRemote: () => FHIR_BASE_URL.startsWith('http'),
};
