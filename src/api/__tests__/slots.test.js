jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

const client = require('../client');
const { bulkGenerateSlots, blockSlot, unblockSlot } = require('../slots');

describe('bulkGenerateSlots', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts professional_id, period, interval_minutes and date with tenant params', async () => {
    client.post.mockResolvedValue({ data: { created: 10, skipped: 2 } });

    const result = await bulkGenerateSlots({
      professional_id: '5',
      period: 'week',
      interval_minutes: 45,
      date: '2026-07-10',
      slug: 'acme',
    });

    expect(client.post).toHaveBeenCalledWith(
      'slots/bulk-generate/',
      { professional_id: 5, period: 'week', interval_minutes: 45, date: '2026-07-10' },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
    expect(result).toEqual({ created: 10, skipped: 2 });
  });

  it('omits interval_minutes and date from the payload when not provided', async () => {
    client.post.mockResolvedValue({ data: { created: 5, skipped: 0 } });

    await bulkGenerateSlots({ professional_id: '3', period: 'day' });

    expect(client.post).toHaveBeenCalledWith(
      'slots/bulk-generate/',
      { professional_id: 3, period: 'day' },
      { params: {}, headers: {} }
    );
  });
});

describe('blockSlot', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the reason and tenant params when provided', async () => {
    client.post.mockResolvedValue({ data: { id: 7, status: 'blocked', blocked_reason: 'Manutenção' } });

    const result = await blockSlot(7, 'Manutenção', { slug: 'acme' });

    expect(client.post).toHaveBeenCalledWith(
      'slots/7/block/',
      { reason: 'Manutenção' },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
    expect(result).toEqual({ id: 7, status: 'blocked', blocked_reason: 'Manutenção' });
  });

  it('omits reason from the payload when not provided', async () => {
    client.post.mockResolvedValue({ data: { id: 7, status: 'blocked' } });

    await blockSlot(7);

    expect(client.post).toHaveBeenCalledWith('slots/7/block/', {}, { params: {}, headers: {} });
  });
});

describe('unblockSlot', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts to the unblock endpoint with tenant params', async () => {
    client.post.mockResolvedValue({ data: { id: 7, status: 'available' } });

    const result = await unblockSlot(7, { slug: 'acme' });

    expect(client.post).toHaveBeenCalledWith(
      'slots/7/unblock/',
      {},
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
    expect(result).toEqual({ id: 7, status: 'available' });
  });

  it('works without a tenant slug', async () => {
    client.post.mockResolvedValue({ data: { id: 7, status: 'available' } });

    await unblockSlot(7);

    expect(client.post).toHaveBeenCalledWith('slots/7/unblock/', {}, { params: {}, headers: {} });
  });
});
