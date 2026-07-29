import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreditsPlanScreen from '../CreditsPlanScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      textTertiary: '#999',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
      success: '#22c55e',
      error: '#ef4444',
    },
  }),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

const mockFetchBillingOverview = jest.fn();
const mockUpdateAutoRenewal = jest.fn();
const mockCreateCheckoutSession = jest.fn();
const mockCreateBillingPortalSession = jest.fn();
jest.mock('../../api/tenant', () => ({
  fetchBillingOverview: (...args: any[]) => mockFetchBillingOverview(...args),
  updateAutoRenewal: (...args: any[]) => mockUpdateAutoRenewal(...args),
  createCheckoutSession: (...args: any[]) => mockCreateCheckoutSession(...args),
  createBillingPortalSession: (...args: any[]) => mockCreateBillingPortalSession(...args),
}));

const mockFetchCreditBalance = jest.fn();
const mockFetchCreditHistory = jest.fn();
const mockFetchCreditPackages = jest.fn();
const mockCreateCreditCheckoutSession = jest.fn();
jest.mock('../../api/credits', () => ({
  fetchCreditBalance: (...args: any[]) => mockFetchCreditBalance(...args),
  fetchCreditHistory: (...args: any[]) => mockFetchCreditHistory(...args),
  fetchCreditPackages: (...args: any[]) => mockFetchCreditPackages(...args),
  createCreditCheckoutSession: (...args: any[]) => mockCreateCreditCheckoutSession(...args),
}));

const mockOpenBrowserAsync = jest.fn();
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...args: any[]) => mockOpenBrowserAsync(...args),
}));

const OVERVIEW = {
  current_subscription: {
    plan_code: 'basic',
    plan_name: 'Basic',
    status: 'active',
    status_label: 'Ativa',
    current_period_end: '2026-08-09T00:00:00Z',
    cancel_at_period_end: false,
    next_billing_date: '2026-08-09T00:00:00Z',
    price_monthly: 29.9,
    interval: 'month',
  },
  available_plans: [
    { plan_code: 'basic', name: 'Basic', price_monthly: 29.9, features: ['Feature A'], credits_included: 10, is_current: true, can_upgrade: false, is_available: true },
    { plan_code: 'founder', name: 'Founder', price_monthly: 59.9, features: ['Feature A', 'Feature B'], credits_included: 25, is_current: false, can_upgrade: true, is_available: true },
  ],
  credit_balance: 15,
  can_purchase_credits: true,
  has_auto_renewal: true,
  next_billing_amount: 29.9,
  trial_eligible: false,
  trial_days: 0,
  trial_exhausted: true,
};

const BALANCE = {
  current_balance: '15.00',
  total_purchased: '30.00',
  total_consumed: '15.00',
  total_bonus: '0.00',
  can_purchase_extra: true,
  has_auto_renewal: true,
};

const HISTORY = {
  count: 1,
  next: null,
  previous: null,
  results: [
    { id: 1, transaction_type: 'purchase', amount_eur: '10.00', balance_before: '5.00', balance_after: '15.00', status: 'completed', description: 'Compra de créditos', reference_id: 'pi_1', expires_at: null, created_by_username: null, created_at: '2026-07-01T10:00:00Z' },
  ],
};

const PACKAGES = {
  packages: [
    { credits: '5.00', price_eur: '5.00', price_id: 'price_5', description: 'Créditos de 5 EUR' },
    { credits: '10.00', price_eur: '10.00', price_id: 'price_10', description: 'Créditos de 10 EUR' },
  ],
};

