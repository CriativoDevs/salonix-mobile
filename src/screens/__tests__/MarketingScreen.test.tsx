import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import MarketingScreen from '../MarketingScreen';

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
      successBackground: '#d1fae5',
      error: '#ef4444',
      errorBackground: '#fee2e2',
      warning: '#f59e0b',
      warningBackground: '#fef3c7',
      info: '#3b82f6',
      infoBackground: '#dbeafe',
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

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt' }),
}));

const mockShowToast = jest.fn();
jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockFetchMarketingCampaigns = jest.fn();
const mockCreateMarketingCampaign = jest.fn();
jest.mock('../../api/marketing', () => ({
  fetchMarketingCampaigns: (...args: any[]) => mockFetchMarketingCampaigns(...args),
  createMarketingCampaign: (...args: any[]) => mockCreateMarketingCampaign(...args),
}));

const EXISTING_CAMPAIGN = {
  id: 1,
  subject: 'Campanha antiga',
  body: 'Corpo antigo',
  reply_to: 'contato@acme.pt',
  status: 'completed',
  eligible_count: 40,
  skipped_no_consent_count: 5,
  free_sent_count: 35,
  credit_sent_count: 0,
  credit_charged_eur: '0.00',
  blocked_credit_count: 0,
  total_sent_count: 35,
  created_by_username: 'ana',
  created_at: '2026-06-01T10:00:00Z',
  completed_at: '2026-06-01T10:05:00Z',
};

const CREATED_CAMPAIGN = {
  id: 2,
  subject: 'Novidades de setembro',
  body: 'Confira as novidades!',
  reply_to: null,
  status: 'completed',
  eligible_count: 60,
  skipped_no_consent_count: 10,
  free_sent_count: 50,
  credit_sent_count: 5,
  credit_charged_eur: '2.50',
  blocked_credit_count: 0,
  total_sent_count: 55,
  created_by_username: 'ana',
  created_at: '2026-09-09T10:00:00Z',
  completed_at: '2026-09-09T10:01:00Z',
};

describe('MarketingScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockGoBack.mockClear();
    mockShowToast.mockClear();
    mockFetchMarketingCampaigns.mockReset();
    mockCreateMarketingCampaign.mockReset();
    mockFetchMarketingCampaigns.mockResolvedValue([EXISTING_CAMPAIGN]);
  });
  afterEach(() => jest.clearAllMocks());

  it('redirects back immediately when the user is not owner/manager', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'collaborator' } };

    render(<MarketingScreen />);

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
    expect(mockFetchMarketingCampaigns).not.toHaveBeenCalled();
  });

  it('does not redirect for a manager and loads the campaign history', async () => {
    mockUseAuthReturn = { userInfo: { id: 3, role: 'manager' } };

    const { getByText } = await render(<MarketingScreen />);

    await waitFor(() => expect(mockFetchMarketingCampaigns).toHaveBeenCalledWith({ slug: 'acme' }));
    expect(mockGoBack).not.toHaveBeenCalled();
    await waitFor(() => expect(getByText('Campanha antiga')).toBeTruthy());
  });

  it('shows validation errors and does not open the confirm modal when the form is empty', async () => {
    const { getByText, queryByText } = await render(<MarketingScreen />);
    await waitFor(() => expect(mockFetchMarketingCampaigns).toHaveBeenCalled());

    await fireEvent.press(getByText('Rever e enviar campanha'));

    expect(getByText('Escreva o assunto do email.')).toBeTruthy();
    expect(getByText('Escreva o conteúdo do email.')).toBeTruthy();
    expect(queryByText('Confirmar envio da campanha')).toBeNull();
    expect(mockCreateMarketingCampaign).not.toHaveBeenCalled();
  });

  it('composes, confirms and sends a campaign, then shows the result breakdown (happy path)', async () => {
    mockCreateMarketingCampaign.mockResolvedValue(CREATED_CAMPAIGN);

    const { getByText, getByTestId } = await render(<MarketingScreen />);
    await waitFor(() => expect(mockFetchMarketingCampaigns).toHaveBeenCalled());

    await act(async () => {
      fireEvent.changeText(getByTestId('marketing-subject-input'), 'Novidades de setembro');
      fireEvent.changeText(getByTestId('marketing-body-input'), 'Confira as novidades!');
    });

    await fireEvent.press(getByText('Rever e enviar campanha'));

    expect(getByText('Confirmar envio da campanha')).toBeTruthy();
    // O assunto aparece dentro do modal de confirmação (texto composto "Assunto: <valor>")
    expect(getByText(/Assunto:\s*Novidades de setembro/)).toBeTruthy();

    await fireEvent.press(getByText('Sim, enviar campanha'));

    await waitFor(() => {
      expect(mockCreateMarketingCampaign).toHaveBeenCalledWith(
        { subject: 'Novidades de setembro', body: 'Confira as novidades!', reply_to: null },
        { slug: 'acme' }
      );
    });

    await waitFor(() => expect(getByText('Resultado do envio')).toBeTruthy());
    expect(getByText('50')).toBeTruthy(); // free_sent_count
    expect(getByText('5')).toBeTruthy(); // credit_sent_count
    expect(getByText('2,50 €')).toBeTruthy(); // credit_charged_eur formatted
    expect(mockShowToast).toHaveBeenCalledWith({ type: 'success', message: 'Campanha enviada com sucesso.' });

    // Fecha o resultado e confirma que a campanha aparece no topo do histórico
    await fireEvent.press(getByText('Fechar'));
    await waitFor(() => expect(getByText('Novidades de setembro')).toBeTruthy());
  });

  it('shows an inline error and a toast when the API call fails', async () => {
    mockCreateMarketingCampaign.mockRejectedValue({
      response: { status: 403, data: { detail: 'Apenas owner/manager podem enviar campanhas.' } },
    });

    const { getByText, getByTestId } = await render(<MarketingScreen />);
    await waitFor(() => expect(mockFetchMarketingCampaigns).toHaveBeenCalled());

    await act(async () => {
      fireEvent.changeText(getByTestId('marketing-subject-input'), 'Assunto');
      fireEvent.changeText(getByTestId('marketing-body-input'), 'Corpo do email');
    });

    await fireEvent.press(getByText('Rever e enviar campanha'));
    await fireEvent.press(getByText('Sim, enviar campanha'));

    await waitFor(() => {
      expect(getByText('Apenas owner/manager podem enviar campanhas.')).toBeTruthy();
    });
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'Apenas owner/manager podem enviar campanhas.',
    });
  });

  it('renders the campaign history with an expandable breakdown', async () => {
    const { getByText, queryByText } = await render(<MarketingScreen />);

    await waitFor(() => expect(getByText('Campanha antiga')).toBeTruthy());
    expect(queryByText('Clientes elegíveis')).toBeNull();

    await fireEvent.press(getByText('Campanha antiga'));

    await waitFor(() => expect(getByText('Clientes elegíveis')).toBeTruthy());
    expect(getByText('40')).toBeTruthy();
  });

  it('shows an empty state when there is no campaign history', async () => {
    mockFetchMarketingCampaigns.mockResolvedValue([]);

    const { getByText } = await render(<MarketingScreen />);

    await waitFor(() => expect(getByText('Nenhuma campanha enviada')).toBeTruthy());
  });
});
