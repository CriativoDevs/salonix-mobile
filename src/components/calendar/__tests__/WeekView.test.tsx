import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WeekView } from '../WeekView';

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

describe('WeekView', () => {
  beforeEach(() => {
    mockUseBookingsRange.mockReturnValue({ appointments: [], loading: false });
  });

  it('fetches the range for the visible week (Monday to Sunday)', async () => {
    await render(
      <WeekView
        referenceDate={new Date('2026-07-08')}
        onChangeReferenceDate={jest.fn()}
        onPressAppointment={jest.fn()}
      />
    );
    expect(mockUseBookingsRange).toHaveBeenCalledWith('2026-07-06', '2026-07-12');
  });

  it('calls onChangeReferenceDate with the previous week when navigating back', async () => {
    const onChangeReferenceDate = jest.fn();
    const { getByText } = await render(
      <WeekView
        referenceDate={new Date('2026-07-08')}
        onChangeReferenceDate={onChangeReferenceDate}
        onPressAppointment={jest.fn()}
      />
    );
    fireEvent.press(getByText('< Semana anterior'));
    expect(onChangeReferenceDate).toHaveBeenCalled();
    const calledWith: Date = onChangeReferenceDate.mock.calls[0][0];
    expect(calledWith.getDate()).toBe(1);
  });
});
