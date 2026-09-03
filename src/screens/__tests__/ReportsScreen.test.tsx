import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ReportsScreen from '../ReportsScreen';

// Nota: `@react-native-picker/picker` não responde a `fireEvent(el, 'valueChange', ...)`
// neste ambiente de testes — o host component subjacente expõe um prop `onChange` que
// espera `{ nativeEvent: { newValue, newIndex } }`. A forma confirmada e fiável de
// simular a seleção é invocar `onChange` diretamente, dentro de `act()` (ver
// SlotBulkGenerateModal.test.tsx para o mesmo padrão).
async function selectPickerValue(getByTestId: any, testId: string, value: string, index = 0) {
  await act(async () => {
    getByTestId(testId).props.onChange({
      nativeEvent: { newValue: value, newIndex: index },
    });
  });
}

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
      warningBackground: '#fef3c7',
      errorBackground: '#fee2e2',
    },
  }),
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
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

const mockFetchProfessionals = jest.fn();
jest.mock('../../api/professionals', () => ({
  fetchProfessionals: (...args: any[]) => mockFetchProfessionals(...args),
}));

const mockFetchServices = jest.fn();
jest.mock('../../api/services', () => ({
  fetchServices: (...args: any[]) => mockFetchServices(...args),
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
  series: [
    { period_start: '2026-06-15', revenue: 300, appointment_count: 10 },
    { period_start: '2026-06-22', revenue: 500, appointment_count: 15 },
  ],
};
const RETENTION = {
  new_clients: { qty: 4, revenue: 120 },
  returning_clients: { qty: 6, revenue: 280 },
};

describe('ReportsScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockGoBack.mockClear();
    mockNavigate.mockClear();
    mockFetchBasicReports.mockResolvedValue(BASIC);
    mockFetchTopServices.mockResolvedValue(TOP_SERVICES);
    mockFetchRevenue.mockResolvedValue(REVENUE);
    mockFetchRetention.mockResolvedValue(RETENTION);
    mockFetchProfessionals.mockResolvedValue({ results: [{ id: 1, name: 'Ana' }] });
    mockFetchServices.mockResolvedValue({ results: [{ id: 9, name: 'Corte' }] });
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

  it('defaults the date range to the current month (1st of month through today)', async () => {
    render(<ReportsScreen />);

    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());
    const call = mockFetchBasicReports.mock.calls[0][0];
    expect(call.slug).toBe('acme');

    const now = new Date();
    const expectedFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const expectedTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(call.from).toBe(expectedFrom);
    expect(call.to).toBe(expectedTo);
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
    await waitFor(() => expect(getByText('Corte')).toBeTruthy());
    expect(getByText('Manicure')).toBeTruthy();

    await fireEvent.press(getByText('Básicos'));
    await fireEvent.press(getByText('Análise de Negócio'));

    expect(mockFetchTopServices).toHaveBeenCalledTimes(1);
    expect(mockFetchRevenue).toHaveBeenCalledTimes(1);
  });

  it('does not send professional_id/service_id when the "Todos" filter option is selected (default state)', async () => {
    const { getByText } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Análise de Negócio'));
    await waitFor(() => expect(mockFetchTopServices).toHaveBeenCalled());

    const topServicesCall = mockFetchTopServices.mock.calls[0][0];
    expect(topServicesCall.professionalId).toBeUndefined();
    expect(topServicesCall.serviceId).toBeUndefined();
    expect(topServicesCall).not.toHaveProperty('professional_id');
    expect(topServicesCall).not.toHaveProperty('service_id');

    await fireEvent.press(getByText('Insights'));
    await waitFor(() => expect(mockFetchRetention).toHaveBeenCalled());

    const retentionCall = mockFetchRetention.mock.calls[0][0];
    expect(retentionCall.professionalId).toBeUndefined();
    expect(retentionCall).not.toHaveProperty('professional_id');
  });

  it('fetches Retenção only when the Insights tab is opened, and shows the calculated rate', async () => {
    const { getByText } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Insights'));

    await waitFor(() => expect(mockFetchRetention).toHaveBeenCalled());
    // 6 returning / (4 new + 6 returning) = 60.0%
    await waitFor(() => expect(getByText('60.0%')).toBeTruthy());
  });

  it('shows a network error banner with a retry action when a tab fetch fails with a non-403 error', async () => {
    mockFetchTopServices.mockRejectedValue({ response: { status: 500, data: {} } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Análise de Negócio'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível carregar os dados desta aba.');
    });
    expect(getByText('Não foi possível carregar os dados desta aba.')).toBeTruthy();
    expect(getByText('Tentar novamente')).toBeTruthy();

    alertSpy.mockRestore();
  });

  it('shows a plan-gated (forbidden) message instead of a generic alert on a 403', async () => {
    mockFetchTopServices.mockRejectedValue({ response: { status: 403, data: {} } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Análise de Negócio'));

    await waitFor(() => {
      expect(getByText('O seu plano atual não inclui a Análise de Negócio.')).toBeTruthy();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    expect(getByText('Ver planos')).toBeTruthy();

    alertSpy.mockRestore();
  });

  it('shows an empty-state message when a tab returns no data for the period', async () => {
    mockFetchTopServices.mockResolvedValue({ top_services: [] });
    mockFetchRevenue.mockResolvedValue({ revenue: { series: [] } });

    const { getByText, getAllByText } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Análise de Negócio'));

    await waitFor(() => {
      expect(getAllByText('Nenhum dado no período selecionado.').length).toBeGreaterThan(0);
    });
  });

  it('re-fetches the Análise de Negócio tab when the interval filter changes and is applied', async () => {
    const { getByText, getByTestId } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Análise de Negócio'));
    await waitFor(() => expect(mockFetchRevenue).toHaveBeenCalledTimes(1));
    expect(mockFetchRevenue).toHaveBeenCalledWith(expect.objectContaining({ interval: 'week' }));

    await fireEvent.press(getByTestId('toggle-filters'));
    await fireEvent.press(getByText('Mês'));
    await fireEvent.press(getByText('Aplicar filtros'));

    await waitFor(() => expect(mockFetchRevenue).toHaveBeenCalledTimes(2));
    expect(mockFetchRevenue).toHaveBeenLastCalledWith(expect.objectContaining({ interval: 'month' }));
  });

  it('toggles the revenue chart to a table view with formatted period/revenue/appointments rows', async () => {
    const { getByText, getByTestId, queryByTestId } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Análise de Negócio'));
    await waitFor(() => expect(mockFetchRevenue).toHaveBeenCalled());

    // Chart view by default: no table rendered yet.
    expect(queryByTestId('revenue-table')).toBeNull();

    await fireEvent.press(getByTestId('revenue-view-table'));

    expect(getByTestId('revenue-table')).toBeTruthy();
    expect(getByText('Período')).toBeTruthy();
    expect(getByText('Receita')).toBeTruthy();
    expect(getByText('15/06')).toBeTruthy();
    expect(getByText('22/06')).toBeTruthy();
    expect(getByText('300,00 €')).toBeTruthy();
    expect(getByText('500,00 €')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();

    await fireEvent.press(getByTestId('revenue-view-chart'));
    expect(queryByTestId('revenue-table')).toBeNull();
  });

  it('opens the Profissional filter in a modal and applies the selection via the picker inside it', async () => {
    const { getByText, getAllByText, getByTestId, queryByTestId } = await render(<ReportsScreen />);
    await waitFor(() => expect(mockFetchBasicReports).toHaveBeenCalled());

    await fireEvent.press(getByText('Análise de Negócio'));
    await waitFor(() => expect(mockFetchTopServices).toHaveBeenCalled());

    await fireEvent.press(getByTestId('toggle-filters'));

    // Picker is not rendered inline; it lives inside the trigger's modal.
    expect(queryByTestId('reports-professional-picker')).toBeNull();
    // Both triggers ("Profissional" and "Serviço") default to "Todos".
    expect(getAllByText('Todos').length).toBe(2);

    await fireEvent.press(getByTestId('reports-professional-picker-trigger'));
    await selectPickerValue(getByTestId, 'reports-professional-picker', '1', 0);
    await fireEvent.press(getByText('Concluir'));

    await fireEvent.press(getByTestId('reports-service-picker-trigger'));
    await selectPickerValue(getByTestId, 'reports-service-picker', '9', 0);
    await fireEvent.press(getByText('Concluir'));

    await fireEvent.press(getByText('Aplicar filtros'));

    await waitFor(() => {
      expect(mockFetchTopServices).toHaveBeenLastCalledWith(
        expect.objectContaining({ professionalId: '1', serviceId: '9' })
      );
    });
    expect(mockFetchRevenue).toHaveBeenCalled();
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
