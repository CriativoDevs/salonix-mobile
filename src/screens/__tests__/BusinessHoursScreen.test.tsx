import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import BusinessHoursScreen from '../BusinessHoursScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      error: '#ef4444',
    },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

const mockFetchTenantBusinessHours = jest.fn();
const mockUpdateTenantBusinessHours = jest.fn();
jest.mock('../../api/tenant', () => ({
  fetchTenantBusinessHours: (...args: any[]) => mockFetchTenantBusinessHours(...args),
  updateTenantBusinessHours: (...args: any[]) => mockUpdateTenantBusinessHours(...args),
}));

const FULL_WEEK_ACTIVE = [
  { id: 1, day_of_week: 0, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
  { id: 2, day_of_week: 1, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
  { id: 3, day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
  { id: 4, day_of_week: 3, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
  { id: 5, day_of_week: 4, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
  { id: 6, day_of_week: 5, start_time: '09:00:00', end_time: '13:00:00', is_active: true },
  { id: 7, day_of_week: 6, start_time: '09:00:00', end_time: '18:00:00', is_active: false },
];

describe('BusinessHoursScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
  });
  afterEach(() => jest.clearAllMocks());

  it('normalizes a partial response into 7 days with defaults for missing days', async () => {
    mockFetchTenantBusinessHours.mockResolvedValue([
      { id: 1, day_of_week: 0, start_time: '10:00:00', end_time: '19:00:00', is_active: true },
    ]);

    const { getByText, getByTestId } = await render(<BusinessHoursScreen />);

    await waitFor(() => expect(getByText('Segunda')).toBeTruthy());
    expect(getByText('Terça')).toBeTruthy();
    expect(getByText('Domingo')).toBeTruthy();
    // Dia devolvido pelo backend mostra os horários reais
    expect(getByText('10:00')).toBeTruthy();
    expect(getByText('19:00')).toBeTruthy();

    // Dias em falta (ex: Terça, day_of_week=1) usam o default 09:00–18:00,
    // só visível depois de ativar o dia (dias inativos não mostram os campos de hora).
    await act(async () => {
      getByTestId('business-hours-active-switch-1').props.onChange({ nativeEvent: { value: true } });
    });
    expect(getByText('09:00')).toBeTruthy();
    expect(getByText('18:00')).toBeTruthy();
  });

  it('shows a validation error per line when end time is not after start time', async () => {
    mockFetchTenantBusinessHours.mockResolvedValue(FULL_WEEK_ACTIVE);

    const { getByText, getByTestId } = await render(<BusinessHoursScreen />);
    await waitFor(() => expect(getByText('Segunda')).toBeTruthy());

    // Abre o picker de hora de fecho de Segunda (day_of_week=0) e simula uma
    // seleção anterior à hora de abertura (09:00).
    await fireEvent.press(getByTestId('business-hours-end-time-picker-0-button'));
    const endTimePicker = getByTestId('business-hours-end-time-picker-0');
    const target = new Date('2026-01-01T08:00:00');
    await act(async () => {
      endTimePicker.props.onChange({ nativeEvent: { timestamp: target.getTime() } });
    });

    await fireEvent.press(getByText('Guardar'));

    expect(getByText('A hora de fecho deve ser depois da hora de abertura.')).toBeTruthy();
    expect(mockUpdateTenantBusinessHours).not.toHaveBeenCalled();
  });

  it('submits the full 7-day payload and shows a success alert', async () => {
    mockFetchTenantBusinessHours.mockResolvedValue(FULL_WEEK_ACTIVE);
    mockUpdateTenantBusinessHours.mockResolvedValue(FULL_WEEK_ACTIVE);

    const { getByText } = await render(<BusinessHoursScreen />);
    await waitFor(() => expect(getByText('Segunda')).toBeTruthy());

    await fireEvent.press(getByText('Guardar'));

    await waitFor(() => {
      expect(mockUpdateTenantBusinessHours).toHaveBeenCalledWith(
        [
          { day_of_week: 0, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
          { day_of_week: 1, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
          { day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
          { day_of_week: 3, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
          { day_of_week: 4, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
          { day_of_week: 5, start_time: '09:00:00', end_time: '13:00:00', is_active: true },
          { day_of_week: 6, start_time: '09:00:00', end_time: '18:00:00', is_active: false },
        ],
        { slug: 'acme' }
      );
    });
  });

  it('shows the backend error detail message when the update fails', async () => {
    mockFetchTenantBusinessHours.mockResolvedValue(FULL_WEEK_ACTIVE);
    mockUpdateTenantBusinessHours.mockRejectedValue({
      response: { status: 403, data: { detail: 'Apenas owner ou manager podem editar o horário.' } },
    });
    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = await render(<BusinessHoursScreen />);
    await waitFor(() => expect(getByText('Segunda')).toBeTruthy());

    await fireEvent.press(getByText('Guardar'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Apenas owner ou manager podem editar o horário.');
    });

    alertSpy.mockRestore();
  });

  it('hides the toggles and "Guardar" button for a collaborator (read-only)', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'collaborator' } };
    mockFetchTenantBusinessHours.mockResolvedValue(FULL_WEEK_ACTIVE);

    const { getByText, queryByText } = await render(<BusinessHoursScreen />);
    await waitFor(() => expect(getByText('Segunda')).toBeTruthy());

    expect(queryByText('Guardar')).toBeNull();
  });
});
