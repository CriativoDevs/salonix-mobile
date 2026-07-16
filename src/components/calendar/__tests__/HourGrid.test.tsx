import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HourGrid } from '../HourGrid';

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: { textPrimary: '#000', textSecondary: '#666', border: '#ccc' },
  }),
}));

function makeAppointment(overrides: Partial<any> = {}) {
  return {
    id: '1',
    status: 'scheduled',
    rangeLabel: '',
    start: new Date('2026-07-06T09:00:00'),
    end: new Date('2026-07-06T09:30:00'),
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

describe('HourGrid', () => {
  it('renders a column header for each column', async () => {
    const { getByText } = await render(
      <HourGrid
        columns={[{ key: 'mon', label: 'Segunda', appointments: [] }]}
        rangeStartMinutes={540}
        rangeEndMinutes={1080}
        onPressAppointment={jest.fn()}
      />
    );
    expect(getByText('Segunda')).toBeTruthy();
  });

  it('calls onPressAppointment when a block is pressed', async () => {
    const onPressAppointment = jest.fn();
    const appointment = makeAppointment();
    const { getByText } = await render(
      <HourGrid
        columns={[{ key: 'mon', label: 'Segunda', appointments: [appointment] }]}
        rangeStartMinutes={540}
        rangeEndMinutes={1080}
        onPressAppointment={onPressAppointment}
      />
    );
    fireEvent.press(getByText('Ana'));
    expect(onPressAppointment).toHaveBeenCalledWith(appointment);
  });

  it('does not render a block for appointments without a start date', async () => {
    const appointment = makeAppointment({ start: null });
    const { queryByText } = await render(
      <HourGrid
        columns={[{ key: 'mon', label: 'Segunda', appointments: [appointment] }]}
        rangeStartMinutes={540}
        rangeEndMinutes={1080}
        onPressAppointment={jest.fn()}
      />
    );
    expect(queryByText('Ana')).toBeNull();
  });
});
