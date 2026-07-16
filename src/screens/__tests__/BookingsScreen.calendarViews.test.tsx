import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BookingsScreen from '../BookingsScreen';

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

jest.mock('../../hooks/useBookings', () => ({
  __esModule: true,
  default: () => ({
    appointments: [],
    totalCount: 0,
    loading: false,
    loadingMore: false,
    error: null,
    customers: [],
    refetch: jest.fn(),
    loadMore: jest.fn(),
  }),
}));

jest.mock('../../components/calendar/WeekView', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    WeekView: () => <Text testID="week-view-stub">week</Text>,
    default: () => <Text testID="week-view-stub">week</Text>,
  };
});
jest.mock('../../components/calendar/DayView', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    DayView: () => <Text testID="day-view-stub">day</Text>,
    default: () => <Text testID="day-view-stub">day</Text>,
  };
});
jest.mock('../../components/calendar/MonthView', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    MonthView: () => <Text testID="month-view-stub">month</Text>,
    default: () => <Text testID="month-view-stub">month</Text>,
  };
});

describe('BookingsScreen - segmented control de vistas', () => {
  it('mostra o segmented control Agenda | Dia | Semana | Mês', async () => {
    const { getByText } = await render(<BookingsScreen navigation={{ navigate: jest.fn() }} />);
    expect(getByText('Agenda')).toBeTruthy();
    expect(getByText('Dia')).toBeTruthy();
    expect(getByText('Semana')).toBeTruthy();
    expect(getByText('Mês')).toBeTruthy();
  });

  it('inicia na vista Semana por defeito', async () => {
    const { getByTestId } = await render(<BookingsScreen navigation={{ navigate: jest.fn() }} />);
    expect(getByTestId('week-view-stub')).toBeTruthy();
  });

  it('troca para a vista Agenda ao tocar no botão Agenda', async () => {
    const { getByText, queryByTestId } = await render(
      <BookingsScreen navigation={{ navigate: jest.fn() }} />
    );
    await fireEvent.press(getByText('Agenda'));
    expect(queryByTestId('week-view-stub')).toBeNull();
  });

  it('troca para a vista Dia ao tocar no botão Dia', async () => {
    const { getByText, getByTestId } = await render(
      <BookingsScreen navigation={{ navigate: jest.fn() }} />
    );
    await fireEvent.press(getByText('Dia'));
    expect(getByTestId('day-view-stub')).toBeTruthy();
  });

  it('troca para a vista Mês ao tocar no botão Mês', async () => {
    const { getByText, getByTestId } = await render(
      <BookingsScreen navigation={{ navigate: jest.fn() }} />
    );
    await fireEvent.press(getByText('Mês'));
    expect(getByTestId('month-view-stub')).toBeTruthy();
  });
});
