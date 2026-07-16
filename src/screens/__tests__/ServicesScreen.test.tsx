import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ServicesScreen from '../ServicesScreen';

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

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ userInfo: { id: 1, role: 'owner' } }),
}));

const mockFetchAdminServices = jest.fn();
const mockCreateService = jest.fn();
const mockUpdateService = jest.fn();
const mockDeleteService = jest.fn();
jest.mock('../../api/services', () => ({
  fetchAdminServices: (...args: any[]) => mockFetchAdminServices(...args),
  createService: (...args: any[]) => mockCreateService(...args),
  updateService: (...args: any[]) => mockUpdateService(...args),
  deleteService: (...args: any[]) => mockDeleteService(...args),
  fetchServices: jest.fn(),
}));

jest.mock('../../components/ServiceFormModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    ServiceFormModal: ({ visible, onSubmit }: any) => {
      if (!visible) return null;
      return (
        <Pressable
          onPress={() =>
            onSubmit({ name: 'Manicure', price_eur: '25.00', duration_minutes: 45 })
          }
        >
          <Text>submit-stub</Text>
        </Pressable>
      );
    },
  };
});

describe('ServicesScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders services fetched from the API', async () => {
    mockFetchAdminServices.mockResolvedValue([
      { id: 1, name: 'Corte', price_eur: '20.00', duration_minutes: 30 },
    ]);
    const { findByText } = await render(<ServicesScreen />);
    expect(await findByText('Corte')).toBeTruthy();
  });

  it('creates a service and adds it to the list', async () => {
    mockFetchAdminServices.mockResolvedValue([]);
    mockCreateService.mockResolvedValue({
      id: 2,
      name: 'Manicure',
      price_eur: '25.00',
      duration_minutes: 45,
    });
    const { getByText, findByText } = await render(<ServicesScreen />);
    await waitFor(() => expect(mockFetchAdminServices).toHaveBeenCalled());
    await fireEvent.press(getByText('Novo serviço'));
    await fireEvent.press(getByText('submit-stub'));
    expect(mockCreateService).toHaveBeenCalledWith({
      name: 'Manicure',
      price_eur: '25.00',
      duration_minutes: 45,
    });
    expect(await findByText('Manicure')).toBeTruthy();
  });

  it('shows an empty state when there are no services', async () => {
    mockFetchAdminServices.mockResolvedValue([]);
    const { findByText } = await render(<ServicesScreen />);
    expect(await findByText('Nenhum serviço encontrado.')).toBeTruthy();
  });
});
