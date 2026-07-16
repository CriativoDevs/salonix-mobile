import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import TeamScreen from '../TeamScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      brandPrimary: '#3b82f6',
      background: '#fff',
      border: '#ccc',
    },
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

const mockFetchProfessionals = jest.fn();
jest.mock('../../api/professionals', () => ({
  fetchProfessionals: (...args: any[]) => mockFetchProfessionals(...args),
  updateProfessional: jest.fn(),
  deleteProfessional: jest.fn(),
}));

const mockFetchStaffMembers = jest.fn();
const mockExportStaffCSV = jest.fn();
jest.mock('../../api/staff', () => ({
  fetchStaffMembers: (...args: any[]) => mockFetchStaffMembers(...args),
  inviteStaffMember: jest.fn(),
  exportStaffCSV: (...args: any[]) => mockExportStaffCSV(...args),
}));

const mockSaveAndShareCSV = jest.fn();
jest.mock('../../utils/csvFileSharing', () => ({
  saveAndShareCSV: (...args: any[]) => mockSaveAndShareCSV(...args),
}));

jest.mock('../../components/ImportStaffModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    ImportStaffModal: ({ visible, onSuccess }: any) => {
      if (!visible) return null;
      return (
        <Pressable onPress={onSuccess}>
          <Text>import-staff-modal-stub</Text>
        </Pressable>
      );
    },
  };
});

describe('TeamScreen - import/export', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockFetchStaffMembers.mockResolvedValue({ staff: [] });
    mockFetchProfessionals.mockResolvedValue({ results: [], count: 0 });
  });
  afterEach(() => jest.clearAllMocks());

  it('shows the Importar/Exportar button for an owner', async () => {
    const { getByText } = await render(<TeamScreen />);
    await waitFor(() => expect(mockFetchProfessionals).toHaveBeenCalled());

    expect(getByText('Importar/Exportar')).toBeTruthy();
  });

  it('hides the Importar/Exportar button for a non-owner (collaborator)', async () => {
    mockUseAuthReturn = { userInfo: { id: 3, role: 'collaborator' } };

    const { queryByText } = await render(<TeamScreen />);
    await waitFor(() => expect(mockFetchProfessionals).toHaveBeenCalled());

    expect(queryByText('Importar/Exportar')).toBeNull();
  });

  it('exports the CSV and shares it when "Exportar CSV" is chosen', async () => {
    mockExportStaffCSV.mockResolvedValue('email,role\njoao@x.com,collaborator\n');
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const exportButton = buttons?.find((b: any) => b.text === 'Exportar CSV');
      exportButton?.onPress?.();
    });

    const { getByText } = await render(<TeamScreen />);
    await waitFor(() => expect(mockFetchProfessionals).toHaveBeenCalled());
    await fireEvent.press(getByText('Importar/Exportar'));

    await waitFor(() => {
      expect(mockExportStaffCSV).toHaveBeenCalledWith({ slug: 'acme' });
    });
    expect(mockSaveAndShareCSV).toHaveBeenCalledWith('email,role\njoao@x.com,collaborator\n', 'staff.csv');
  });

  it('opens the import modal when "Importar CSV" is chosen, and refreshes the list on success', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const importButton = buttons?.find((b: any) => b.text === 'Importar CSV');
      importButton?.onPress?.();
    });

    const { getByText } = await render(<TeamScreen />);
    await waitFor(() => expect(mockFetchProfessionals).toHaveBeenCalled());
    await fireEvent.press(getByText('Importar/Exportar'));

    await waitFor(() => {
      expect(getByText('import-staff-modal-stub')).toBeTruthy();
    });

    mockFetchProfessionals.mockClear();
    await fireEvent.press(getByText('import-staff-modal-stub'));

    await waitFor(() => {
      expect(mockFetchProfessionals).toHaveBeenCalled();
    });
  });
});
