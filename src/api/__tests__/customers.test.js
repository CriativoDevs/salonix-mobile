jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

const client = require('../client');
const {
  importCustomersCSV,
  fetchCustomersImportTemplate,
  exportCustomersCSV,
} = require('../customers');

describe('importCustomersCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the file as multipart form data with dry_run and tenant params', async () => {
    client.post.mockResolvedValue({
      data: { summary: { created: 1, updated: 0, skipped: 0, errors: [] } },
    });

    const file = { uri: 'file:///tmp/clientes.csv', name: 'clientes.csv', mimeType: 'text/csv' };
    const result = await importCustomersCSV(file, { dryRun: true, slug: 'acme' });

    expect(client.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = client.post.mock.calls[0];
    expect(url).toBe('import/customers/');
    expect(formData).toBeInstanceOf(FormData);
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data', 'X-Tenant-Slug': 'acme' },
      params: { dry_run: 'true', tenant: 'acme' },
    });
    expect(result).toEqual({ summary: { created: 1, updated: 0, skipped: 0, errors: [] } });
  });

  it('sends dry_run=false when confirming the import', async () => {
    client.post.mockResolvedValue({ data: { summary: { created: 2, updated: 0, skipped: 0, errors: [] } } });

    const file = { uri: 'file:///tmp/clientes.csv', name: 'clientes.csv' };
    await importCustomersCSV(file, { dryRun: false });

    const [, , config] = client.post.mock.calls[0];
    expect(config.params.dry_run).toBe('false');
  });
});

describe('fetchCustomersImportTemplate', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches the template as text', async () => {
    client.get.mockResolvedValue({ data: 'name,email,phone_number\n' });

    const result = await fetchCustomersImportTemplate({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('import/templates/customers.csv', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
      responseType: 'text',
    });
    expect(result).toBe('name,email,phone_number\n');
  });
});

describe('exportCustomersCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches all customers as CSV text', async () => {
    client.get.mockResolvedValue({ data: 'id,name\n1,Ana\n' });

    const result = await exportCustomersCSV({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('export/customers.csv', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
      responseType: 'text',
    });
    expect(result).toBe('id,name\n1,Ana\n');
  });
});
