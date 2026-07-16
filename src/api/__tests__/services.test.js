jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

const client = require('../client');
const {
  fetchAdminServices,
  createService,
  updateService,
  deleteService,
  importServicesCSV,
  fetchServicesImportTemplate,
  exportServicesCSV,
} = require('../services');

describe('fetchAdminServices', () => {
  afterEach(() => jest.clearAllMocks());

  it('reads from the authenticated services/ endpoint with tenant headers', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1, name: 'Corte' }] });

    const result = await fetchAdminServices({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('services/', {
      params: { limit: 100, tenant: 'acme' },
      headers: { 'X-Tenant-Slug': 'acme' },
    });
    expect(result).toEqual([{ id: 1, name: 'Corte' }]);
  });

  it('works without a slug', async () => {
    client.get.mockResolvedValue({ data: [] });

    await fetchAdminServices();

    expect(client.get).toHaveBeenCalledWith('services/', {
      params: { limit: 100 },
      headers: {},
    });
  });
});

describe('createService', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the payload without the slug field, with tenant headers', async () => {
    client.post.mockResolvedValue({ data: { id: 2, name: 'Manicure' } });

    const result = await createService({
      slug: 'acme',
      name: 'Manicure',
      price_eur: '25.00',
      duration_minutes: 45,
    });

    expect(client.post).toHaveBeenCalledWith(
      'services/',
      { name: 'Manicure', price_eur: '25.00', duration_minutes: 45 },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
    expect(result).toEqual({ id: 2, name: 'Manicure' });
  });
});

describe('updateService', () => {
  afterEach(() => jest.clearAllMocks());

  it('patches the given service id', async () => {
    client.patch.mockResolvedValue({ data: { id: 1, name: 'Corte novo' } });

    await updateService(1, { slug: 'acme', name: 'Corte novo' });

    expect(client.patch).toHaveBeenCalledWith(
      'services/1/',
      { name: 'Corte novo' },
      { params: { tenant: 'acme' }, headers: { 'X-Tenant-Slug': 'acme' } }
    );
  });
});

describe('deleteService', () => {
  afterEach(() => jest.clearAllMocks());

  it('deletes the given service id', async () => {
    client.delete.mockResolvedValue({ data: null });

    await deleteService(7);

    expect(client.delete).toHaveBeenCalledWith('services/7/');
  });
});

describe('importServicesCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the file as multipart form data with dry_run and tenant params', async () => {
    client.post.mockResolvedValue({
      data: { summary: { created: 1, updated: 0, skipped: 0, errors: [] } },
    });

    const file = { uri: 'file:///tmp/servicos.csv', name: 'servicos.csv', mimeType: 'text/csv' };
    const result = await importServicesCSV(file, { dryRun: true, slug: 'acme' });

    expect(client.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = client.post.mock.calls[0];
    expect(url).toBe('import/services/');
    expect(formData).toBeInstanceOf(FormData);
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data', 'X-Tenant-Slug': 'acme' },
      params: { dry_run: 'true', tenant: 'acme' },
    });
    expect(result).toEqual({ summary: { created: 1, updated: 0, skipped: 0, errors: [] } });
  });

  it('sends dry_run=false when confirming the import', async () => {
    client.post.mockResolvedValue({ data: { summary: { created: 2, updated: 0, skipped: 0, errors: [] } } });

    const file = { uri: 'file:///tmp/servicos.csv', name: 'servicos.csv' };
    await importServicesCSV(file, { dryRun: false });

    const [, , config] = client.post.mock.calls[0];
    expect(config.params.dry_run).toBe('false');
  });
});

describe('fetchServicesImportTemplate', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches the template as text', async () => {
    client.get.mockResolvedValue({ data: 'name,price_eur,duration_minutes\n' });

    const result = await fetchServicesImportTemplate({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('import/templates/services.csv', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
      responseType: 'text',
    });
    expect(result).toBe('name,price_eur,duration_minutes\n');
  });
});

describe('exportServicesCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches all services as CSV text', async () => {
    client.get.mockResolvedValue({ data: 'id,name\n1,Corte\n' });

    const result = await exportServicesCSV({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('export/services.csv', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
      responseType: 'text',
    });
    expect(result).toBe('id,name\n1,Corte\n');
  });
});
