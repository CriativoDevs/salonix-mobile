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
    mockNavigate.mockClear();
  });
  afterEach(() => jest.clearAllMocks());

  it('shows every link for an owner, grouped by section, and navigates to the correct routes', async () => {
    const { getByText, queryByText } = await render(<SettingsScreen />);

    // Definições
    await waitFor(() => expect(getByText('Geral')).toBeTruthy());
    expect(getByText('Notificações')).toBeTruthy();
    expect(getByText('Créditos e Plano')).toBeTruthy();

    // Perfil
    expect(getByText('Marca')).toBeTruthy();
    expect(getByText('Marketing por email')).toBeTruthy();

    // App
    expect(getByText('Feedback')).toBeTruthy();
    expect(getByText('Como funciona')).toBeTruthy();
    expect(getByText('Roadmap')).toBeTruthy();

    // Funcionamento
    expect(getByText('Horário de Funcionamento')).toBeTruthy();
    expect(getByText('Serviços')).toBeTruthy();
    expect(getByText('Horários')).toBeTruthy();

    // "Relatórios" saiu de Definições (agora vive na tab bar)
    expect(queryByText('Relatórios')).toBeNull();

    await fireEvent.press(getByText('Geral'));
    expect(mockNavigate).toHaveBeenCalledWith('General');

    await fireEvent.press(getByText('Notificações'));
    expect(mockNavigate).toHaveBeenCalledWith('Notifications');

    await fireEvent.press(getByText('Créditos e Plano'));
    expect(mockNavigate).toHaveBeenCalledWith('CreditsPlan');

    await fireEvent.press(getByText('Marca'));
    expect(mockNavigate).toHaveBeenCalledWith('Branding');

    await fireEvent.press(getByText('Marketing por email'));
    expect(mockNavigate).toHaveBeenCalledWith('Marketing');

    await fireEvent.press(getByText('Feedback'));
    expect(mockNavigate).toHaveBeenCalledWith('Feedback');

    await fireEvent.press(getByText('Como funciona'));
    expect(mockNavigate).toHaveBeenCalledWith('HowItWorks');

    await fireEvent.press(getByText('Roadmap'));
    expect(mockNavigate).toHaveBeenCalledWith('Roadmap');

    await fireEvent.press(getByText('Horário de Funcionamento'));
    expect(mockNavigate).toHaveBeenCalledWith('BusinessHours');

    await fireEvent.press(getByText('Serviços'));
    expect(mockNavigate).toHaveBeenCalledWith('Services');

    await fireEvent.press(getByText('Horários'));
    expect(mockNavigate).toHaveBeenCalledWith('Slots');
  });

  it('hides "Créditos e Plano" and "Marketing por email" for a manager, keeps the other links', async () => {
    mockUseAuthReturn = { userInfo: { email: 'manager@acme.pt', role: 'manager' } };

    const { getByText, queryByText } = await render(<SettingsScreen />);

    await waitFor(() => expect(getByText('Geral')).toBeTruthy());
    expect(getByText('Marca')).toBeTruthy();
    // Manager conta como admin (owner/manager) — mantém acesso ao Marketing.
    expect(getByText('Marketing por email')).toBeTruthy();
    expect(queryByText('Créditos e Plano')).toBeNull();
  });

  it('hides "Créditos e Plano" and "Marketing por email" for a collaborator', async () => {
    mockUseAuthReturn = { userInfo: { email: 'collab@acme.pt', role: 'collaborator' } };

    const { getByText, queryByText } = await render(<SettingsScreen />);

    await waitFor(() => expect(getByText('Geral')).toBeTruthy());
    expect(queryByText('Créditos e Plano')).toBeNull();
    expect(queryByText('Marketing por email')).toBeNull();
    // Links sem restrição continuam visíveis
    expect(getByText('Feedback')).toBeTruthy();
    expect(getByText('Serviços')).toBeTruthy();
  });
});
