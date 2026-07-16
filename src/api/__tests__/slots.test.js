jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

const client = require('../client');
const { bulkGenerateSlots } = require('../slots');

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
