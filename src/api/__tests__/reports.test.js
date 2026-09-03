jest.mock('../client', () => ({
  get: jest.fn(),
}));

const client = require('../client');
const {
  fetchBasicReports,
  fetchTopServices,
  fetchRevenue,
  fetchRetention,
  exportBasicReportsCSV,
} = require('../reports');

describe('fetchBasicReports', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches with from/to and tenant headers/params', async () => {
    client.get.mockResolvedValue({ data: { overview: { appointments_total: 10 } } });

    const result = await fetchBasicReports({ from: '2026-06-09', to: '2026-07-09', slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('reports/basic/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme', from: '2026-06-09', to: '2026-07-09' },
    });
    expect(result).toEqual({ overview: { appointments_total: 10 } });
  });
});

describe('fetchTopServices', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches with from/to/limit and tenant headers/params', async () => {
    client.get.mockResolvedValue({ data: { top_services: [] } });

    const result = await fetchTopServices({ from: '2026-06-09', to: '2026-07-09', limit: 10, slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('reports/top-services/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme', from: '2026-06-09', to: '2026-07-09', limit: 10 },
    });
    expect(result).toEqual({ top_services: [] });
  });

  it('includes professional_id and service_id when provided', async () => {
    client.get.mockResolvedValue({ data: { top_services: [] } });

    await fetchTopServices({
      from: '2026-06-09',
      to: '2026-07-09',
      limit: 10,
      professionalId: '7',
      serviceId: '3',
      slug: 'acme',
    });

    expect(client.get).toHaveBeenCalledWith('reports/top-services/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: {
        tenant: 'acme',
        from: '2026-06-09',
        to: '2026-07-09',
        limit: 10,
        professional_id: '7',
        service_id: '3',
      },
    });
  });
});

describe('fetchRevenue', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches with from/to/interval and tenant headers/params', async () => {
    client.get.mockResolvedValue({ data: { revenue: { series: [] } } });

    const result = await fetchRevenue({ from: '2026-06-09', to: '2026-07-09', interval: 'week', slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('reports/revenue/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme', from: '2026-06-09', to: '2026-07-09', interval: 'week' },
    });
    expect(result).toEqual({ revenue: { series: [] } });
  });
});

describe('fetchRetention', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches with from/to and tenant headers/params', async () => {
    client.get.mockResolvedValue({ data: { new_clients: { qty: 1 }, returning_clients: { qty: 2 } } });

    const result = await fetchRetention({ from: '2026-06-09', to: '2026-07-09', slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('reports/retention/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme', from: '2026-06-09', to: '2026-07-09' },
    });
    expect(result).toEqual({ new_clients: { qty: 1 }, returning_clients: { qty: 2 } });
  });

  it('includes professional_id when provided', async () => {
    client.get.mockResolvedValue({ data: { new_clients: { qty: 1 }, returning_clients: { qty: 2 } } });

    await fetchRetention({ from: '2026-06-09', to: '2026-07-09', professionalId: '7', slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('reports/retention/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme', from: '2026-06-09', to: '2026-07-09', professional_id: '7' },
    });
  });
});

describe('exportBasicReportsCSV', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches CSV text with from/to and tenant headers/params', async () => {
    client.get.mockResolvedValue({ data: 'metric,value\nappointments_total,10\n' });

    const result = await exportBasicReportsCSV({ from: '2026-06-09', to: '2026-07-09', slug: 'acme' });

    expect(client.get).toHaveBeenCalledWith('reports/basic/export/', {
      headers: { 'X-Tenant-Slug': 'acme' },
      params: { tenant: 'acme', from: '2026-06-09', to: '2026-07-09' },
      responseType: 'text',
    });
    expect(result).toBe('metric,value\nappointments_total,10\n');
  });
});
