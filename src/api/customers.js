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

export async function createCustomer(data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.post("salon/customers/", payload, { params, headers });
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
  const response = await client.patch(`salon/customers/${id}/`, payload, { params, headers });
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
