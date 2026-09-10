jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

const client = require('../client');
const {
  fetchInventoryItems,
  fetchInventoryAlerts,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} = require('../inventory');

describe('fetchInventoryItems', () => {
  afterEach(() => jest.clearAllMocks());

  it('reads from the inventory/items/ endpoint with tenant headers', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1, name: 'Shampoo' }] });

    const result = await fetchInventoryItems({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('inventory/items/', {
      params: { limit: 100, tenant: 'acme' },
      headers: { 'X-Tenant-Slug': 'acme' },
    });
    expect(result).toEqual([{ id: 1, name: 'Shampoo' }]);
  });

  it('works without a slug', async () => {
    client.get.mockResolvedValue({ data: [] });

    await fetchInventoryItems();

    expect(client.get).toHaveBeenCalledWith('inventory/items/', {
      params: { limit: 100 },
      headers: {},
    });
  });

  it('unwraps paginated results', async () => {
    client.get.mockResolvedValue({ data: { results: [{ id: 1 }] } });

    const result = await fetchInventoryItems({ slug: 'acme' });

    expect(result).toEqual([{ id: 1 }]);
  });
});

describe('fetchInventoryAlerts', () => {
  afterEach(() => jest.clearAllMocks());

  it('reads from the inventory/alerts/ endpoint with tenant headers', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1, name: 'Shampoo', quantity: 1, minimum_quantity: 2 }] });

    const result = await fetchInventoryAlerts({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('inventory/alerts/', {
      params: { limit: 100, tenant: 'acme' },
      headers: { 'X-Tenant-Slug': 'acme' },
    });
    expect(result).toEqual([{ id: 1, name: 'Shampoo', quantity: 1, minimum_quantity: 2 }]);
  });

  it('works without a slug', async () => {
    client.get.mockResolvedValue({ data: [] });

    await fetchInventoryAlerts();

    expect(client.get).toHaveBeenCalledWith('inventory/alerts/', {
      params: { limit: 100 },
      headers: {},
    });
  });

  it('unwraps paginated results', async () => {
    client.get.mockResolvedValue({ data: { results: [{ id: 1 }] } });

    const result = await fetchInventoryAlerts({ slug: 'acme' });

    expect(result).toEqual([{ id: 1 }]);
  });
});

describe('createInventoryItem', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the payload without the slug field, with tenant headers', async () => {
    client.post.mockResolvedValue({ data: { id: 2, name: 'Cera' } });

    const result = await createInventoryItem({
      slug: 'acme',
      name: 'Cera',
      unit: 'un',
      quantity: 10,
      minimum_quantity: 2,
    });

    expect(client.post).toHaveBeenCalledWith(
      'inventory/items/',
      { name: 'Cera', unit: 'un', quantity: 10, minimum_quantity: 2 },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
    expect(result).toEqual({ id: 2, name: 'Cera' });
  });
});

describe('updateInventoryItem', () => {
  afterEach(() => jest.clearAllMocks());

  it('patches the given item id', async () => {
    client.patch.mockResolvedValue({ data: { id: 1, name: 'Cera nova' } });

    await updateInventoryItem(1, { slug: 'acme', name: 'Cera nova' });

    expect(client.patch).toHaveBeenCalledWith(
      'inventory/items/1/',
      { name: 'Cera nova' },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
  });
});

describe('deleteInventoryItem', () => {
  afterEach(() => jest.clearAllMocks());

  it('deletes the given item id', async () => {
    client.delete.mockResolvedValue({ data: null });

    await deleteInventoryItem(7);

    expect(client.delete).toHaveBeenCalledWith('inventory/items/7/');
  });
});
