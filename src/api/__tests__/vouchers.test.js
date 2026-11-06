jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

const client = require('../client');
const {
  fetchVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  assignVoucher,
  sendVoucherEmail,
} = require('../vouchers');

describe('fetchVouchers', () => {
  afterEach(() => jest.clearAllMocks());

  it('reads from the vouchers/ endpoint with tenant headers', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1, code: 'ABC123' }] });

    const result = await fetchVouchers({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('vouchers/', {
      params: { limit: 100, tenant: 'acme' },
      headers: { 'X-Tenant-Slug': 'acme' },
    });
    expect(result).toEqual([{ id: 1, code: 'ABC123' }]);
  });

  it('works without a slug', async () => {
    client.get.mockResolvedValue({ data: [] });

    await fetchVouchers();

    expect(client.get).toHaveBeenCalledWith('vouchers/', {
      params: { limit: 100 },
      headers: {},
    });
  });

  it('unwraps paginated results', async () => {
    client.get.mockResolvedValue({ data: { results: [{ id: 1 }] } });

    const result = await fetchVouchers({ slug: 'acme' });

    expect(result).toEqual([{ id: 1 }]);
  });
});

describe('createVoucher', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the payload without the slug, with tenant headers', async () => {
    client.post.mockResolvedValue({ data: { id: 1, code: 'ABC123' } });

    const result = await createVoucher({ slug: 'acme', type: 'percent', value: 10, max_uses: 1 });

    expect(client.post).toHaveBeenCalledWith(
      'vouchers/',
      { type: 'percent', value: 10, max_uses: 1 },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
    expect(result).toEqual({ id: 1, code: 'ABC123' });
  });
});

describe('updateVoucher', () => {
  afterEach(() => jest.clearAllMocks());

  it('patches the voucher by id', async () => {
    client.patch.mockResolvedValue({ data: { id: 1, max_uses: 5 } });

    const result = await updateVoucher(1, { slug: 'acme', max_uses: 5 });

    expect(client.patch).toHaveBeenCalledWith(
      'vouchers/1/',
      { max_uses: 5 },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
    expect(result).toEqual({ id: 1, max_uses: 5 });
  });
});

describe('deleteVoucher', () => {
  afterEach(() => jest.clearAllMocks());

  it('deletes the voucher by id', async () => {
    client.delete.mockResolvedValue({ data: {} });

    await deleteVoucher(1, { slug: 'acme' });

    expect(client.delete).toHaveBeenCalledWith('vouchers/1/', {
      params: { tenant: 'acme' },
      headers: { 'X-Tenant-Slug': 'acme' },
    });
  });
});

describe('assignVoucher', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the client_id to the assign endpoint', async () => {
    client.post.mockResolvedValue({ data: { id: 10, client: 5 } });

    const result = await assignVoucher(1, 5, { slug: 'acme' });

    expect(client.post).toHaveBeenCalledWith(
      'vouchers/1/assign/',
      { client_id: 5 },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
    expect(result).toEqual({ id: 10, client: 5 });
  });
});

describe('sendVoucherEmail', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the client_id to the send-email endpoint', async () => {
    client.post.mockResolvedValue({ data: { id: 10, client: 5 } });

    const result = await sendVoucherEmail(1, 5, { slug: 'acme' });

    expect(client.post).toHaveBeenCalledWith(
      'vouchers/1/send-email/',
      { client_id: 5 },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
    expect(result).toEqual({ id: 10, client: 5 });
  });
});
