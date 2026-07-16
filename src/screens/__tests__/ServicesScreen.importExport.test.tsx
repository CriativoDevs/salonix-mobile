import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ServicesScreen from '../ServicesScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      brandPrimary: '#3b82f6',
      background: '#fff',
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

const mockFetchAdminServices = jest.fn();
const mockExportServicesCSV = jest.fn();
jest.mock('../../api/services', () => ({
  fetchAdminServices: (...args: any[]) => mockFetchAdminServices(...args),
  createService: jest.fn(),
  updateService: jest.fn(),
  deleteService: jest.fn(),
  exportServicesCSV: (...args: any[]) => mockExportServicesCSV(...args),
}));

const mockSaveAndShareCSV = jest.fn();
jest.mock('../../utils/csvFileSharing', () => ({
  saveAndShareCSV: (...args: any[]) => mockSaveAndShareCSV(...args),
}));

jest.mock('../../components/ImportServicesModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    ImportServicesModal: ({ visible, onSuccess }: any) => {
      if (!visible) return null;
      return (
        <Pressable onPress={onSuccess}>
          <Text>import-services-modal-stub</Text>
        </Pressable>
      );
    },
  };
});

describe('ServicesScreen - import/export', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockFetchAdminServices.mockResolvedValue({ results: [], count: 0 });
  });
  afterEach(() => jest.clearAllMocks());

  it('shows the Importar/Exportar button for an owner', async () => {
    const { getByText } = await render(<ServicesScreen />);
    await waitFor(() => expect(mockFetchAdminServices).toHaveBeenCalled());

    expect(getByText('Importar/Exportar')).toBeTruthy();
  });

  it('hides the Importar/Exportar button for a non-owner (manager)', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'manager' } };

    const { queryByText } = await render(<ServicesScreen />);
    await waitFor(() => expect(mockFetchAdminServices).toHaveBeenCalled());

    expect(queryByText('Importar/Exportar')).toBeNull();
  });

  it('exports the CSV and shares it when "Exportar CSV" is chosen', async () => {
    mockExportServicesCSV.mockResolvedValue('name,price_eur\nCorte,20\n');
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const exportButton = buttons?.find((b: any) => b.text === 'Exportar CSV');
      exportButton?.onPress?.();
    });

    const { getByText } = await render(<ServicesScreen />);
    await waitFor(() => expect(mockFetchAdminServices).toHaveBeenCalled());
    await fireEvent.press(getByText('Importar/Exportar'));

    await waitFor(() => {
      expect(mockExportServicesCSV).toHaveBeenCalledWith({ slug: 'acme' });
    });
    expect(mockSaveAndShareCSV).toHaveBeenCalledWith('name,price_eur\nCorte,20\n', 'servicos.csv');
  });

  it('opens the import modal when "Importar CSV" is chosen, and refreshes the list on success', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const importButton = buttons?.find((b: any) => b.text === 'Importar CSV');
      importButton?.onPress?.();
    });

    const { getByText } = await render(<ServicesScreen />);
    await waitFor(() => expect(mockFetchAdminServices).toHaveBeenCalled());
    await fireEvent.press(getByText('Importar/Exportar'));

    await waitFor(() => {
      expect(getByText('import-services-modal-stub')).toBeTruthy();
    });

    mockFetchAdminServices.mockClear();
    await fireEvent.press(getByText('import-services-modal-stub'));

    await waitFor(() => {
      expect(mockFetchAdminServices).toHaveBeenCalled();
    });
  });
});