describe('CreditsPlanScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockGoBack.mockClear();
    mockFetchBillingOverview.mockResolvedValue(OVERVIEW);
    mockFetchCreditBalance.mockResolvedValue(BALANCE);
    mockFetchCreditHistory.mockResolvedValue(HISTORY);
    mockFetchCreditPackages.mockResolvedValue(PACKAGES);
  });
  afterEach(() => jest.clearAllMocks());

  it('redirects back immediately when the user is not an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' } };

    await render(<CreditsPlanScreen />);

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
  });

  it('does not redirect when the user is an owner', async () => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };

    await render(<CreditsPlanScreen />);

    await waitFor(() => expect(mockFetchBillingOverview).toHaveBeenCalled());
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('loads and shows the current plan and credit balance', async () => {
    const { getByText } = await render(<CreditsPlanScreen />);

    await waitFor(() => expect(getByText('Basic')).toBeTruthy());
    expect(getByText('Ativa')).toBeTruthy();
    expect(getByText('15.00')).toBeTruthy();
  });

  it('shows the available plans, disabling the current one', async () => {
    const { getByText, getAllByText } = await render(<CreditsPlanScreen />);

    await waitFor(() => expect(getByText('Founder')).toBeTruthy());
    const buttons = getAllByText('Mudar para este plano');
    expect(buttons.length).toBe(2);
  });

  it('shows only the current plan when the backend returns a single available plan', async () => {
    mockFetchBillingOverview.mockResolvedValue({
      ...OVERVIEW,
      current_subscription: {
        ...OVERVIEW.current_subscription,
        plan_name: 'TimelyOne Founder',
      },
      available_plans: [
        {
          plan_code: 'founder',
          name: 'TimelyOne Founder',
          price_monthly: 15,
          features: ['Preço Vitalício'],
          credits_included: 2,
          is_current: true,
          can_upgrade: false,
          is_available: true,
        },
      ],
    });

    const { getByText, queryByText } = await render(<CreditsPlanScreen />);

    await waitFor(() => expect(getByText('TimelyOne Founder (Atual)')).toBeTruthy());
    expect(queryByText('Founder')).toBeNull();
  });

  it('shows the explanatory text about communication credit next to the toggle', async () => {
    const { getByText } = await render(<CreditsPlanScreen />);

    await waitFor(() =>
      expect(
        getByText(
          'Quando o crédito de comunicação incluído no seu plano acabar antes do fim do mês, compre automaticamente mais crédito (cobrado no seu cartão) para não interromper os envios de SMS/WhatsApp.'
        )
      ).toBeTruthy()
    );
  });

  it('toggles renovação automática off and calls updateAutoRenewal with autoRenewal: false', async () => {
    mockUpdateAutoRenewal.mockResolvedValue({ has_auto_renewal: false });

    const { getByTestId } = await render(<CreditsPlanScreen />);
    await waitFor(() => expect(getByTestId('auto-renewal-switch')).toBeTruthy());

    await fireEvent(getByTestId('auto-renewal-switch'), 'onValueChange', false);

    await waitFor(() => {
      expect(mockUpdateAutoRenewal).toHaveBeenCalledWith(
        { autoRenewal: false, autoRenewalPriceId: undefined },
        { slug: 'acme' }
      );
    });
    expect(getByTestId('auto-renewal-switch').props.value).toBe(false);
  });

  it('shows the package picker after disabling, and toggling back on sends the selected price_id', async () => {
    mockUpdateAutoRenewal.mockResolvedValue({ has_auto_renewal: false });

    const { getByTestId, getByText, getAllByText } = await render(<CreditsPlanScreen />);
    await waitFor(() => expect(getByTestId('auto-renewal-switch')).toBeTruthy());

    await fireEvent(getByTestId('auto-renewal-switch'), 'onValueChange', false);
    await waitFor(() => expect(getByText('Pacote a comprar automaticamente')).toBeTruthy());

    // O botão "Créditos de 10 EUR" também existe na secção "Comprar créditos";
    // o seletor de renovação automática aparece primeiro no ecrã.
    const packageButtons = getAllByText('Créditos de 10 EUR');
    await fireEvent.press(packageButtons[0]);

    mockUpdateAutoRenewal.mockResolvedValue({ has_auto_renewal: true });
    await fireEvent(getByTestId('auto-renewal-switch'), 'onValueChange', true);

    await waitFor(() => {
      expect(mockUpdateAutoRenewal).toHaveBeenCalledWith(
        { autoRenewal: true, autoRenewalPriceId: 'price_10' },
        { slug: 'acme' }
      );
    });
  });

  it('reverts the toggle and shows an alert when updateAutoRenewal fails', async () => {
    mockUpdateAutoRenewal.mockRejectedValue({ response: { status: 400, data: { detail: 'Erro ao atualizar.' } } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId } = await render(<CreditsPlanScreen />);
    await waitFor(() => expect(getByTestId('auto-renewal-switch')).toBeTruthy());

    await fireEvent(getByTestId('auto-renewal-switch'), 'onValueChange', false);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Erro ao atualizar.');
    });
    expect(getByTestId('auto-renewal-switch').props.value).toBe(true);

    alertSpy.mockRestore();
  });

  it('changes plan: calls createCheckoutSession and opens the checkout_url', async () => {
    mockCreateCheckoutSession.mockResolvedValue({ checkout_url: 'https://checkout.stripe.com/x', session_id: 'cs_1' });

    const { getByText, getAllByText } = await render(<CreditsPlanScreen />);
    await waitFor(() => expect(getByText('Founder')).toBeTruthy());

    const buttons = getAllByText('Mudar para este plano');
    await fireEvent.press(buttons[1]);

    await waitFor(() => {
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({ plan: 'founder', interval: 'monthly' }, { slug: 'acme' });
    });
    expect(mockOpenBrowserAsync).toHaveBeenCalledWith('https://checkout.stripe.com/x');
  });

  it('manages subscription: calls createBillingPortalSession and opens the portal_url', async () => {
    mockCreateBillingPortalSession.mockResolvedValue({ portal_url: 'https://billing.stripe.com/x' });

    const { getByText } = await render(<CreditsPlanScreen />);
    await waitFor(() => expect(getByText('Gerir subscrição')).toBeTruthy());

    await fireEvent.press(getByText('Gerir subscrição'));

    await waitFor(() => {
      expect(mockCreateBillingPortalSession).toHaveBeenCalledWith({ slug: 'acme' });
    });
    expect(mockOpenBrowserAsync).toHaveBeenCalledWith('https://billing.stripe.com/x');
  });

  it('shows the credit history', async () => {
    const { getByText } = await render(<CreditsPlanScreen />);

    await waitFor(() => expect(getByText('Compra de créditos')).toBeTruthy());
  });

  it('shows an isolated error for the Créditos section when fetchCreditBalance/fetchCreditHistory fail, without affecting Plano', async () => {
    mockFetchCreditBalance.mockRejectedValue({ response: { status: 500, data: {} } });
    mockFetchCreditHistory.mockRejectedValue({ response: { status: 500, data: {} } });

    const { getByText, queryByText } = await render(<CreditsPlanScreen />);

    await waitFor(() => expect(getByText('Basic')).toBeTruthy());
    expect(getByText('Não foi possível carregar os créditos.')).toBeTruthy();
    expect(queryByText('Compra de créditos')).toBeNull();
  });

  it('buys credits: shows packages and opens the checkout_url on purchase', async () => {
    mockCreateCreditCheckoutSession.mockResolvedValue({ checkout_url: 'https://checkout.stripe.com/y', session_id: 'cs_2' });

    const { getByText } = await render(<CreditsPlanScreen />);
    await waitFor(() => expect(getByText('Créditos de 5 EUR')).toBeTruthy());

    await fireEvent.press(getByText('Créditos de 5 EUR'));

    await waitFor(() => {
      expect(mockCreateCreditCheckoutSession).toHaveBeenCalledWith({ amount_eur: '5.00' }, { slug: 'acme' });
    });
    expect(mockOpenBrowserAsync).toHaveBeenCalledWith('https://checkout.stripe.com/y');
  });

  it('stops loading and shows an error when fetching the billing overview fails', async () => {
    mockFetchBillingOverview.mockRejectedValue({ response: { status: 500, data: {} } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, queryByTestId } = await render(<CreditsPlanScreen />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível carregar os dados de faturação.');
    });
    expect(getByText('Créditos e Plano')).toBeTruthy();
    expect(queryByTestId('auto-renewal-switch')).toBeNull();

    alertSpy.mockRestore();
  });
});
