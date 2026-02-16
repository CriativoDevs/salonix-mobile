import client from "./client";

export async function fetchCustomers({ limit = 10, offset = 0, search = "", ordering = "-created_at", is_active } = {}) {
  const params = {
    limit,
    offset,
    ordering,
  };

  if (search) {
    params.search = search;
    // Attempt standard alternative filter keys since 'search' alone returning full list
    params.name = search;
    params.q = search;
  }

  if (is_active !== undefined) {
    params.is_active = is_active;
  }

  const response = await client.get("salon/customers/", { params });
  return response.data;
}

export async function createCustomer(data) {
  const response = await client.post("salon/customers/", data);
  return response.data;
}

export async function updateCustomer(id, data) {
  const response = await client.patch(`salon/customers/${id}/`, data);
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
