import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import InventoryScreen from '../InventoryScreen';

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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), setParams: jest.fn() }),
  useRoute: () => ({ params: undefined }),
}));

const mockFetchInventoryItems = jest.fn();
const mockCreateInventoryItem = jest.fn();
const mockUpdateInventoryItem = jest.fn();
const mockDeleteInventoryItem = jest.fn();
const mockCreateStockMovement = jest.fn();
jest.mock('../../api/inventory', () => ({
  fetchInventoryItems: (...args: any[]) => mockFetchInventoryItems(...args),
  createInventoryItem: (...args: any[]) => mockCreateInventoryItem(...args),
  updateInventoryItem: (...args: any[]) => mockUpdateInventoryItem(...args),
  deleteInventoryItem: (...args: any[]) => mockDeleteInventoryItem(...args),
  createStockMovement: (...args: any[]) => mockCreateStockMovement(...args),
}));

jest.mock('../../components/InventoryItemFormModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    InventoryItemFormModal: ({ visible, onSubmit }: any) => {
      if (!visible) return null;
      return (
        <Pressable
          onPress={() =>
            onSubmit({ name: 'Cera', unit: 'un', quantity: 5, minimum_quantity: 1 })
          }
        >
          <Text>submit-stub</Text>
        </Pressable>
      );
    },
  };
});

describe('InventoryScreen', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders inventory items fetched from the API', async () => {
    mockFetchInventoryItems.mockResolvedValue([
      { id: 1, name: 'Shampoo', unit: 'un', quantity: 10, minimum_quantity: 2 },
    ]);
    const { findByText } = await render(<InventoryScreen />);
    expect(await findByText('Shampoo')).toBeTruthy();
  });

  it('shows a low stock badge when quantity is at or below minimum_quantity', async () => {
    mockFetchInventoryItems.mockResolvedValue([
      { id: 1, name: 'Shampoo', unit: 'un', quantity: 1, minimum_quantity: 2 },
    ]);
    const { findByText } = await render(<InventoryScreen />);
    expect(await findByText('Estoque baixo')).toBeTruthy();
  });

  it('creates an item and adds it to the list', async () => {
    mockFetchInventoryItems.mockResolvedValue([]);
    mockCreateInventoryItem.mockResolvedValue({
      id: 2,
      name: 'Cera',
      unit: 'un',
      quantity: 5,
      minimum_quantity: 1,
    });
    const { getByText, findByText } = await render(<InventoryScreen />);
    await waitFor(() => expect(mockFetchInventoryItems).toHaveBeenCalled());
    await fireEvent.press(getByText('Novo item'));
    await fireEvent.press(getByText('submit-stub'));
    expect(mockCreateInventoryItem).toHaveBeenCalledWith({
      slug: 'acme',
      name: 'Cera',
      unit: 'un',
      quantity: 5,
      minimum_quantity: 1,
    });
    expect(await findByText('Cera')).toBeTruthy();
  });

  it('shows an empty state when there are no items', async () => {
    mockFetchInventoryItems.mockResolvedValue([]);
    const { findByText } = await render(<InventoryScreen />);
    expect(await findByText('Nenhum item de estoque cadastrado.')).toBeTruthy();
  });

  it('registers a stock movement from the item action menu and updates the quantity shown', async () => {
    mockFetchInventoryItems.mockResolvedValue([
      { id: 1, name: 'Shampoo', unit: 'un', quantity: 10, minimum_quantity: 2 },
    ]);
    mockCreateStockMovement.mockResolvedValue({
      id: 99,
      item: 1,
      movement_type: 'in',
      quantity: 5,
      notes: '',
    });
    const { findByText, getByText, getByTestId, getByPlaceholderText } = await render(<InventoryScreen />);
    await findByText('Shampoo');
    fireEvent(getByTestId('inventory-item-1'), 'longPress');

    await fireEvent.press(await findByText('Registrar movimentação'));
    await fireEvent.changeText(getByPlaceholderText('0'), '5');
    await fireEvent.press(getByText('Registrar'));

    expect(mockCreateStockMovement).toHaveBeenCalledWith({
      slug: 'acme',
      item: 1,
      movement_type: 'in',
      quantity: 5,
      notes: '',
    });
    expect(await findByText('15 un')).toBeTruthy();
  });

  it('subtracts the quantity for an "out" movement', async () => {
    mockFetchInventoryItems.mockResolvedValue([
      { id: 1, name: 'Shampoo', unit: 'un', quantity: 10, minimum_quantity: 2 },
    ]);
    mockCreateStockMovement.mockResolvedValue({
      id: 99,
      item: 1,
      movement_type: 'out',
      quantity: 4,
      notes: '',
    });
    const { findByText, getByText, getByTestId, getByPlaceholderText } = await render(<InventoryScreen />);
    await findByText('Shampoo');
    fireEvent(getByTestId('inventory-item-1'), 'longPress');

    await fireEvent.press(await findByText('Registrar movimentação'));
    await fireEvent.press(getByTestId('stock-movement-type-out'));
    await fireEvent.changeText(getByPlaceholderText('0'), '4');
    await fireEvent.press(getByText('Registrar'));

    expect(await findByText('6 un')).toBeTruthy();
  });

  it('shows a clear error message when the movement would leave a negative balance', async () => {
    mockFetchInventoryItems.mockResolvedValue([
      { id: 1, name: 'Shampoo', unit: 'un', quantity: 10, minimum_quantity: 2 },
    ]);
    mockCreateStockMovement.mockRejectedValue({
      response: { data: { quantity: ['Saída não pode deixar a quantidade do item negativa.'] } },
    });
    const { findByText, getByText, getByTestId, getByPlaceholderText } = await render(<InventoryScreen />);
    await findByText('Shampoo');
    fireEvent(getByTestId('inventory-item-1'), 'longPress');

    await fireEvent.press(await findByText('Registrar movimentação'));
    await fireEvent.press(getByTestId('stock-movement-type-out'));
    await fireEvent.changeText(getByPlaceholderText('0'), '999');
    await fireEvent.press(getByText('Registrar'));

    expect(await findByText('Saída não pode deixar a quantidade do item negativa.')).toBeTruthy();
    expect(await findByText('10 un')).toBeTruthy();
  });
});
