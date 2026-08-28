import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DayView } from '../DayView';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: { textPrimary: '#000', textSecondary: '#666', border: '#ccc', brandPrimary: '#3b82f6' },
  }),
}));

jest.mock('../../../hooks/useTenantBusinessHours', () => ({
  __esModule: true,
  default: () => ({ range: { startMinutes: 540, endMinutes: 1080 }, loading: false }),
}));

const mockUseBookingsRange = jest.fn();
jest.mock('../../../hooks/useBookingsRange', () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseBookingsRange(...args),
}));

const mockUseProfessionals = jest.fn();
jest.mock('../../../hooks/useProfessionals', () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseProfessionals(...args),
}));

function makeAppointment(overrides: Partial<any> = {}) {
  return {
    id: '1',
    status: 'scheduled',
    rangeLabel: '',
    start: new Date('2026-07-08T09:00:00'),
    end: new Date('2026-07-08T09:30:00'),
    customerId: 1,
    customerName: 'Ana',
    serviceId: 1,
    serviceName: 'Corte',
    professionalId: 1,
    professionalName: 'Joana',
    slotId: 1,
    ...overrides,
  };
}

describe('DayView', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseProfessionals.mockReturnValue({
      professionals: [
        { id: 1, name: 'Joana' },
        { id: 2, name: 'Pedro' },
      ],
      loading: false,
    });
  });

  it('fetches the range using the same day for dateFrom and dateTo', async () => {
    mockUseBookingsRange.mockReturnValue({ appointments: [], loading: false });
    await render(
      <DayView
        referenceDate={new Date('2026-07-08')}
        onChangeReferenceDate={jest.fn()}
        onPressAppointment={jest.fn()}
      />
    );
    expect(mockUseBookingsRange).toHaveBeenCalledWith('2026-07-08', '2026-07-08');
  });

  it('shows one column per professional returned by useProfessionals, regardless of appointments', async () => {
    mockUseBookingsRange.mockReturnValue({
      appointments: [makeAppointment({ id: '1', professionalId: 1, professionalName: 'Joana' })],
      loading: false,
    });
    const { getByText } = await render(
      <DayView
        referenceDate={new Date('2026-07-08')}
        onChangeReferenceDate={jest.fn()}
        onPressAppointment={jest.fn()}
      />
    );
    expect(getByText('Joana')).toBeTruthy();
    expect(getByText('Pedro')).toBeTruthy();
  });

  it('shows a specific placeholder when there are no professionals registered', async () => {
    mockUseBookingsRange.mockReturnValue({ appointments: [], loading: false });
    mockUseProfessionals.mockReturnValue({ professionals: [], loading: false });
    const { getByText } = await render(
      <DayView
        referenceDate={new Date('2026-07-08')}
        onChangeReferenceDate={jest.fn()}
        onPressAppointment={jest.fn()}
      />
    );
    expect(getByText('Nenhum profissional cadastrado')).toBeTruthy();
  });

  it('does not show the "no appointments" placeholder when professionals exist but have no bookings', async () => {
    mockUseBookingsRange.mockReturnValue({ appointments: [], loading: false });
    const { queryByText, getByText } = await render(
      <DayView
        referenceDate={new Date('2026-07-08')}
        onChangeReferenceDate={jest.fn()}
        onPressAppointment={jest.fn()}
      />
    );
    expect(queryByText('Sem agendamentos neste dia')).toBeNull();
    expect(getByText('Joana')).toBeTruthy();
  });

  it('navigates to BookingCreate with date and professionalId when an empty cell is pressed', async () => {
    mockUseBookingsRange.mockReturnValue({ appointments: [], loading: false });
    const { getByTestId } = await render(
      <DayView
        referenceDate={new Date('2026-07-08')}
        onChangeReferenceDate={jest.fn()}
        onPressAppointment={jest.fn()}
      />
    );
    fireEvent(getByTestId('hour-grid-empty-cell-1'), 'press', {
      nativeEvent: { locationY: 0 },
    });
    expect(mockNavigate).toHaveBeenCalledWith('BookingCreate', {
      date: '2026-07-08',
      professionalId: '1',
    });
  });
});
