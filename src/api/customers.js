import client from "./client";

export async function fetchCustomers({ limit = 10, offset = 0, search = "", ordering = "-created_at", is_active, slug } = {}) {
  const params = {
    limit,
    offset,
    ordering,
  };

  if (search) {
    params.search = search;
    params.name = search;
    params.q = search;
  }

  if (is_active !== undefined) {
    params.is_active = is_active;
  }

  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }

  const response = await client.get("salon/customers/", { params, headers });
  return response.data;
}

function buildCustomerRequestBody(payload) {
  const { photoFile, ...rest } = payload;

  if (!photoFile) {
    return { body: rest, isMultipart: false };
  }

  const formData = new FormData();
  Object.entries(rest).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, value);
  });
  formData.append('photo', {
    uri: photoFile.uri,
    name: photoFile.name || 'photo.jpg',
    type: photoFile.mimeType || 'image/jpeg',
  });

  return { body: formData, isMultipart: true };
}

export async function createCustomer(data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }

  const { body, isMultipart } = buildCustomerRequestBody(payload);
  if (isMultipart) {
    headers['Content-Type'] = 'multipart/form-data';
  }

  const response = await client.post("salon/customers/", body, { params, headers });
  return response.data;
}

export async function updateCustomer(id, data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }

  const { body, isMultipart } = buildCustomerRequestBody(payload);
  if (isMultipart) {
    headers['Content-Type'] = 'multipart/form-data';
  }

  const response = await client.patch(`salon/customers/${id}/`, body, { params, headers });
  return response.data;
}

export async function deleteCustomer(id) {
  const response = await client.delete(`salon/customers/${id}/`);
  return response.data;
}

export async function resendCustomerInvite(id) {
  const response = await client.post(`salon/customers/${id}/resend-invite/`);
  return response.data;
}

export async function importCustomersCSV(file, { dryRun = false, slug } = {}) {
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

  const response = await client.post('import/customers/', formData, { headers, params });
  return response.data;
}

export async function fetchCustomersImportTemplate({ slug } = {}) {
  const headers = {};
  const params = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const response = await client.get('import/templates/customers.csv', {
    headers,
    params,
    responseType: 'text',
  });
  return response.data;
}

export async function exportCustomersCSV({ slug } = {}) {
  const headers = {};
  const params = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const response = await client.get('export/customers.csv', {
    headers,
    params,
    responseType: 'text',
  });
  return response.data;
}
