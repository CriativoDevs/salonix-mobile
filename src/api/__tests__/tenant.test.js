jest.mock('../client', () => ({
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
}));

const client = require('../client');
const {
  updateTenantBusinessHours,
  updateTenantBranding,
  fetchTenantNotifications,
  updateTenantNotifications,
  updateTenantContact,
  updateTenantModules,
  updateTenantAutoInvite,
  updateSubscriptionAction,
  createCheckoutSession,
  createBillingPortalSession,
} = require('../tenant');

describe('updateTenantBusinessHours', () => {
  afterEach(() => jest.clearAllMocks());

  const HOURS = [
    { day_of_week: 0, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
    { day_of_week: 1, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
    { day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
    { day_of_week: 3, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
    { day_of_week: 4, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
    { day_of_week: 5, start_time: '09:00:00', end_time: '13:00:00', is_active: true },
    { day_of_week: 6, start_time: '09:00:00', end_time: '18:00:00', is_active: false },
  ];

  it('puts the full 7-day array with tenant headers/params', async () => {
    client.put.mockResolvedValue({ data: HOURS });

    const result = await updateTenantBusinessHours(HOURS, { slug: 'acme' });

    expect(client.put).toHaveBeenCalledWith(
      'users/tenant/business-hours/',
      HOURS,
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual(HOURS);
  });

  it('works without a slug', async () => {
    client.put.mockResolvedValue({ data: HOURS });

    await updateTenantBusinessHours(HOURS);

    expect(client.put).toHaveBeenCalledWith(
      'users/tenant/business-hours/',
      HOURS,
      { headers: {}, params: {} }
    );
  });
});

describe('updateTenantBranding', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends a JSON PATCH with only the filled address fields when no logo file is given', async () => {
    client.patch.mockResolvedValue({ data: { logo_url: 'https://cdn/logo.png', address_city: 'Lisboa' } });

    const result = await updateTenantBranding({
      address: { address_street: 'Rua A', address_city: 'Lisboa', address_number: '' },
      slug: 'acme',
    });

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/meta/',
      { address_street: 'Rua A', address_city: 'Lisboa' },
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual({ logo_url: 'https://cdn/logo.png', address_city: 'Lisboa' });
  });

  it('sends a multipart PATCH with the logo file and address fields when a logo file is given', async () => {
    client.patch.mockResolvedValue({ data: { logo_url: 'https://cdn/new-logo.png' } });

    const logoFile = { uri: 'file:///tmp/logo.jpg', name: 'logo.jpg', mimeType: 'image/jpeg' };
    const result = await updateTenantBranding({
      logoFile,
      address: { address_city: 'Lisboa' },
      slug: 'acme',
    });

    expect(client.patch).toHaveBeenCalledTimes(1);
    const [url, formData, config] = client.patch.mock.calls[0];
    expect(url).toBe('users/tenant/meta/');
    expect(formData).toBeInstanceOf(FormData);
    expect(config).toEqual({
      headers: { 'X-Tenant-Slug': 'acme', 'Content-Type': 'multipart/form-data' },
      params: { tenant: 'acme' },
    });
    expect(result).toEqual({ logo_url: 'https://cdn/new-logo.png' });
  });

  it('works without a slug', async () => {
    client.patch.mockResolvedValue({ data: {} });

    await updateTenantBranding({ address: { address_city: 'Lisboa' } });

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/meta/',
      { address_city: 'Lisboa' },
      { headers: {}, params: {} }
    );
  });
});

describe('fetchTenantNotifications', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches notification preferences with tenant headers/params', async () => {
    client.get.mockResolvedValue({
      data: { sms_enabled: false, whatsapp_enabled: false, push_mobile_enabled: true, push_web_enabled: true },
    });

    const result = await fetchTenantNotifications({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('users/tenant/notifications/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
    });
    expect(result).toEqual({ sms_enabled: false, whatsapp_enabled: false, push_mobile_enabled: true, push_web_enabled: true });
  });
});

describe('updateTenantNotifications', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends a partial PATCH with only the changed field', async () => {
    client.patch.mockResolvedValue({
      data: { sms_enabled: true, whatsapp_enabled: false, push_mobile_enabled: true, push_web_enabled: true },
    });

    const result = await updateTenantNotifications({ sms_enabled: true }, { slug: 'acme' });

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/notifications/',
      { sms_enabled: true },
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual({ sms_enabled: true, whatsapp_enabled: false, push_mobile_enabled: true, push_web_enabled: true });
  });
});

