import client from "./client";

export async function fetchServices({ slug, limit = 100 } = {}) {
    const params = { limit };
    const headers = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.get("public/services/", { params, headers });
    return response.data;
}

export async function fetchAdminServices({ slug, limit = 100 } = {}) {
  const params = { limit };
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.get('services/', { params, headers });
  return response.data;
}

export async function createService(data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.post('services/', payload, { params, headers });
  return response.data;
}

export async function updateService(id, data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.patch(`services/${id}/`, payload, { params, headers });
  return response.data;
}

export async function deleteService(id) {
  const response = await client.delete(`services/${id}/`);
  return response.data;
}

export async function importServicesCSV(file, { dryRun = false, slug } = {}) {
  const headers = { 'Content-Type': 'multipart/form-data' };
  const params = { dry_run: dryRun ? 'true' : 'false' };

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'text/csv',
  });

  const response = await client.post('import/services/', formData, { headers, params });
  return response.data;
}

export async function fetchServicesImportTemplate({ slug } = {}) {
  const headers = {};
  const params = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const response = await client.get('import/templates/services.csv', {
    headers,
    params,
    responseType: 'text',
  });
  return response.data;
}

export async function exportServicesCSV({ slug } = {}) {
  const headers = {};
  const params = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const response = await client.get('export/services.csv', {
    headers,
    params,
    responseType: 'text',
  });
  return response.data;
}
