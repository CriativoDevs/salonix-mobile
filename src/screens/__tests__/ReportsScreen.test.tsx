import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ReportsScreen from '../ReportsScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      textTertiary: '#999',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
      success: '#22c55e',
      error: '#ef4444',
    },
  }),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

const mockFetchBasicReports = jest.fn();
const mockFetchTopServices = jest.fn();
const mockFetchRevenue = jest.fn();
const mockFetchRetention = jest.fn();
const mockExportBasicReportsCSV = jest.fn();
jest.mock('../../api/reports', () => ({
  fetchBasicReports: (...args: any[]) => mockFetchBasicReports(...args),
  fetchTopServices: (...args: any[]) => mockFetchTopServices(...args),
  fetchRevenue: (...args: any[]) => mockFetchRevenue(...args),
  fetchRetention: (...args: any[]) => mockFetchRetention(...args),
  exportBasicReportsCSV: (...args: any[]) => mockExportBasicReportsCSV(...args),
}));

const mockSaveAndShareCSV = jest.fn();
jest.mock('../../utils/csvFileSharing', () => ({
  saveAndShareCSV: (...args: any[]) => mockSaveAndShareCSV(...args),
}));

const BASIC = {
  overview: { appointments_total: 40, appointments_completed: 30, revenue_total: 1200.5, avg_ticket: 30 },
};
const TOP_SERVICES = {
  top_services: [
    { service_name: 'Corte', qty: 20, revenue: 400 },
    { service_name: 'Manicure', qty: 10, revenue: 150 },
  ],
};
const REVENUE = {
  revenue: {
    series: [
      { period_start: '2026-06-15', revenue: 300, appointment_count: 10 },
      { period_start: '2026-06-22', revenue: 500, appointment_count: 15 },
    ],
  },
};
const RETENTION = {
  new_clients: { qty: 4, revenue: 120 },
  returning_clients: { qty: 6, revenue: 280 },
};

describe('ReportsScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockGoBack.mockClear();
    mockFetchBasicReports.mockResolvedValue(BASIC);
    mockFetchTopServices.mockResolvedValue(TOP_SERVICES);
    mockFetchRevenue.mockResolvedValue(REVENUE);
    mockFetchRetention.mockResolvedValue(RETENTION);
  });
  afterEach(() => jest.clearAllMocks());

  it('redirects back immediately when the user is not an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' } };

    render(<ReportsScreen />);

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
  });

  it('does not redirect when the user is an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };

    render(<ReportsScreen />);

    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('loads the Básicos tab by default and shows the 4 KPIs', async () => {
    const { getByText } = await render(<ReportsScreen />);

    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());
    expect(getByText('40')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
    expect(mockFetchTopServices).not.toHaveBeenCalled();
    expect(mockFetchRetention).not.toHaveBeenCalled();
  });

  it('sends from/to 30 days apart and no interval on the Básicos fetch', async () => {
    await render(<ReportsScreen />);

    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());
    const call = mockFetchBasicReports.mock.calls[0][0];
    expect(call.slug).toBe('acme');
    const from = new Date(call.from);
    const to = new Date(call.to);
    const diffDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it('fetches Top Serviços e Receita only when the Análise de Negócio tab is opened, and only once', async () => {
    const { getByText } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Análise de Negócio'));

    await waitFor(() => {
      expect(mockFetchTopServices).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, slug: 'acme' })
      );
    });
    expect(mockFetchRevenue).toHaveBeenCalledWith(
      expect.objectContaining({ interval: 'week', slug: 'acme' })
    );
    expect(getByText('Corte')).toBeTruthy();
    expect(getByText('Manicure')).toBeTruthy();

    await fireEvent.press(getByText('Básicos'));
    await fireEvent.press(getByText('Análise de Negócio'));

    expect(mockFetchTopServices).toHaveBeenCalledTimes(1);
    expect(mockFetchRevenue).toHaveBeenCalledTimes(1);
  });

  it('fetches Retenção only when the Insights tab is opened, and shows the calculated rate', async () => {
    const { getByText } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Insights'));

    await waitFor(() => expect(mockFetchRetention).toHaveBeenCalled());
    // 6 returning / (4 new + 6 returning) = 60.0%
    expect(getByText('60.0%')).toBeTruthy();
  });

  it('shows an alert and does not crash when a tab fetch fails', async () => {
    mockFetchTopServices.mockRejectedValue({ response: { status: 500, data: {} } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Análise de Negócio'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível carregar os dados desta aba.');
    });

    alertSpy.mockRestore();
  });

  it('exports the basic report CSV and shares it', async () => {
    mockExportBasicReportsCSV.mockResolvedValue('metric,value\nappointments_total,40\n');

    const { getByText } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Exportar CSV'));

    await waitFor(() => {
      expect(mockExportBasicReportsCSV).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'acme' })
      );
    });
    expect(mockSaveAndShareCSV).toHaveBeenCalledWith(
      'metric,value\nappointments_total,40\n',
      'relatorio-basico.csv'
    );
  });
});
