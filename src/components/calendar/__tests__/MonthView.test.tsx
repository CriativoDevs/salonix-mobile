import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MonthView, startOfMonthGrid } from '../MonthView';

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

  it('starts the grid on Sunday, matching the Sun-first weekday header', () => {
    // 2026-07-01 e quarta-feira; grade deve comecar no domingo anterior (2026-06-28)
    const gridStart = startOfMonthGrid(new Date(2026, 6, 1));
    expect(gridStart.getDay()).toBe(0);
    expect(gridStart.getFullYear()).toBe(2026);
    expect(gridStart.getMonth()).toBe(5);
    expect(gridStart.getDate()).toBe(28);
  });

  it('places todays weekday in the column matching its real weekday', () => {
    // 2026-11-11 e quarta-feira (index 3 numa semana Dom..Sab)
    const gridStart = startOfMonthGrid(new Date(2026, 10, 1));
    const diffInDays = Math.round(
      (new Date(2026, 10, 11).getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffInDays % 7).toBe(3);
  });
});
