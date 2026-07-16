import client from "./client";

export async function fetchCreditBalance({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.get('users/credits/balance/', { headers, params });
  return response.data;
}

export async function fetchCreditHistory({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.get('users/credits/history/', { headers, params });
  return response.data;
}

// Not tenant-scoped — packages are global, no slug/header needed.
export async function fetchCreditPackages() {
  const response = await client.get('payments/stripe/credits/packages/');
  return response.data;
}

export async function createCreditCheckoutSession({ amount_eur } = {}, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.post('payments/stripe/credits/checkout/', { amount_eur }, { headers, params });
  return response.data;
}
