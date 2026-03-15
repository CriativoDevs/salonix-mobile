import client from "./client";

const TENANT_ENDPOINT = "users/tenant/meta/";

export async function fetchTenantMeta(slug) {
  const params = {};
  if (slug) {
    params.tenant = slug;
  }
  const response = await client.get(TENANT_ENDPOINT, { params });
  return response.data;
}

export async function fetchBillingOverview({ slug } = {}) {
  const headers = {};
  const params = {};

  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const response = await client.get('payments/stripe/overview/', {
    headers,
    params,
  });

  return response.data;
}

export async function cancelTenantAccount({ password, confirmationText, cancellationReason }) {
  const payload = {
    password,
    confirmation_text: confirmationText,
  };
  if (typeof cancellationReason === 'string' && cancellationReason.trim()) {
    payload.cancellation_reason = cancellationReason.trim();
  }
  const response = await client.post('tenants/cancel-account/', payload);
  return response.data;
}
