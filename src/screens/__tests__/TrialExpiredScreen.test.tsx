import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import TrialExpiredScreen from '../TrialExpiredScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      background: '#fff',
      brandPrimary: '#3b82f6',
      surfaceVariant: '#eee',
      border: '#ccc',
    },
  }),
}));

let mockTenant: any = { plan_tier: 'basic' };
const mockRefetch = jest.fn();
jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme', tenant: mockTenant, refetch: mockRefetch }),
}));

let mockUserInfo: any = { id: 1, role: 'owner' };
const mockLogout = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ userInfo: mockUserInfo, logout: mockLogout }),
}));

const mockCreateCheckoutSession = jest.fn();
jest.mock('../../api/tenant', () => ({
  createCheckoutSession: (...args: any[]) => mockCreateCheckoutSession(...args),
}));

const mockOpenBrowserAsync = jest.fn();
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...args: any[]) => mockOpenBrowserAsync(...args),
}));

describe('TrialExpiredScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTenant = { plan_tier: 'basic' };
    mockUserInfo = { id: 1, role: 'owner' };
    mockCreateCheckoutSession.mockResolvedValue({
      checkout_url: 'https://checkout.stripe.com/pay/cs_test_123',
    });
  });

  it('owner: abre o checkout ao tocar em "Assinar agora"', async () => {
    const { getByText } = await render(<TrialExpiredScreen />);

    fireEvent.press(getByText('Assinar agora'));

    await waitFor(() => {
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        { plan: 'basic', interval: 'monthly' },
        { slug: 'acme' }
      );
      expect(mockOpenBrowserAsync).toHaveBeenCalledWith(
        'https://checkout.stripe.com/pay/cs_test_123'
      );
    });
  });

  it('owner: "Já paguei, atualizar" chama refetch do tenant', async () => {
    const { getByText } = await render(<TrialExpiredScreen />);

    fireEvent.press(getByText('Já paguei, atualizar'));

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('mostra erro amigável quando o checkout falha', async () => {
    mockCreateCheckoutSession.mockRejectedValue(new Error('network error'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = await render(<TrialExpiredScreen />);
    fireEvent.press(getByText('Assinar agora'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro',
        'Não foi possível iniciar o pagamento. Tente novamente.'
      );
    });

    alertSpy.mockRestore();
  });

  it('não-owner: não vê botão de assinar, só a mensagem e sair', async () => {
    mockUserInfo = { id: 2, role: 'manager' };
    const { getByText, queryByText } = await render(<TrialExpiredScreen />);

    expect(queryByText('Assinar agora')).toBeNull();
    expect(queryByText('Já paguei, atualizar')).toBeNull();
    expect(getByText('Sair')).toBeTruthy();
  });

  it('botão Sair chama logout, sem prender o usuário na tela', async () => {
    const { getByText } = await render(<TrialExpiredScreen />);

    fireEvent.press(getByText('Sair'));

    expect(mockLogout).toHaveBeenCalled();
  });
});
