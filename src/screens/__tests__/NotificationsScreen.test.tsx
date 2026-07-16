import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NotificationsScreen from '../NotificationsScreen';

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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

const mockFetchTenantNotifications = jest.fn();
const mockUpdateTenantNotifications = jest.fn();
const mockFetchBillingOverview = jest.fn();
jest.mock('../../api/tenant', () => ({
  fetchTenantNotifications: (...args: any[]) => mockFetchTenantNotifications(...args),
  updateTenantNotifications: (...args: any[]) => mockUpdateTenantNotifications(...args),
  fetchBillingOverview: (...args: any[]) => mockFetchBillingOverview(...args),
}));

const mockFetchCreditBalance = jest.fn();
jest.mock('../../api/credits', () => ({
  fetchCreditBalance: (...args: any[]) => mockFetchCreditBalance(...args),
}));

const NOTIFICATIONS = {
  sms_enabled: false,
  whatsapp_enabled: false,
  push_mobile_enabled: true,
  push_web_enabled: false,
};

const ACTIVE_BILLING = { current_subscription: { status: 'active' } };
const TRIALING_BILLING = { current_subscription: { status: 'trialing' } };
const SUFFICIENT_CREDIT = { current_balance: '15.00' };
const INSUFFICIENT_CREDIT = { current_balance: '0.50' };

describe('NotificationsScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockFetchTenantNotifications.mockResolvedValue(NOTIFICATIONS);
    mockFetchBillingOverview.mockResolvedValue(ACTIVE_BILLING);
    mockFetchCreditBalance.mockResolvedValue(SUFFICIENT_CREDIT);
  });
  afterEach(() => jest.clearAllMocks());

  it('loads and shows the current channel states', async () => {
    const { getByText, getByTestId } = await render(<NotificationsScreen />);

    await waitFor(() => expect(getByText('Ativo')).toBeTruthy());
    expect(getByTestId('notifications-sms_enabled-switch').props.value).toBe(false);
    expect(getByTestId('notifications-push_mobile_enabled-switch').props.value).toBe(true);
  });

  it('disables SMS during the trial period with a supporting message', async () => {
    mockFetchBillingOverview.mockResolvedValue(TRIALING_BILLING);

    const { getByTestId, getByText } = await render(<NotificationsScreen />);
    await waitFor(() => expect(getByTestId('notifications-sms_enabled-switch')).toBeTruthy());

    expect(getByTestId('notifications-sms_enabled-switch').props.disabled).toBe(true);
    expect(getByText('Disponível após o período de teste.')).toBeTruthy();
  });

  it('disables SMS when there is not enough credit', async () => {
    mockFetchCreditBalance.mockResolvedValue(INSUFFICIENT_CREDIT);

    const { getByTestId, getByText } = await render(<NotificationsScreen />);
    await waitFor(() => expect(getByTestId('notifications-sms_enabled-switch')).toBeTruthy());

    expect(getByTestId('notifications-sms_enabled-switch').props.disabled).toBe(true);
    expect(getByText('Sem crédito suficiente.')).toBeTruthy();
  });

  it('always disables WhatsApp with a "coming soon" badge', async () => {
    const { getByTestId, getByText } = await render(<NotificationsScreen />);
    await waitFor(() => expect(getByTestId('notifications-whatsapp_enabled-switch')).toBeTruthy());

    expect(getByTestId('notifications-whatsapp_enabled-switch').props.disabled).toBe(true);
    expect(getByText('Em breve')).toBeTruthy();
    expect(getByText('WhatsApp será ativado após aprovação Meta Business.')).toBeTruthy();
  });

  it('toggles push mobile immediately and keeps the new value on success', async () => {
    mockUpdateTenantNotifications.mockResolvedValue({ ...NOTIFICATIONS, push_mobile_enabled: false });

    const { getByTestId } = await render(<NotificationsScreen />);
    await waitFor(() => expect(getByTestId('notifications-push_mobile_enabled-switch')).toBeTruthy());

    await act(async () => {
      getByTestId('notifications-push_mobile_enabled-switch').props.onChange({ nativeEvent: { value: false } });
    });

    await waitFor(() => {
      expect(mockUpdateTenantNotifications).toHaveBeenCalledWith({ push_mobile_enabled: false }, { slug: 'acme' });
    });
    expect(getByTestId('notifications-push_mobile_enabled-switch').props.value).toBe(false);
  });

  it('reverts the toggle and shows the backend error message when the update fails', async () => {
    mockUpdateTenantNotifications.mockRejectedValue({
      response: { status: 400, data: { detail: 'Não foi possível ativar este canal.' } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId } = await render(<NotificationsScreen />);
    await waitFor(() => expect(getByTestId('notifications-push_web_enabled-switch')).toBeTruthy());
    expect(getByTestId('notifications-push_web_enabled-switch').props.value).toBe(false);

    await act(async () => {
      getByTestId('notifications-push_web_enabled-switch').props.onChange({ nativeEvent: { value: true } });
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível ativar este canal.');
    });
    expect(getByTestId('notifications-push_web_enabled-switch').props.value).toBe(false);

    alertSpy.mockRestore();
  });

  it('disables all switches for a collaborator (read-only)', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'collaborator' } };

    const { getByTestId, getByText } = await render(<NotificationsScreen />);
    await waitFor(() => expect(getByText('Ativo')).toBeTruthy());

    expect(getByTestId('notifications-sms_enabled-switch').props.disabled).toBe(true);
    expect(getByTestId('notifications-push_mobile_enabled-switch').props.disabled).toBe(true);
    expect(getByTestId('notifications-push_web_enabled-switch').props.disabled).toBe(true);
  });

  it('stops loading and shows an error when the core notifications fetch fails, instead of spinning forever', async () => {
    mockFetchTenantNotifications.mockRejectedValue({
      response: { status: 500, data: {} },
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, queryByTestId } = await render(<NotificationsScreen />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível carregar as notificações.');
    });
    // já não deve estar preso no spinner: o botão de voltar do header existe,
    // e nenhum switch fica pendurado à espera de dados que nunca chegam.
    expect(getByText('Notificações')).toBeTruthy();
    expect(queryByTestId('notifications-sms_enabled-switch')).toBeNull();

    alertSpy.mockRestore();
  });

  it('still loads the screen and conservatively disables SMS when only the credit balance fetch fails', async () => {
    mockFetchCreditBalance.mockRejectedValue({
      response: { status: 404, data: { detail: 'Não encontrado.' } },
    });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId, getByText } = await render(<NotificationsScreen />);

    await waitFor(() => expect(getByText('Ativo')).toBeTruthy());
    expect(getByTestId('notifications-sms_enabled-switch').props.disabled).toBe(true);
    // Push Mobile não depende de créditos, deve continuar utilizável.
    expect(getByTestId('notifications-push_mobile_enabled-switch').props.disabled).toBe(false);
    expect(alertSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('still loads the screen when only the billing overview fetch fails', async () => {
    mockFetchBillingOverview.mockRejectedValue({
      response: { status: 500, data: {} },
    });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = await render(<NotificationsScreen />);

    await waitFor(() => expect(getByText('Ativo')).toBeTruthy());
    expect(alertSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
