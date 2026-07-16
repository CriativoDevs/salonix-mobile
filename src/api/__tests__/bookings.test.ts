jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const client = require('../client');
const {
  importAppointmentsCSV,
  fetchAppointmentsImportTemplate,
  exportAppointmentsCSV,
} = require('../bookings');

describe('importAppointmentsCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('posts the file as multipart form data with dry_run and tenant params', async () => {
    client.post.mockResolvedValue({
      data: { summary: { created: 1, updated: 0, skipped: 0, errors: [] } },
    });

    const file = { uri: 'file:///tmp/agendamentos.csv', name: 'agendamentos.csv', mimeType: 'text/csv' };
    const result = await importAppointmentsCSV(file, { dryRun: true, slug: 'acme' });

    expect(client.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = client.post.mock.calls[0];
    expect(url).toBe('import/appointments/');
    expect(formData).toBeInstanceOf(FormData);
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data', 'X-Tenant-Slug': 'acme' },
      params: { dry_run: 'true', tenant: 'acme' },
    });
    expect(result).toEqual({ summary: { created: 1, updated: 0, skipped: 0, errors: [] } });
  });

  it('sends dry_run=false when confirming the import', async () => {
    client.post.mockResolvedValue({ data: { summary: { created: 2, updated: 0, skipped: 0, errors: [] } } });

    const file = { uri: 'file:///tmp/agendamentos.csv', name: 'agendamentos.csv' };
    await importAppointmentsCSV(file, { dryRun: false });

    const [, , config] = client.post.mock.calls[0];
    expect(config.params.dry_run).toBe('false');
  });
});

describe('fetchAppointmentsImportTemplate', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches the template as text', async () => {
    client.get.mockResolvedValue({ data: 'customer_email,service_name\n' });

    const result = await fetchAppointmentsImportTemplate({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('import/templates/appointments.csv', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
      responseType: 'text',
    });
    expect(result).toBe('customer_email,service_name\n');
  });
});

describe('exportAppointmentsCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches all appointments as CSV text', async () => {
    client.get.mockResolvedValue({ data: 'id,customer\n1,Ana\n' });

    const result = await exportAppointmentsCSV({ slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('salon/appointments/export/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme' },
      responseType: 'text',
    });
    expect(result).toBe('id,customer\n1,Ana\n');
  });
});
