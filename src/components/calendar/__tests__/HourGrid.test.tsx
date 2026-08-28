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

  it('renders hour labels every 30 minutes (:00 and :30)', async () => {
    const { getByText } = await render(
      <HourGrid
        columns={[{ key: 'mon', label: 'Segunda', appointments: [] }]}
        rangeStartMinutes={540}
        rangeEndMinutes={660}
        onPressAppointment={jest.fn()}
      />
    );
    expect(getByText('09:00')).toBeTruthy();
    expect(getByText('09:30')).toBeTruthy();
    expect(getByText('10:00')).toBeTruthy();
  });

  it('calls onPressEmptyCell with the column and the minutes rounded to the nearest 30', async () => {
    const onPressEmptyCell = jest.fn();
    const { getByTestId } = await render(
      <HourGrid
        columns={[{ key: 'mon', label: 'Segunda', appointments: [] }]}
        rangeStartMinutes={540}
        rangeEndMinutes={1080}
        onPressAppointment={jest.fn()}
        onPressEmptyCell={onPressEmptyCell}
      />
    );
    const cell = getByTestId('hour-grid-empty-cell-mon');
    // bodyHeight = ((1080-540)/60) * 64 = 576px. locationY=70 -> 605.625min -> rounds to 600 (10:00).
    fireEvent(cell, 'press', { nativeEvent: { locationY: 70 } });
    expect(onPressEmptyCell).toHaveBeenCalledWith(
      { key: 'mon', label: 'Segunda', appointments: [] },
      600
    );
  });

  it('rounds up to the next 30-minute slot when the touch is closer to it', async () => {
    const onPressEmptyCell = jest.fn();
    const { getByTestId } = await render(
      <HourGrid
        columns={[{ key: 'mon', label: 'Segunda', appointments: [] }]}
        rangeStartMinutes={540}
        rangeEndMinutes={1080}
        onPressAppointment={jest.fn()}
        onPressEmptyCell={onPressEmptyCell}
      />
    );
    const cell = getByTestId('hour-grid-empty-cell-mon');
    // bodyHeight = 576px, totalMinutes = 540. locationY=300 -> ~821.25min -> rounds to 810 (13:30).
    fireEvent(cell, 'press', { nativeEvent: { locationY: 300 } });
    expect(onPressEmptyCell).toHaveBeenCalledWith(
      { key: 'mon', label: 'Segunda', appointments: [] },
      810
    );
  });

  it('does not call onPressEmptyCell when pressing an existing appointment block', async () => {
    const onPressAppointment = jest.fn();
    const onPressEmptyCell = jest.fn();
    const appointment = makeAppointment();
    const { getByText } = await render(
      <HourGrid
        columns={[{ key: 'mon', label: 'Segunda', appointments: [appointment] }]}
        rangeStartMinutes={540}
        rangeEndMinutes={1080}
        onPressAppointment={onPressAppointment}
        onPressEmptyCell={onPressEmptyCell}
      />
    );
    fireEvent.press(getByText('Ana'));
    expect(onPressAppointment).toHaveBeenCalledWith(appointment);
    expect(onPressEmptyCell).not.toHaveBeenCalled();
  });
});
