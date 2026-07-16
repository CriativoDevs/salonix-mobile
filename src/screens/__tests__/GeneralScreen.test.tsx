import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GeneralScreen from '../GeneralScreen';

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

const mockFetchTenantMeta = jest.fn();
const mockUpdateTenantContact = jest.fn();
const mockUpdateTenantModules = jest.fn();
const mockUpdateTenantAutoInvite = jest.fn();
jest.mock('../../api/tenant', () => ({
  fetchTenantMeta: (...args: any[]) => mockFetchTenantMeta(...args),
  updateTenantContact: (...args: any[]) => mockUpdateTenantContact(...args),
  updateTenantModules: (...args: any[]) => mockUpdateTenantModules(...args),
  updateTenantAutoInvite: (...args: any[]) => mockUpdateTenantAutoInvite(...args),
}));

const TENANT_META = {
  name: 'Acme Salon',
  slug: 'acme',
  timezone: 'Europe/Lisbon',
  currency: 'eur',
  preferred_language: 'pt',
  auto_invite_enabled: true,
  profile: { email: 'contato@acme.pt', phone: '+351911111111' },
  feature_flags: { pwa_client_enabled: true },
};

describe('GeneralScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockFetchTenantMeta.mockResolvedValue(TENANT_META);
  });
  afterEach(() => jest.clearAllMocks());

  it('loads and shows the read-only summary', async () => {
    const { getByText } = await render(<GeneralScreen />);

    await waitFor(() => expect(getByText('Acme Salon')).toBeTruthy());
    expect(getByText('acme')).toBeTruthy();
    expect(getByText('Europe/Lisbon')).toBeTruthy();
    expect(getByText('EUR')).toBeTruthy();
    expect(getByText('PT')).toBeTruthy();
  });

  it('loads the current email and phone into the editable fields', async () => {
    const { getByDisplayValue } = await render(<GeneralScreen />);

    await waitFor(() => expect(getByDisplayValue('contato@acme.pt')).toBeTruthy());
    expect(getByDisplayValue('+351911111111')).toBeTruthy();
  });

  it('saves the contact form and shows a success alert', async () => {
    mockUpdateTenantContact.mockResolvedValue({ profile: { email: 'novo@acme.pt', phone: '+351922222222' } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByDisplayValue, getByText } = await render(<GeneralScreen />);
    await waitFor(() => expect(getByDisplayValue('contato@acme.pt')).toBeTruthy());

    await fireEvent.changeText(getByDisplayValue('contato@acme.pt'), 'novo@acme.pt');
    await fireEvent.press(getByText('Guardar'));

    await waitFor(() => {
      expect(mockUpdateTenantContact).toHaveBeenCalledWith(
        { email: 'novo@acme.pt', phone: '+351911111111' },
        { slug: 'acme' }
      );
    });
    expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Dados de contato atualizados.');

    alertSpy.mockRestore();
  });

  it('shows the backend error detail when saving the contact form fails', async () => {
    mockUpdateTenantContact.mockRejectedValue({
      response: { status: 400, data: { detail: 'Telefone inválido.' } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByDisplayValue } = await render(<GeneralScreen />);
    await waitFor(() => expect(getByDisplayValue('contato@acme.pt')).toBeTruthy());

    await fireEvent.press(getByText('Guardar'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Telefone inválido.');
    });

    alertSpy.mockRestore();
  });

  it('shows the initial state of the PWA Cliente and Convites automáticos toggles', async () => {
    const { getByTestId } = await render(<GeneralScreen />);

    await waitFor(() => expect(getByTestId('general-pwa-client-switch')).toBeTruthy());
    expect(getByTestId('general-pwa-client-switch').props.value).toBe(true);
    expect(getByTestId('general-auto-invite-switch').props.value).toBe(true);
    expect(getByTestId('general-auto-invite-switch').props.disabled).toBe(false);
  });

  it('disables the Convites automáticos toggle when PWA Cliente is off', async () => {
    mockFetchTenantMeta.mockResolvedValue({
      ...TENANT_META,
      auto_invite_enabled: false,
      feature_flags: { pwa_client_enabled: false },
    });

    const { getByTestId, getByText } = await render(<GeneralScreen />);

    await waitFor(() => expect(getByTestId('general-auto-invite-switch')).toBeTruthy());
    expect(getByTestId('general-auto-invite-switch').props.disabled).toBe(true);
    expect(getByText('Ative o PWA Cliente primeiro.')).toBeTruthy();
  });

  it('toggles PWA Cliente immediately and calls updateTenantModules', async () => {
    mockUpdateTenantModules.mockResolvedValue({ pwa_client_enabled: false });

    const { getByTestId } = await render(<GeneralScreen />);
    await waitFor(() => expect(getByTestId('general-pwa-client-switch')).toBeTruthy());

    await fireEvent(getByTestId('general-pwa-client-switch'), 'onValueChange', false);

    await waitFor(() => {
      expect(mockUpdateTenantModules).toHaveBeenCalledWith({ pwaClientEnabled: false }, { slug: 'acme' });
    });
    expect(getByTestId('general-pwa-client-switch').props.value).toBe(false);
  });

  it('reverts the PWA Cliente toggle and shows an alert when the update fails', async () => {
    mockUpdateTenantModules.mockRejectedValue({
      response: { status: 400, data: { detail: 'PWA Cliente disponível a partir do plano Basic.' } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId } = await render(<GeneralScreen />);
    await waitFor(() => expect(getByTestId('general-pwa-client-switch')).toBeTruthy());

    await fireEvent(getByTestId('general-pwa-client-switch'), 'onValueChange', false);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'PWA Cliente disponível a partir do plano Basic.');
    });
    expect(getByTestId('general-pwa-client-switch').props.value).toBe(true);

    alertSpy.mockRestore();
  });

  it('toggles Convites automáticos immediately and calls updateTenantAutoInvite', async () => {
    mockUpdateTenantAutoInvite.mockResolvedValue({ auto_invite_enabled: false });

    const { getByTestId } = await render(<GeneralScreen />);
    await waitFor(() => expect(getByTestId('general-auto-invite-switch')).toBeTruthy());

    await fireEvent(getByTestId('general-auto-invite-switch'), 'onValueChange', false);

    await waitFor(() => {
      expect(mockUpdateTenantAutoInvite).toHaveBeenCalledWith(false, { slug: 'acme' });
    });
    expect(getByTestId('general-auto-invite-switch').props.value).toBe(false);
  });

  it('reverts the Convites automáticos toggle and shows an alert when the update fails', async () => {
    mockUpdateTenantAutoInvite.mockRejectedValue({
      response: { status: 400, data: { detail: 'Não foi possível atualizar.' } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId } = await render(<GeneralScreen />);
    await waitFor(() => expect(getByTestId('general-auto-invite-switch')).toBeTruthy());

    await fireEvent(getByTestId('general-auto-invite-switch'), 'onValueChange', false);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível atualizar.');
    });
    expect(getByTestId('general-auto-invite-switch').props.value).toBe(true);

    alertSpy.mockRestore();
  });

  it('shows read-only text instead of inputs/switches for a collaborator', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'collaborator' } };

    const { getByText, queryByDisplayValue, queryByTestId, queryByText } = await render(<GeneralScreen />);
    await waitFor(() => expect(getByText('Acme Salon')).toBeTruthy());

    expect(queryByDisplayValue('contato@acme.pt')).toBeNull();
    expect(getByText('contato@acme.pt')).toBeTruthy();
    expect(queryByTestId('general-pwa-client-switch')).toBeNull();
    expect(queryByText('Guardar')).toBeNull();
  });

  it('stops loading and shows an error when fetching tenant meta fails', async () => {
    mockFetchTenantMeta.mockRejectedValue({ response: { status: 500, data: {} } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, queryByTestId } = await render(<GeneralScreen />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível carregar as definições gerais.');
    });
    expect(getByText('Geral')).toBeTruthy();
    expect(queryByTestId('general-pwa-client-switch')).toBeNull();

    alertSpy.mockRestore();
  });
});
