import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
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
jest.mock('../../api/customers', () => ({
  fetchCustomers: (...args: any[]) => mockFetchCustomers(...args),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
  resendCustomerInvite: jest.fn(),
  exportCustomersCSV: jest.fn(),
}));

jest.mock('../../utils/csvFileSharing', () => ({
  saveAndShareCSV: jest.fn(),
}));

jest.mock('../../components/ImportCustomersModal', () => ({
  __esModule: true,
  ImportCustomersModal: () => null,
}));

jest.mock('../../components/ShareRegistrationLinkModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    ShareRegistrationLinkModal: ({ visible, onClose }: any) => {
      if (!visible) return null;
      return (
        <Pressable onPress={onClose}>
          <Text>qr-modal-stub</Text>
        </Pressable>
      );
    },
  };
});

jest.mock('../../utils/env', () => ({
  getRegistrationLink: (slug: string) => `https://timelyone.today/join/${slug}`,
}));

describe('CustomersScreen - share registration link', () => {
  beforeEach(() => {
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockFetchCustomers.mockResolvedValue({ results: [], count: 0 });
  });
  afterEach(() => jest.clearAllMocks());

  it('shares the registration link when "Partilhar link" is pressed', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction } as any);

    const { getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalled());
    await fireEvent.press(getByText('Partilhar link'));

    await waitFor(() => {
      expect(Share.share).toHaveBeenCalledWith({
        message: 'https://timelyone.today/join/acme',
      });
    });
  });

  it('opens the QR code modal when "Gerar QR Code" is pressed', async () => {
    const { getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalled());
    await fireEvent.press(getByText('Gerar QR Code'));

    await waitFor(() => {
      expect(getByText('qr-modal-stub')).toBeTruthy();
    });
  });

  it('shows "Partilhar link" and "Gerar QR Code" to non-owners too (sem gate de papel, igual ao FEW)', async () => {
    mockUseAuthReturn = { userInfo: { id: 3, role: 'collaborator' } };

    const { getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(mockFetchCustomers).toHaveBeenCalled());

    expect(getByText('Partilhar link')).toBeTruthy();
    expect(getByText('Gerar QR Code')).toBeTruthy();
  });
});
