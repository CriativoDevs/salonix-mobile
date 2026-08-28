import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BookingCreateScreen from '../BookingCreateScreen';

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

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ userInfo: { id: 1, role: 'owner' } }),
}));

const mockClientGet = jest.fn();
jest.mock('../../api/client', () => ({
  get: (...args: any[]) => mockClientGet(...args),
}));

const mockFetchSlots = jest.fn();
const mockFetchAvailableDates = jest.fn();
jest.mock('../../api/slots', () => ({
  fetchSlots: (...args: any[]) => mockFetchSlots(...args),
  fetchAvailableDates: (...args: any[]) => mockFetchAvailableDates(...args),
}));

jest.mock('../../api/customers', () => ({
  fetchCustomers: jest.fn().mockResolvedValue([]),
}));

const mockCreateAppointment = jest.fn();
jest.mock('../../api/bookings', () => ({
  createAppointment: (...args: any[]) => mockCreateAppointment(...args),
}));

const mockUseProfessionals = jest.fn();
jest.mock('../../hooks/useProfessionals', () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseProfessionals(...args),
}));

function makeNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn(), popToTop: jest.fn() };
}

describe('BookingCreateScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClientGet.mockImplementation((url: string) => {
      if (url === 'public/services/') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Corte', duration_minutes: 30, price_eur: '20.00' }],
        });
      }
      return Promise.resolve({ data: [] });
    });
    mockUseProfessionals.mockReturnValue({ professionals: [], loading: false, reload: jest.fn() });
    mockFetchAvailableDates.mockResolvedValue([]);
    mockFetchSlots.mockResolvedValue([]);
  });

  it('starts on the service step when no params are given', async () => {
    const { findByText } = await render(
      <BookingCreateScreen navigation={makeNavigation()} route={{ params: undefined }} />
    );
    expect(await findByText('Qual serviço deseja agendar?')).toBeTruthy();
  });

  it('starts on the service step when only a date param is given (no professionalId)', async () => {
    const { findByText, queryByText } = await render(
      <BookingCreateScreen
        navigation={makeNavigation()}
        route={{ params: { date: '2026-08-30' } }}
      />
    );
    expect(await findByText('Qual serviço deseja agendar?')).toBeTruthy();
    expect(queryByText('Quando?')).toBeNull();
  });

  it('jumps directly to the date/slot step when professionalId is given, and pre-selects the professional', async () => {
    mockUseProfessionals.mockReturnValue({
      professionals: [{ id: 5, name: 'Joana' }],
      loading: false,
      reload: jest.fn(),
    });
    mockFetchAvailableDates.mockResolvedValue(['2026-08-30']);

    const { findByText, queryByText } = await render(
      <BookingCreateScreen
        navigation={makeNavigation()}
        route={{ params: { date: '2026-08-30', professionalId: 5 } }}
      />
    );

    expect(await findByText('Quando?')).toBeTruthy();
    expect(queryByText('Qual serviço deseja agendar?')).toBeNull();
    expect(queryByText('Com qual profissional?')).toBeNull();
  });

  it('after picking a slot with professionalId preset, routes through the service step and then straight to the customer step', async () => {
    mockUseProfessionals.mockReturnValue({
      professionals: [{ id: 5, name: 'Joana' }],
      loading: false,
      reload: jest.fn(),
    });
    mockFetchAvailableDates.mockResolvedValue(['2026-08-30']);
    mockFetchSlots.mockResolvedValue([
      { id: 9, start_time: '2026-08-30T10:00:00', end_time: '2026-08-30T10:30:00', is_available: true },
    ]);

    const { findByText, getByText, queryByText } = await render(
      <BookingCreateScreen
        navigation={makeNavigation()}
        route={{ params: { date: '2026-08-30', professionalId: 5 } }}
      />
    );

    // Ja entra direto no passo Data/Slot
    await findByText('Quando?');
    const slotButton = await findByText('10:00');
    await fireEvent.press(slotButton);

    // Continuar -> como ainda falta o servico, o wizard leva de volta ao passo Servico
    await fireEvent.press(await findByText('Continuar'));
    expect(await findByText('Qual serviço deseja agendar?')).toBeTruthy();

    // Escolhe o servico e continua -> pula profissional/data (ja escolhidos) e vai direto para Cliente
    await fireEvent.press(getByText('Corte'));
    await fireEvent.press(await findByText('Continuar'));

    expect(await findByText('Para qual cliente?')).toBeTruthy();
    expect(queryByText('Com qual profissional?')).toBeNull();
  });

  it('allows navigating back from the date/slot step to the professional step when entering via professionalId', async () => {
    mockUseProfessionals.mockReturnValue({
      professionals: [{ id: 5, name: 'Joana' }],
      loading: false,
      reload: jest.fn(),
    });
    mockFetchAvailableDates.mockResolvedValue(['2026-08-30']);

    const { findByText, getByTestId } = await render(
      <BookingCreateScreen
        navigation={makeNavigation()}
        route={{ params: { date: '2026-08-30', professionalId: 5 } }}
      />
    );

    await findByText('Quando?');
    fireEvent.press(getByTestId('booking-create-back-button'));
    expect(await findByText('Com qual profissional?')).toBeTruthy();
    expect(await findByText('Joana')).toBeTruthy();

    fireEvent.press(getByTestId('booking-create-back-button'));
    expect(await findByText('Qual serviço deseja agendar?')).toBeTruthy();
  });

  it('calls navigation.goBack when pressing back on the first step', async () => {
    const navigation = makeNavigation();
    const { findByText, getByTestId } = await render(
      <BookingCreateScreen navigation={navigation} route={{ params: undefined }} />
    );
    await findByText('Qual serviço deseja agendar?');
    fireEvent.press(getByTestId('booking-create-back-button'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
