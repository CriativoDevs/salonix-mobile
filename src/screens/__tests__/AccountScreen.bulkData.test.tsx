import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AccountScreen from '../AccountScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      textTertiary: '#999',
      border: '#ccc',
      background: '#fff',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
      error: '#ef4444',
      errorBackground: '#fee',
      brandPrimary: '#3b82f6',
    },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

let mockUseAuthReturn: any = { userInfo: { email: 'owner@acme.pt', full_name: 'Owner', role: 'owner' }, logout: jest.fn() };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ tenant: {}, plan: null, slug: 'acme' }),
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt' }),
}));

jest.mock('../../api/tenant', () => ({
  cancelTenantAccount: jest.fn(),
  fetchBillingOverview: jest.fn().mockResolvedValue({ current_subscription: { plan_name: 'Basic' } }),
}));

const mockExportCustomersCSV = jest.fn();
jest.mock('../../api/customers', () => ({
  exportCustomersCSV: (...args: any[]) => mockExportCustomersCSV(...args),
}));

const mockExportAppointmentsCSV = jest.fn();
jest.mock('../../api/bookings', () => ({
  exportAppointmentsCSV: (...args: any[]) => mockExportAppointmentsCSV(...args),
}));

const mockExportServicesCSV = jest.fn();
jest.mock('../../api/services', () => ({
  exportServicesCSV: (...args: any[]) => mockExportServicesCSV(...args),
}));

const mockExportStaffCSV = jest.fn();
jest.mock('../../api/staff', () => ({
  exportStaffCSV: (...args: any[]) => mockExportStaffCSV(...args),
}));

const mockSaveAndShareZip = jest.fn();
jest.mock('../../utils/zipFileSharing', () => ({
  saveAndShareZip: (...args: any[]) => mockSaveAndShareZip(...args),
}));

jest.mock('../../components/BulkImportExportModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    BulkImportExportModal: ({ visible }: any) => {
      if (!visible) return null;
      return (
        <Pressable>
          <Text>bulk-import-modal-stub</Text>
        </Pressable>
      );
    },
  };
});

describe('AccountScreen - bulk data (Dados)', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { email: 'owner@acme.pt', full_name: 'Owner', role: 'owner' }, logout: jest.fn() };
  });
  afterEach(() => jest.clearAllMocks());

  it('exports all 4 entities, aggregates them into a ZIP and shares it when "Exportar Tudo (ZIP)" is chosen', async () => {
    mockExportCustomersCSV.mockResolvedValue('name,email\nAna,ana@x.com\n');
    mockExportAppointmentsCSV.mockResolvedValue('customer_email,service_name\nana@x.com,Corte\n');
    mockExportServicesCSV.mockResolvedValue('name,price_eur\nCorte,20\n');
    mockExportStaffCSV.mockResolvedValue('email,role\njoao@x.com,collaborator\n');

    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const exportButton = buttons?.find((b: any) => b.text === 'Exportar Tudo (ZIP)');
      exportButton?.onPress?.();
    });

    const { getByText } = await render(<AccountScreen />);
    await waitFor(() => expect(getByText('Importar/Exportar Tudo')).toBeTruthy());
    await fireEvent.press(getByText('Importar/Exportar Tudo'));

    await waitFor(() => {
      expect(mockExportCustomersCSV).toHaveBeenCalledWith({ slug: 'acme' });
    });
    expect(mockExportAppointmentsCSV).toHaveBeenCalledWith({ slug: 'acme' });
    expect(mockExportServicesCSV).toHaveBeenCalledWith({ slug: 'acme' });
    expect(mockExportStaffCSV).toHaveBeenCalledWith({ slug: 'acme' });

    await waitFor(() => {
      expect(mockSaveAndShareZip).toHaveBeenCalledWith(expect.any(String), 'dados.zip');
    });
  });

  it('opens the bulk import modal when "Importar Tudo (ZIP)" is chosen', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const importButton = buttons?.find((b: any) => b.text === 'Importar Tudo (ZIP)');
      importButton?.onPress?.();
    });

    const { getByText } = await render(<AccountScreen />);
    await waitFor(() => expect(getByText('Importar/Exportar Tudo')).toBeTruthy());
    await fireEvent.press(getByText('Importar/Exportar Tudo'));

    await waitFor(() => {
      expect(getByText('bulk-import-modal-stub')).toBeTruthy();
    });
  });

  it('shows an error and does not share anything when one export call fails', async () => {
    mockExportCustomersCSV.mockResolvedValue('name,email\n');
    mockExportAppointmentsCSV.mockRejectedValue(new Error('network error'));
    mockExportServicesCSV.mockResolvedValue('name,price_eur\n');
    mockExportStaffCSV.mockResolvedValue('email,role\n');

    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const exportButton = buttons?.find((b: any) => b.text === 'Exportar Tudo (ZIP)');
      exportButton?.onPress?.();
    });

    const { getByText } = await render(<AccountScreen />);
    await waitFor(() => expect(getByText('Importar/Exportar Tudo')).toBeTruthy());
    await fireEvent.press(getByText('Importar/Exportar Tudo'));

    await waitFor(() => {
      expect(mockExportCustomersCSV).toHaveBeenCalled();
    });
    expect(mockSaveAndShareZip).not.toHaveBeenCalled();
  });

  it('does nothing when "Cancelar" is chosen', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const cancelButton = buttons?.find((b: any) => b.text === 'Cancelar');
      cancelButton?.onPress?.();
    });

    const { getByText, queryByText } = await render(<AccountScreen />);
    await waitFor(() => expect(getByText('Importar/Exportar Tudo')).toBeTruthy());
    await fireEvent.press(getByText('Importar/Exportar Tudo'));

    expect(mockExportCustomersCSV).not.toHaveBeenCalled();
    expect(queryByText('bulk-import-modal-stub')).toBeNull();
  });

  it('hides the entire Dados card for a non-owner (manager)', async () => {
    mockUseAuthReturn = { userInfo: { email: 'manager@acme.pt', full_name: 'Manager', role: 'manager' }, logout: jest.fn() };

    const { queryByText, getByText } = await render(<AccountScreen />);
    await waitFor(() => expect(getByText('Zona de Perigo')).toBeTruthy());

    expect(queryByText('Importar/Exportar Tudo')).toBeNull();
  });
});
