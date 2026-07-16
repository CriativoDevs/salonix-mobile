import React from 'react';
import { render } from '@testing-library/react-native';
import { DayView } from '../DayView';

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

  it('groups appointments into one column per professional', async () => {
    mockUseBookingsRange.mockReturnValue({
      appointments: [
        makeAppointment({ id: '1', professionalId: 1, professionalName: 'Joana' }),
        makeAppointment({ id: '2', professionalId: 2, professionalName: 'Pedro' }),
      ],
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

  it('shows an empty state when there are no appointments', async () => {
    mockUseBookingsRange.mockReturnValue({ appointments: [], loading: false });
    const { getByText } = await render(
      <DayView
        referenceDate={new Date('2026-07-08')}
        onChangeReferenceDate={jest.fn()}
        onPressAppointment={jest.fn()}
      />
    );
    expect(getByText('Sem agendamentos neste dia')).toBeTruthy();
  });
});
