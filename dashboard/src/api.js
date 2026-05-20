const BASE = '/fhir/r4';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json',
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.issue?.[0]?.diagnostics || err.message || 'Request failed');
  }
  return res.json();
}

export const fhir = {
  // Search
  search: (resourceType, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/${resourceType}${qs ? `?${qs}` : ''}`);
  },

  // Read
  read: (resourceType, id) => request(`/${resourceType}/${id}`),

  // Create
  create: (resourceType, resource) =>
    request(`/${resourceType}`, {
      method: 'POST',
      body: JSON.stringify(resource),
    }),

  // Update
  update: (resourceType, id, resource) =>
    request(`/${resourceType}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resource),
    }),

  // Delete
  delete: (resourceType, id) =>
    request(`/${resourceType}/${id}`, { method: 'DELETE' }),

  // Health / stats
  health: () => fetch('/health').then(r => r.json()),
};
