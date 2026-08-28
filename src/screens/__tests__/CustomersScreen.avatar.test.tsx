import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
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

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ userInfo: { id: 1, role: 'owner' } }),
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

jest.mock('../../components/ShareRegistrationLinkModal', () => ({
  __esModule: true,
  ShareRegistrationLinkModal: () => null,
}));

describe('CustomersScreen - avatar', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the photo when the customer has one', async () => {
    mockFetchCustomers.mockResolvedValue({
      count: 1,
      results: [
        { id: '1', name: 'Maria Silva', email: 'maria@example.com', is_active: true, photo: '/media/customer_photos/maria.jpg' },
      ],
    });

    const { getByTestId } = await render(<CustomersScreen />);

    await waitFor(() => expect(getByTestId('customer-avatar-1')).toBeTruthy());
    expect(getByTestId('customer-avatar-1').props.source.uri).toBe(
      'http://0.0.0.0:8000/media/customer_photos/maria.jpg'
    );
  });

  it('falls back to initials when the customer has no photo', async () => {
    mockFetchCustomers.mockResolvedValue({
      count: 1,
      results: [
        { id: '2', name: 'João Costa', email: 'joao@example.com', is_active: true, photo: null },
      ],
    });

    const { getByTestId, getByText } = await render(<CustomersScreen />);

    await waitFor(() => expect(getByTestId('customer-avatar-2')).toBeTruthy());
    expect(getByTestId('customer-avatar-2').props.source).toBeUndefined();
    expect(getByText('JC')).toBeTruthy();
  });
});
