import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StockMovementModal } from '../StockMovementModal';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      surface: '#f8fafc',
      error: '#ef4444',
      errorBackground: '#fee2e2',
      success: '#10b981',
      successBackground: '#d1fae5',
      brandPrimary: '#3b82f6',
    },
  }),
}));

describe('StockMovementModal', () => {
  it('shows a validation error when quantity is empty or zero', async () => {
    const onSubmit = jest.fn();
    const { getByText } = await render(
      <StockMovementModal visible onClose={jest.fn()} onSubmit={onSubmit} item={{ id: 1, name: 'Shampoo' }} />
    );
    await fireEvent.press(getByText('Registrar'));
    expect(getByText('Informe uma quantidade maior que zero.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an "in" movement with the entered quantity and notes by default', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = await render(
      <StockMovementModal visible onClose={jest.fn()} onSubmit={onSubmit} item={{ id: 1, name: 'Shampoo' }} />
    );
    await fireEvent.changeText(getByPlaceholderText('0'), '5');
    await fireEvent.changeText(getByPlaceholderText('Ex.: Reposição do fornecedor'), '  Compra mensal  ');
    await fireEvent.press(getByText('Registrar'));
    expect(onSubmit).toHaveBeenCalledWith({ movement_type: 'in', quantity: 5, notes: 'Compra mensal' });
  });

  it('submits an "out" movement when Saída is selected', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByText, getByTestId, getByPlaceholderText } = await render(
      <StockMovementModal visible onClose={jest.fn()} onSubmit={onSubmit} item={{ id: 1, name: 'Shampoo' }} />
    );
    await fireEvent.press(getByTestId('stock-movement-type-out'));
    await fireEvent.changeText(getByPlaceholderText('0'), '3');
    await fireEvent.press(getByText('Registrar'));
    expect(onSubmit).toHaveBeenCalledWith({ movement_type: 'out', quantity: 3, notes: '' });
  });

  it('displays a server error message such as negative balance', async () => {
    const { getByText } = await render(
      <StockMovementModal
        visible
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        item={{ id: 1, name: 'Shampoo' }}
        errorMessage="Saída não pode deixar a quantidade do item negativa."
      />
    );
    expect(getByText('Saída não pode deixar a quantidade do item negativa.')).toBeTruthy();
  });

  it('resets the form fields every time the modal is opened', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, rerender } = await render(
      <StockMovementModal visible onClose={jest.fn()} onSubmit={onSubmit} item={{ id: 1, name: 'Shampoo' }} />
    );
    await fireEvent.changeText(getByPlaceholderText('0'), '7');
    expect(getByPlaceholderText('0').props.value).toBe('7');

    await rerender(
      <StockMovementModal visible={false} onClose={jest.fn()} onSubmit={onSubmit} item={{ id: 1, name: 'Shampoo' }} />
    );
    await rerender(
      <StockMovementModal visible onClose={jest.fn()} onSubmit={onSubmit} item={{ id: 1, name: 'Shampoo' }} />
    );

    expect(getByPlaceholderText('0').props.value).toBe('');
  });
});
