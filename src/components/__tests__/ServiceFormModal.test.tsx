import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ServiceFormModal } from '../ServiceFormModal';

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

describe('ServiceFormModal', () => {
  it('shows a validation error when the name is empty', async () => {
    const onSubmit = jest.fn();
    const { getByText } = await render(
      <ServiceFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Nome do serviço é obrigatório')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when the price is zero or invalid', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = await render(
      <ServiceFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.changeText(getByPlaceholderText('Ex.: Corte de cabelo'), 'Corte');
    await fireEvent.changeText(getByPlaceholderText('0.00'), '0');
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Preço deve ser maior que zero')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when the duration is zero or invalid', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = await render(
      <ServiceFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.changeText(getByPlaceholderText('Ex.: Corte de cabelo'), 'Corte');
    await fireEvent.changeText(getByPlaceholderText('0.00'), '20');
    await fireEvent.changeText(getByPlaceholderText('30'), '0');
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Duração deve ser maior que zero')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed and normalized payload when the form is valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = await render(
      <ServiceFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.changeText(getByPlaceholderText('Ex.: Corte de cabelo'), '  Corte  ');
    await fireEvent.changeText(getByPlaceholderText('0.00'), '20');
    await fireEvent.changeText(getByPlaceholderText('30'), '45');
    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Corte',
      price_eur: '20.00',
      duration_minutes: 45,
    });
  });

  it('pre-fills the form when editing an existing service', async () => {
    const { getByDisplayValue } = await render(
      <ServiceFormModal
        visible
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        initialData={{ id: 1, name: 'Corte', price_eur: '20.00', duration_minutes: 30 }}
      />
    );
    expect(getByDisplayValue('Corte')).toBeTruthy();
    expect(getByDisplayValue('20.00')).toBeTruthy();
    expect(getByDisplayValue('30')).toBeTruthy();
  });
});
