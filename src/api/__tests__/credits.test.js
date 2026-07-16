jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const client = require('../client');
const { fetchCreditBalance, fetchCreditHistory, fetchCreditPackages, createCreditCheckoutSession } = require('../credits');

describe('fetchCreditBalance', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches the credit balance with tenant headers/params', async () => {
    client.get.mockResolvedValue({
      data: {
        current_balance: '15.00',
        total_purchased: '0.00',
        total_consumed: '5.00',
        total_bonus: '0.00',
        can_purchase_extra: true,
        has_auto_renewal: true,
      },
    });

    const result = await fetchCreditBalance({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('users/credits/balance/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
    });
    expect(result).toEqual({
      current_balance: '15.00',
      total_purchased: '0.00',
      total_consumed: '5.00',
      total_bonus: '0.00',
      can_purchase_extra: true,
      has_auto_renewal: true,
    });
  });

  it('works without a slug', async () => {
    client.get.mockResolvedValue({ data: {} });

    await fetchCreditBalance();

    expect(client.get).toHaveBeenCalledWith('users/credits/balance/', {
      headers: {},
      params: {},
    });
  });
});

describe('fetchCreditHistory', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches the credit history with tenant headers/params', async () => {
    client.get.mockResolvedValue({
      data: { count: 1, next: null, previous: null, results: [{ id: 1, transaction_type: 'purchase', amount_eur: '10.00' }] },
    });

    const result = await fetchCreditHistory({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('users/credits/history/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
    });
    expect(result).toEqual({ count: 1, next: null, previous: null, results: [{ id: 1, transaction_type: 'purchase', amount_eur: '10.00' }] });
  });

  it('works without a slug', async () => {
    client.get.mockResolvedValue({ data: { count: 0, results: [] } });

    await fetchCreditHistory();

    expect(client.get).toHaveBeenCalledWith('users/credits/history/', {
      headers: {},
      params: {},
    });
  });
});

describe('fetchCreditPackages', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches the available credit packages', async () => {
    client.get.mockResolvedValue({
      data: { packages: [{ credits: '5.00', price_eur: '5.00', price_id: 'price_1', description: 'Créditos de 5 EUR' }] },
    });

    const result = await fetchCreditPackages();

    expect(client.get).toHaveBeenCalledWith('payments/stripe/credits/packages/');
    expect(result).toEqual({ packages: [{ credits: '5.00', price_eur: '5.00', price_id: 'price_1', description: 'Créditos de 5 EUR' }] });
  });
});

describe('createCreditCheckoutSession', () => {
  afterEach(() => jest.clearAllMocks());

  it('sends a POST with amount_eur and tenant headers/params', async () => {
    client.post.mockResolvedValue({ data: { checkout_url: 'https://checkout.stripe.com/y', session_id: 'cs_2' } });

    const result = await createCreditCheckoutSession({ amount_eur: 10 }, { slug: 'acme' });

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/credits/checkout/',
      { amount_eur: 10 },
      { headers: { 'X-Tenant-Slug': 'acme' }, params: { tenant: 'acme' } }
    );
    expect(result).toEqual({ checkout_url: 'https://checkout.stripe.com/y', session_id: 'cs_2' });
  });

  it('works without a slug', async () => {
    client.post.mockResolvedValue({ data: {} });

    await createCreditCheckoutSession({ amount_eur: 25 });

    expect(client.post).toHaveBeenCalledWith(
      'payments/stripe/credits/checkout/',
      { amount_eur: 25 },
      { headers: {}, params: {} }
    );
  });
});
