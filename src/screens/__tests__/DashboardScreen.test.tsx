import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
    },
    toggleTheme: jest.fn(),
    theme: 'light',
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ tenant: { name: 'Acme Salon' }, slug: 'acme' }),
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt', setLanguage: jest.fn() }),
}));

const mockRefetch = jest.fn(() => Promise.resolve());
jest.mock('../../hooks/useDashboardData', () => ({
  __esModule: true,
  default: () => ({
    data: {
      stats: { bookings: 5, bookingsCompleted: 3, credits: '10,00', clients: 20 },
      upcoming: [],
    },
    loading: false,
    refetch: mockRefetch,
  }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' }, logout: jest.fn() };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

jest.mock('../../components/HeaderMenu', () => ({
  HeaderMenu: () => null,
}));

jest.mock('../../components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

describe('DashboardScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' }, logout: jest.fn() };
  });

  it('shows the Créditos card for an owner', async () => {
    const { getByText } = await render(<DashboardScreen navigation={{}} />);

    await waitFor(() => expect(getByText('Créditos')).toBeTruthy());
  });

  it('hides the Créditos card for a manager', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' }, logout: jest.fn() };

    const { queryByText, getByText } = await render(<DashboardScreen navigation={{}} />);

    await waitFor(() => expect(getByText('Agendamentos (hoje)')).toBeTruthy());
    expect(queryByText('Créditos')).toBeNull();
  });

  it('hides the Créditos card for a collaborator', async () => {
    mockUseAuthReturn = { userInfo: { id: 3, role: 'collaborator' }, logout: jest.fn() };

    const { queryByText, getByText } = await render(<DashboardScreen navigation={{}} />);

    await waitFor(() => expect(getByText('Agendamentos (hoje)')).toBeTruthy());
    expect(queryByText('Créditos')).toBeNull();
  });
});
