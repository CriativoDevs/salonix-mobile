import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SlotsScreen from '../SlotsScreen';

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

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

const mockFetchSlots = jest.fn();
const mockCreateSlot = jest.fn();
const mockDeleteSlot = jest.fn();
jest.mock('../../api/slots', () => ({
  fetchSlots: (...args: any[]) => mockFetchSlots(...args),
  createSlot: (...args: any[]) => mockCreateSlot(...args),
  deleteSlot: (...args: any[]) => mockDeleteSlot(...args),
}));

const mockFetchProfessionals = jest.fn();
jest.mock('../../api/professionals', () => ({
  fetchProfessionals: (...args: any[]) => mockFetchProfessionals(...args),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

jest.mock('../../components/SlotBulkGenerateModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    SlotBulkGenerateModal: ({ visible, onSuccess }: any) => {
      if (!visible) return null;
      return (
        <Pressable onPress={onSuccess}>
          <Text>bulk-generate-modal-stub</Text>
        </Pressable>
      );
    },
  };
});

describe('SlotsScreen - bulk generate', () => {
  beforeEach(() => {
    mockFetchSlots.mockResolvedValue({ results: [], count: 0 });
    mockFetchProfessionals.mockResolvedValue({ results: [{ id: 1, name: 'Ana' }] });
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
  });
  afterEach(() => jest.clearAllMocks());

  it('shows "Gerar em massa" for owner/manager and opens the modal', async () => {
    const { getByText } = await render(<SlotsScreen />);
    await waitFor(() => expect(getByText('Gerar em massa')).toBeTruthy());

    await fireEvent.press(getByText('Gerar em massa'));

    await waitFor(() => {
      expect(getByText('bulk-generate-modal-stub')).toBeTruthy();
    });
  });

  it('refreshes the list when the modal reports success', async () => {
    const { getByText } = await render(<SlotsScreen />);
    await waitFor(() => expect(getByText('Gerar em massa')).toBeTruthy());
    await fireEvent.press(getByText('Gerar em massa'));
    await waitFor(() => expect(getByText('bulk-generate-modal-stub')).toBeTruthy());

    mockFetchSlots.mockClear();
    await fireEvent.press(getByText('bulk-generate-modal-stub'));

    await waitFor(() => {
      expect(mockFetchSlots).toHaveBeenCalled();
    });
  });

  it('hides "Gerar em massa" for a collaborator', async () => {
    mockUseAuthReturn = { userInfo: { id: 2, role: 'collaborator' } };

    const { queryByText, getByText } = await render(<SlotsScreen />);
    await waitFor(() => expect(getByText('Novo horário')).toBeTruthy());

    expect(queryByText('Gerar em massa')).toBeNull();
  });
});
