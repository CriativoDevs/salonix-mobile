import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { updateCustomer } from '../../api/customers';
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

jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
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

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

describe('CustomersScreen - avatar', () => {
  afterEach(() => jest.clearAllMocks());
  beforeEach(() => {
    mockLanguage = 'pt';
  });

  it('shows English text when language is en', async () => {
    mockLanguage = 'en';
    mockFetchCustomers.mockResolvedValue({ count: 0, results: [] });

    const { getByText } = await render(<CustomersScreen />);

    await waitFor(() => expect(getByText('Customers')).toBeTruthy());
    expect(getByText('New customer')).toBeTruthy();
  });

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

  it('mostra a foto nova logo após salvar, sem precisar recarregar a lista', async () => {
    mockFetchCustomers.mockResolvedValue({
      count: 1,
      results: [
        { id: '1', name: 'Maria Silva', email: 'maria@example.com', is_active: true, photo: '/media/customer_photos/old.jpg' },
      ],
    });
    (updateCustomer as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      is_active: true,
      photo: 'http://0.0.0.0:8000/media/customer_photos/new.jpg',
    });

    const { getByTestId, getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(getByTestId('customer-avatar-1')).toBeTruthy());
    expect(getByTestId('customer-avatar-1').props.source.uri).toContain('old.jpg');

    await fireEvent.press(getByText('Maria Silva'));
    await fireEvent.press(getByText('Salvar'));

    await waitFor(() =>
      expect(getByTestId('customer-avatar-1').props.source.uri).toBe(
        'http://0.0.0.0:8000/media/customer_photos/new.jpg'
      )
    );
  });

  it('mantém a foto atual quando o BE não devolve o cliente atualizado', async () => {
    mockFetchCustomers.mockResolvedValue({
      count: 1,
      results: [
        { id: '1', name: 'Maria Silva', email: 'maria@example.com', is_active: true, photo: '/media/customer_photos/old.jpg' },
      ],
    });
    (updateCustomer as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId, getByText } = await render(<CustomersScreen />);
    await waitFor(() => expect(getByTestId('customer-avatar-1')).toBeTruthy());

    await fireEvent.press(getByText('Maria Silva'));
    await fireEvent.press(getByText('Salvar'));

    await waitFor(() => expect(updateCustomer).toHaveBeenCalled());
    expect(getByTestId('customer-avatar-1').props.source.uri).toContain('old.jpg');
  });
});
