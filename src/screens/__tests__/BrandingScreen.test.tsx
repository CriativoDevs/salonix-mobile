import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BrandingScreen from '../BrandingScreen';

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
const mockUpdateTenantBranding = jest.fn();
jest.mock('../../api/tenant', () => ({
  fetchTenantMeta: (...args: any[]) => mockFetchTenantMeta(...args),
  updateTenantBranding: (...args: any[]) => mockUpdateTenantBranding(...args),
}));

const mockRequestPermissions = jest.fn();
const mockLaunchImageLibrary = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: any[]) => mockRequestPermissions(...args),
  launchImageLibraryAsync: (...args: any[]) => mockLaunchImageLibrary(...args),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockGetInfoAsync = jest.fn();
jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: (...args: any[]) => mockGetInfoAsync(...args),
}));

const TENANT_META = {
  logo_url: 'https://cdn.example.com/logo.png',
  address_street: 'Rua A',
  address_number: '10',
  address_complement: '',
  address_neighborhood: 'Centro',
  address_city: 'Lisboa',
  address_state: 'Lisboa',
  address_zip: '1000-100',
  address_country: 'Portugal',
};

describe('BrandingScreen', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockFetchTenantMeta.mockResolvedValue(TENANT_META);
  });
  afterEach(() => jest.clearAllMocks());

  it('loads and shows the current address fields', async () => {
    const { getByDisplayValue, getAllByDisplayValue } = await render(<BrandingScreen />);

    await waitFor(() => expect(getByDisplayValue('Rua A')).toBeTruthy());
    expect(getAllByDisplayValue('Lisboa').length).toBe(2); // address_city e address_state
    expect(getByDisplayValue('1000-100')).toBeTruthy();
  });

  it('shows a validation error for an invalid postal code and does not save', async () => {
    const { getByTestId, getByText } = await render(<BrandingScreen />);
    await waitFor(() => expect(getByTestId('branding-address-zip-input')).toBeTruthy());

    await fireEvent.changeText(getByTestId('branding-address-zip-input'), '12345');
    await fireEvent.press(getByText('Guardar'));

    expect(getByText('CP inválido. Use 9999-999.')).toBeTruthy();
    expect(mockUpdateTenantBranding).not.toHaveBeenCalled();
  });

  it('rejects a logo file larger than 2MB', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/big.jpg', mimeType: 'image/jpeg', fileName: 'big.jpg' }],
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 3 * 1024 * 1024 });

    const { getByText } = await render(<BrandingScreen />);
    await waitFor(() => expect(getByText('Alterar logo')).toBeTruthy());

    await fireEvent.press(getByText('Alterar logo'));

    await waitFor(() => {
      expect(getByText('O ficheiro deve ter no máximo 2MB.')).toBeTruthy();
    });
  });

  it('rejects an unsupported file type', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/logo.svg', mimeType: 'image/svg+xml', fileName: 'logo.svg' }],
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });

    const { getByText } = await render(<BrandingScreen />);
    await waitFor(() => expect(getByText('Alterar logo')).toBeTruthy());

    await fireEvent.press(getByText('Alterar logo'));

    await waitFor(() => {
      expect(getByText('Formato não suportado. Use JPEG, PNG, GIF ou WEBP.')).toBeTruthy();
    });
  });

  it('submits the picked logo and address fields, then shows a success alert', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/logo.jpg', mimeType: 'image/jpeg', fileName: 'logo.jpg' }],
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
    mockUpdateTenantBranding.mockResolvedValue({ ...TENANT_META, logo_url: 'https://cdn.example.com/new-logo.png' });

    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByTestId } = await render(<BrandingScreen />);
    await waitFor(() => expect(getByText('Alterar logo')).toBeTruthy());

    await fireEvent.press(getByText('Alterar logo'));
    await waitFor(() => expect(mockGetInfoAsync).toHaveBeenCalled());

    await fireEvent.changeText(getByTestId('branding-address-city-input'), 'Porto');
    await fireEvent.press(getByText('Guardar'));

    await waitFor(() => {
      expect(mockUpdateTenantBranding).toHaveBeenCalledWith({
        logoFile: { uri: 'file:///tmp/logo.jpg', name: 'logo.jpg', mimeType: 'image/jpeg' },
        address: {
          address_street: 'Rua A',
          address_number: '10',
          address_complement: '',
          address_neighborhood: 'Centro',
          address_city: 'Porto',
          address_state: 'Lisboa',
          address_zip: '1000-100',
          address_country: 'Portugal',
        },
        slug: 'acme',
      });
    });
    expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Marca atualizada.');

    alertSpy.mockRestore();
  });

  it('shows the backend error detail message when saving fails', async () => {
    mockUpdateTenantBranding.mockRejectedValue({
      response: { status: 403, data: { detail: 'Apenas owner ou manager podem editar a marca.' } },
    });
    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = await render(<BrandingScreen />);
    await waitFor(() => expect(getByText('Guardar')).toBeTruthy());

    await fireEvent.press(getByText('Guardar'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Apenas owner ou manager podem editar a marca.');
    });

    alertSpy.mockRestore();
  });

  it('hides the editable fields and buttons for a collaborator (read-only)', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'collaborator' } };

    const { getByText, queryByText, queryByTestId } = await render(<BrandingScreen />);
    await waitFor(() => expect(getByText('Rua A')).toBeTruthy());

    expect(queryByText('Guardar')).toBeNull();
    expect(queryByText('Alterar logo')).toBeNull();
    expect(queryByTestId('branding-address-city-input')).toBeNull();
  });

  it('stops loading and shows an error when fetching the current branding fails', async () => {
    mockFetchTenantMeta.mockRejectedValue({
      response: { status: 500, data: {} },
    });
    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, queryByTestId } = await render(<BrandingScreen />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível carregar a marca.');
    });
    expect(getByText('Marca')).toBeTruthy();
    expect(queryByTestId('branding-address-city-input')).toBeNull();

    alertSpy.mockRestore();
  });

  it('resolves a relative logo_url (no storage/CDN configured) into an absolute URI for Image', async () => {
    mockFetchTenantMeta.mockResolvedValue({ ...TENANT_META, logo_url: '/media/logos/xyz.png' });

    const { getByTestId } = await render(<BrandingScreen />);

    await waitFor(() => {
      expect(getByTestId('branding-logo-image').props.source.uri).toBe(
        'http://0.0.0.0:8000/media/logos/xyz.png'
      );
    });
  });
});
