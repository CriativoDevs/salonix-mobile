jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

// staff.js imports useTenant (unused by the functions under test here), which
// pulls in AsyncStorage's native module. Mock it so this suite can run in the
// Jest environment without a native AsyncStorage binding, same pattern used
// in src/screens/__tests__/ServicesScreen.test.tsx.
jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

const client = require('../client');
const {
  importStaffCSV,
  fetchStaffImportTemplate,
  exportStaffCSV,
} = require('../staff');

describe('importStaffCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the file as multipart form data with dry_run and tenant params', async () => {
    client.post.mockResolvedValue({
      data: { summary: { created: 1, updated: 0, skipped: 0, errors: [] } },
    });

    const file = { uri: 'file:///tmp/staff.csv', name: 'staff.csv', mimeType: 'text/csv' };
    const result = await importStaffCSV(file, { dryRun: true, slug: 'acme' });

    expect(client.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = client.post.mock.calls[0];
    expect(url).toBe('import/staff/');
    expect(formData).toBeInstanceOf(FormData);
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data', 'X-Tenant-Slug': 'acme' },
      params: { dry_run: 'true', tenant: 'acme' },
    });
    expect(result).toEqual({ summary: { created: 1, updated: 0, skipped: 0, errors: [] } });
  });

  it('sends dry_run=false when confirming the import', async () => {
    client.post.mockResolvedValue({ data: { summary: { created: 2, updated: 0, skipped: 0, errors: [] } } });

    const file = { uri: 'file:///tmp/staff.csv', name: 'staff.csv' };
    await importStaffCSV(file, { dryRun: false });

    const [, , config] = client.post.mock.calls[0];
    expect(config.params.dry_run).toBe('false');
  });
});

describe('fetchStaffImportTemplate', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches the template as text', async () => {
    client.get.mockResolvedValue({ data: 'email,role\n' });

    const result = await fetchStaffImportTemplate({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('import/templates/staff.csv', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
      responseType: 'text',
    });
    expect(result).toBe('email,role\n');
  });
});

describe('exportStaffCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches all staff as CSV text', async () => {
    client.get.mockResolvedValue({ data: 'id,email\n1,joao@acme.pt\n' });

    const result = await exportStaffCSV({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('export/staff.csv', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
      responseType: 'text',
    });
    expect(result).toBe('id,email\n1,joao@acme.pt\n');
  });
});
