import client from "./client";

export async function fetchInventoryItems({ slug, limit = 100 } = {}) {
  const params = { limit };
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.get('inventory/items/', { params, headers });
  const data = response.data;
  return Array.isArray(data) ? data : data?.results || [];
}

export async function fetchInventoryAlerts({ slug, limit = 100 } = {}) {
  const params = { limit };
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.get('inventory/alerts/', { params, headers });
  const data = response.data;
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createInventoryItem(data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.post('inventory/items/', payload, { params, headers });
  return response.data;
}

export async function updateInventoryItem(id, data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.patch(`inventory/items/${id}/`, payload, { params, headers });
  return response.data;
}

export async function deleteInventoryItem(id) {
  const response = await client.delete(`inventory/items/${id}/`);
  return response.data;
}

export async function createStockMovement(data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.post('inventory/movements/', payload, { params, headers });
  return response.data;
}

export async function fetchStockMovements({ slug, itemId, limit = 100 } = {}) {
  const params = { limit };
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  if (itemId) {
    params.item = itemId;
  }
  const response = await client.get('inventory/movements/', { params, headers });
  const data = response.data;
  return Array.isArray(data) ? data : data?.results || [];
}
