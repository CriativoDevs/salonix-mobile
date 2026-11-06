import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VoucherFormModal } from '../VoucherFormModal';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      surface: '#f8fafc',
      error: '#ef4444',
      errorBackground: '#fee2e2',
      brandPrimary: '#3b82f6',
    },
  }),
}));

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

beforeEach(() => {
  mockLanguage = 'pt';
});

describe('VoucherFormModal - language', () => {
  it('shows English text when language is en', async () => {
    mockLanguage = 'en';
    const { getByText } = await render(
      <VoucherFormModal visible onClose={jest.fn()} onSubmit={jest.fn()} initialData={null} />
    );
    expect(getByText('Create voucher')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });
});

describe('VoucherFormModal', () => {
  it('shows a validation error when the value is empty for a percent voucher', async () => {
    const onSubmit = jest.fn();
    const { getByText } = await render(
      <VoucherFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Informe um valor válido.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a percent voucher with the entered value and defaults', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = await render(
      <VoucherFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.changeText(getByPlaceholderText('0'), '15');
    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith({
      type: 'percent',
      max_uses: 1,
      valid_until: null,
      notes: '',
      value: 15,
      service: null,
    });
  });

  it('requires a service to be selected for a free_service voucher', async () => {
    const onSubmit = jest.fn();
    const services = [{ id: 1, name: 'Corte' }];
    const { getByText, getByTestId } = await render(
      <VoucherFormModal
        visible
        onClose={jest.fn()}
        onSubmit={onSubmit}
        initialData={null}
        services={services}
      />
    );
    await fireEvent.press(getByTestId('voucher-type-free_service'));
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Selecione o serviço gratuito.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a free_service voucher with the selected service', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const services = [{ id: 1, name: 'Corte' }];
    const { getByText, getByTestId } = await render(
      <VoucherFormModal
        visible
        onClose={jest.fn()}
        onSubmit={onSubmit}
        initialData={null}
        services={services}
      />
    );
    await fireEvent.press(getByTestId('voucher-type-free_service'));
    await fireEvent.press(getByTestId('voucher-service-1'));
    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith({
      type: 'free_service',
      max_uses: 1,
      valid_until: null,
      notes: '',
      value: null,
      service: 1,
    });
  });

  it('uppercases and includes the code when provided', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = await render(
      <VoucherFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.changeText(
      getByPlaceholderText('Deixe em branco para gerar automaticamente'),
      'promo10'
    );
    await fireEvent.changeText(getByPlaceholderText('0'), '10');
    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PROMO10' })
    );
  });

  it('pre-fills the form when editing an existing voucher', async () => {
    const { getByDisplayValue } = await render(
      <VoucherFormModal
        visible
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        initialData={{ code: 'ABC123', type: 'fixed', value: 20, max_uses: 3, valid_until: '2026-12-31', notes: 'Nota' }}
      />
    );
    expect(getByDisplayValue('ABC123')).toBeTruthy();
    expect(getByDisplayValue('20')).toBeTruthy();
    expect(getByDisplayValue('3')).toBeTruthy();
    expect(getByDisplayValue('2026-12-31')).toBeTruthy();
    expect(getByDisplayValue('Nota')).toBeTruthy();
  });

  it('rejects an invalid max_uses', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = await render(
      <VoucherFormModal visible onClose={jest.fn()} onSubmit={onSubmit} initialData={null} />
    );
    await fireEvent.changeText(getByPlaceholderText('0'), '10');
    await fireEvent.changeText(getByPlaceholderText('1'), '0');
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Informe um número de usos válido.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
