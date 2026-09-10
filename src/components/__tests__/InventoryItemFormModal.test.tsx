import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InventoryItemFormModal } from '../InventoryItemFormModal';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      surface: '#f8fafc',
      error: '#ef4444',
      brandPrimary: '#3b82f6',
    },
  }),
}));

describe('InventoryItemFormModal', () => {
  it('shows a validation error when the name is empty', async () => {
    const onSubmit = jest.fn();
    const { getByText } = await render(
      <InventoryItemFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Nome do item é obrigatório')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when the unit is empty', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = await render(
      <InventoryItemFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.changeText(getByPlaceholderText('Ex.: Shampoo profissional 1L'), 'Shampoo');
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Unidade é obrigatória')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed and normalized payload when the form is valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = await render(
      <InventoryItemFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.changeText(getByPlaceholderText('Ex.: Shampoo profissional 1L'), '  Shampoo  ');
    await fireEvent.changeText(getByPlaceholderText('Ex.: un, ml, kg'), 'un');
    await fireEvent.changeText(getByPlaceholderText('0'), '15');
    await fireEvent.changeText(getByPlaceholderText('Opcional'), '3');
    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Shampoo',
      unit: 'un',
      quantity: 15,
      minimum_quantity: 3,
    });
  });

  it('submits null minimum_quantity when left blank', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = await render(
      <InventoryItemFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.changeText(getByPlaceholderText('Ex.: Shampoo profissional 1L'), 'Cera');
    await fireEvent.changeText(getByPlaceholderText('Ex.: un, ml, kg'), 'un');
    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Cera',
      unit: 'un',
      quantity: 0,
      minimum_quantity: null,
    });
  });

  it('pre-fills the form when editing an existing item', async () => {
    const { getByDisplayValue } = await render(
      <InventoryItemFormModal
        visible
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        initialData={{ id: 1, name: 'Shampoo', unit: 'un', quantity: 10, minimum_quantity: 2 }}
      />
    );
    expect(getByDisplayValue('Shampoo')).toBeTruthy();
    expect(getByDisplayValue('un')).toBeTruthy();
    expect(getByDisplayValue('10')).toBeTruthy();
    expect(getByDisplayValue('2')).toBeTruthy();
  });
});
