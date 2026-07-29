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

export async function fetchTenantBusinessHours({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.get('users/tenant/business-hours/', { headers, params });
  return response.data;
}

export async function updateTenantBusinessHours(hours, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.put('users/tenant/business-hours/', hours, { headers, params });
  return response.data;
}

export async function updateTenantBranding({ logoFile, address = {}, slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const addressEntries = Object.entries(address).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );

  if (logoFile) {
    headers['Content-Type'] = 'multipart/form-data';
    const formData = new FormData();
    formData.append('logo', {
      uri: logoFile.uri,
      name: logoFile.name,
      type: logoFile.mimeType || 'image/jpeg',
    });
    addressEntries.forEach(([key, value]) => formData.append(key, value));
    const response = await client.patch(TENANT_ENDPOINT, formData, { headers, params });
    return response.data;
  }

  const payload = Object.fromEntries(addressEntries);
  const response = await client.patch(TENANT_ENDPOINT, payload, { headers, params });
  return response.data;
}

export async function fetchTenantNotifications({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.get('users/tenant/notifications/', { headers, params });
  return response.data;
}

export async function updateTenantNotifications(payload, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.patch('users/tenant/notifications/', payload, { headers, params });
  return response.data;
}

export async function updateTenantContact({ email, phone } = {}, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.patch('users/tenant/profile/', { email, phone }, { headers, params });
  return response.data;
}

export async function updateTenantModules({ pwaClientEnabled } = {}, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.patch(
    'users/tenant/modules/',
    { pwa_client_enabled: Boolean(pwaClientEnabled) },
    { headers, params }
  );
  return response.data;
}

export async function updateTenantAutoInvite(autoInviteEnabled, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.patch(
    TENANT_ENDPOINT,
    { auto_invite_enabled: Boolean(autoInviteEnabled) },
    { headers, params }
  );
  return response.data;
}

export async function updateSubscriptionAction({ action } = {}, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.post('payments/stripe/subscription/action/', { action }, { headers, params });
  return response.data;
}

export async function updateAutoRenewal({ autoRenewal, autoRenewalPriceId } = {}, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const payload = { auto_renewal: autoRenewal };
  if (autoRenewalPriceId) {
    payload.auto_renewal_price_id = autoRenewalPriceId;
  }
  const response = await client.patch('payments/stripe/settings/', payload, { headers, params });
  return response.data;
}

export async function createCheckoutSession({ plan, interval } = {}, { slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.post('payments/stripe/create-checkout-session/', { plan, interval }, { headers, params });
  return response.data;
}

export async function createBillingPortalSession({ slug } = {}) {
  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }
  const response = await client.post('payments/stripe/billing-portal/', {}, { headers, params });
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
