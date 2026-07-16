import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CustomersScreen from '../CustomersScreen';

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
      error: '#ef4444',
    },
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const mockFetchCustomers = jest.fn();
const mockExportCustomersCSV = jest.fn();
jest.mock('../../api/customers', () => ({
  fetchCustomers: (...args: any[]) => mockFetchCustomers(...args),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
  resendCustomerInvite: jest.fn(),
  exportCustomersCSV: (...args: any[]) => mockExportCustomersCSV(...args),
}));

const mockSaveAndShareCSV = jest.fn();
jest.mock('../../utils/csvFileSharing', () => ({
  saveAndShareCSV: (...args: any[]) => mockSaveAndShareCSV(...args),
}));

jest.mock('../../components/ImportCustomersModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    ImportCustomersModal: ({ visible, onSuccess }: any) => {
      if (!visible) return null;
      return (
        <Pressable onPress={onSuccess}>
          <Text>import-modal-stub</Text>
        </Pressable>
      );
    },
  };
});

describe('CustomersScreen - import/export', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockFetchCustomers.mockResolvedValue({ results: [], count: 0 });
  });
  afterEach(() => jest.clearAllMocks());

  it('exports the CSV and shares it when "Exportar CSV" is chosen', async () => {
    mockExportCustomersCSV.mockResolvedValue('id,name\n1,Ana\n');
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const exportButton = buttons?.find((b: any) => b.text === 'Exportar CSV');
      exportButton?.onPress?.();
    });

    const { getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalled());
    await fireEvent.press(getByText('Importar/Exportar'));

    await waitFor(() => {
      expect(mockExportCustomersCSV).toHaveBeenCalledWith({ slug: 'acme' });
    });
    expect(mockSaveAndShareCSV).toHaveBeenCalledWith('id,name\n1,Ana\n', 'clientes.csv');
  });

  it('opens the import modal when "Importar CSV" is chosen, and refreshes the list on success', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const importButton = buttons?.find((b: any) => b.text === 'Importar CSV');
      importButton?.onPress?.();
    });

    const { getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalled());
    await fireEvent.press(getByText('Importar/Exportar'));

    await waitFor(() => {
      expect(getByText('import-modal-stub')).toBeTruthy();
    });

    mockFetchCustomers.mockClear();
    await fireEvent.press(getByText('import-modal-stub'));

    await waitFor(() => {
      expect(mockFetchCustomers).toHaveBeenCalled();
    });
  });

  it('hides the Importar/Exportar button for a non-owner (collaborator)', async () => {
    mockUseAuthReturn = { userInfo: { id: 3, role: 'collaborator' } };

    const { queryByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalled());

    expect(queryByText('Importar/Exportar')).toBeNull();
  });
});