describe('updateTenantContact', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends a PATCH with email and phone with tenant headers/params', async () => {
    client.patch.mockResolvedValue({ data: { profile: { email: 'novo@acme.pt', phone: '+351911111111' } } });

    const result = await updateTenantContact({ email: 'novo@acme.pt', phone: '+351911111111' }, { slug: 'acme' });

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/profile/',
      { email: 'novo@acme.pt', phone: '+351911111111' },
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual({ profile: { email: 'novo@acme.pt', phone: '+351911111111' } });
  });

  it('works without a slug', async () => {
    client.patch.mockResolvedValue({ data: { profile: { email: 'a@b.pt', phone: '' } } });

    await updateTenantContact({ email: 'a@b.pt', phone: '' });

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/profile/',
      { email: 'a@b.pt', phone: '' },
      { headers: {}, params: {} }
    );
  });
});

describe('updateTenantModules', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends a PATCH with pwa_client_enabled with tenant headers/params', async () => {
    client.patch.mockResolvedValue({ data: { pwa_client_enabled: true } });

    const result = await updateTenantModules({ pwaClientEnabled: true }, { slug: 'acme' });

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/modules/',
      { pwa_client_enabled: true },
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual({ pwa_client_enabled: true });
  });

  it('works without a slug', async () => {
    client.patch.mockResolvedValue({ data: { pwa_client_enabled: false } });

    await updateTenantModules({ pwaClientEnabled: false });

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/modules/',
      { pwa_client_enabled: false },
      { headers: {}, params: {} }
    );
  });
});

describe('updateTenantAutoInvite', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends a PATCH with auto_invite_enabled with tenant headers/params', async () => {
    client.patch.mockResolvedValue({ data: { auto_invite_enabled: true } });

    const result = await updateTenantAutoInvite(true, { slug: 'acme' });

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/meta/',
      { auto_invite_enabled: true },
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual({ auto_invite_enabled: true });
  });

  it('works without a slug', async () => {
    client.patch.mockResolvedValue({ data: { auto_invite_enabled: false } });

    await updateTenantAutoInvite(false);

    expect(client.patch).toHaveBeenCalledWith(
      'users/tenant/meta/',
      { auto_invite_enabled: false },
      { headers: {}, params: {} }
    );
  });
});

describe('updateSubscriptionAction', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends a POST with the action and tenant headers/params', async () => {
    client.post.mockResolvedValue({ data: { status: 'active' } });

    const result = await updateSubscriptionAction({ action: 'cancel' }, { slug: 'acme' });

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/subscription/action/',
      { action: 'cancel' },
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual({ status: 'active' });
  });

  it('works without a slug', async () => {
    client.post.mockResolvedValue({ data: {} });

    await updateSubscriptionAction({ action: 'reactivate' });

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/subscription/action/',
      { action: 'reactivate' },
      { headers: {}, params: {} }
    );
  });
});

describe('createCheckoutSession', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends a POST with plan/interval and tenant headers/params', async () => {
    client.post.mockResolvedValue({ data: { checkout_url: 'https://checkout.stripe.com/x', session_id: 'cs_1' } });

    const result = await createCheckoutSession({ plan: 'basic', interval: 'monthly' }, { slug: 'acme' });

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/create-checkout-session/',
      { plan: 'basic', interval: 'monthly' },
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual({ checkout_url: 'https://checkout.stripe.com/x', session_id: 'cs_1' });
  });

  it('works without a slug', async () => {
    client.post.mockResolvedValue({ data: {} });

    await createCheckoutSession({ plan: 'founder', interval: 'monthly' });

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/create-checkout-session/',
      { plan: 'founder', interval: 'monthly' },
      { headers: {}, params: {} }
    );
  });
});

describe('createBillingPortalSession', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends a POST with no body and tenant headers/params', async () => {
    client.post.mockResolvedValue({ data: { portal_url: 'https://billing.stripe.com/x' } });

    const result = await createBillingPortalSession({ slug: 'acme' });

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/billing-portal/',
      {},
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual({ portal_url: 'https://billing.stripe.com/x' });
  });

  it('works without a slug', async () => {
    client.post.mockResolvedValue({ data: {} });

    await createBillingPortalSession();

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/billing-portal/',
      {},
      { headers: {}, params: {} }
    );
  });
});
