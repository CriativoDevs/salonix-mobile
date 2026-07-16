import client from "./client";

export async function fetchBasicReports({ from, to, slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  if (from) params.from = from;
  if (to) params.to = to;
  const response = await client.get('reports/basic/', { headers, params });
  return response.data;
}

export async function fetchTopServices({ from, to, limit, slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  if (from) params.from = from;
  if (to) params.to = to;
  if (limit) params.limit = limit;
  const response = await client.get('reports/top-services/', { headers, params });
  return response.data;
}

export async function fetchRevenue({ from, to, interval, slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  if (from) params.from = from;
  if (to) params.to = to;
  if (interval) params.interval = interval;
  const response = await client.get('reports/revenue/', { headers, params });
  return response.data;
}

export async function fetchRetention({ from, to, slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  if (from) params.from = from;
  if (to) params.to = to;
  const response = await client.get('reports/retention/', { headers, params });
  return response.data;
}

export async function exportBasicReportsCSV({ from, to, slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  if (from) params.from = from;
  if (to) params.to = to;
  const response = await client.get('reports/basic/export/', { headers, params, responseType: 'text' });
  return response.data;
}
