import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MonthView } from '../MonthView';

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: { textPrimary: '#000', textSecondary: '#666', border: '#ccc', brandPrimary: '#3b82f6' },
  }),
}));

const mockUseBookingsRange = jest.fn();
jest.mock('../../../hooks/useBookingsRange', () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseBookingsRange(...args),
}));

describe('MonthView', () => {
  it('calls onSelectDay with the pressed date', async () => {
    mockUseBookingsRange.mockReturnValue({ appointments: [], loading: false });
    const onSelectDay = jest.fn();
    const { getAllByText } = await render(
      <MonthView referenceDate={new Date('2026-07-08')} onSelectDay={onSelectDay} />
    );
    const dayCells = getAllByText('8');
    fireEvent.press(dayCells[0]);
    expect(onSelectDay).toHaveBeenCalled();
  });

  it('fetches a range covering the full 6-week grid', async () => {
    mockUseBookingsRange.mockReturnValue({ appointments: [], loading: false });
    await render(<MonthView referenceDate={new Date('2026-07-08')} onSelectDay={jest.fn()} />);
    const [dateFrom, dateTo] = mockUseBookingsRange.mock.calls[0];
    expect(dateFrom <= '2026-07-01').toBe(true);
    expect(dateTo >= '2026-07-31').toBe(true);
  });
});
