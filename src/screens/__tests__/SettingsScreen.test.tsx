import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      background: '#fff',
      surface: '#f8fafc',
      brandPrimary: '#3b82f6',
    },
  }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

let mockUseAuthReturn: any = { userInfo: { email: 'owner@acme.pt', role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { email: 'owner@acme.pt', role: 'owner' } };
  });
  afterEach(() => jest.clearAllMocks());

  it('shows all 6 links for an owner and navigates to the correct routes', async () => {
    const { getByText } = await render(<SettingsScreen />);

    await waitFor(() => expect(getByText('Horário de Funcionamento')).toBeTruthy());
    expect(getByText('Marca')).toBeTruthy();
    expect(getByText('Notificações')).toBeTruthy();
    expect(getByText('Geral')).toBeTruthy();
    expect(getByText('Relatórios')).toBeTruthy();
    expect(getByText('Créditos e Plano')).toBeTruthy();

    await fireEvent.press(getByText('Horário de Funcionamento'));
    expect(mockNavigate).toHaveBeenCalledWith('BusinessHours');

    await fireEvent.press(getByText('Marca'));
    expect(mockNavigate).toHaveBeenCalledWith('Branding');

    await fireEvent.press(getByText('Notificações'));
    expect(mockNavigate).toHaveBeenCalledWith('Notifications');

    await fireEvent.press(getByText('Geral'));
    expect(mockNavigate).toHaveBeenCalledWith('General');

    await fireEvent.press(getByText('Relatórios'));
    expect(mockNavigate).toHaveBeenCalledWith('Reports');

    await fireEvent.press(getByText('Créditos e Plano'));
    expect(mockNavigate).toHaveBeenCalledWith('CreditsPlan');
  });

  it('hides "Relatórios" and "Créditos e Plano" for a manager, keeps the other 4', async () => {
    mockUseAuthReturn = { userInfo: { email: 'manager@acme.pt', role: 'manager' } };

    const { getByText, queryByText } = await render(<SettingsScreen />);

    await waitFor(() => expect(getByText('Horário de Funcionamento')).toBeTruthy());
    expect(getByText('Marca')).toBeTruthy();
    expect(getByText('Notificações')).toBeTruthy();
    expect(getByText('Geral')).toBeTruthy();
    expect(queryByText('Relatórios')).toBeNull();
    expect(queryByText('Créditos e Plano')).toBeNull();
  });

  it('hides "Relatórios" and "Créditos e Plano" for a collaborator', async () => {
    mockUseAuthReturn = { userInfo: { email: 'collab@acme.pt', role: 'collaborator' } };

    const { getByText, queryByText } = await render(<SettingsScreen />);

    await waitFor(() => expect(getByText('Horário de Funcionamento')).toBeTruthy());
    expect(queryByText('Relatórios')).toBeNull();
    expect(queryByText('Créditos e Plano')).toBeNull();
  });
});
