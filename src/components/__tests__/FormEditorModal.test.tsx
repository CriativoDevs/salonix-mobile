import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { FormEditorModal } from '../FormEditorModal';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
      background: '#fff',
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

const existingForm = {
  id: 5,
  title: 'Ficha inicial',
  is_active: true,
  client_editable: false,
  fields: [
    { id: 11, label: 'Alergias', field_type: 'text', required: true, options: null, order: 0 },
    { id: 12, label: 'Tipo', field_type: 'select', required: false, options: ['A', 'B'], order: 1 },
  ],
};

beforeEach(() => {
  mockLanguage = 'pt';
  jest.restoreAllMocks();
});

describe('FormEditorModal', () => {
  it('shows English copy when language is en', async () => {
    mockLanguage = 'en';
    const { getByText } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={jest.fn()} form={null} />
    );
    expect(getByText('New form')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('requires a title', async () => {
    const onSubmit = jest.fn();
    const { getByText } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={onSubmit} form={null} />
    );
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Informe o título da ficha.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('creates a form with new fields without id and order = index', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={onSubmit} form={null} />
    );
    await fireEvent.changeText(getByTestId('form-title-input'), '  Anamnese  ');
    await fireEvent.press(getByTestId('form-add-field'));
    await fireEvent.changeText(getByTestId('field-label-0'), 'Peso');
    await fireEvent.press(getByTestId('field-type-0'));
    await fireEvent.press(getByTestId('field-type-0-option-number'));
    await fireEvent(getByTestId('field-required-0'), 'valueChange', true);
    await fireEvent.press(getByTestId('form-add-field'));
    await fireEvent.changeText(getByTestId('field-label-1'), 'Notas');
    await fireEvent.press(getByText('Salvar'));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Anamnese',
      is_active: true,
      client_editable: false,
      fields: [
        { label: 'Peso', field_type: 'number', required: true, options: null, order: 0 },
        { label: 'Notas', field_type: 'text', required: false, options: null, order: 1 },
      ],
    });
  });

  it('requires a label on every field', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={onSubmit} form={null} />
    );
    await fireEvent.changeText(getByTestId('form-title-input'), 'X');
    await fireEvent.press(getByTestId('form-add-field'));
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Todos os campos precisam de um nome.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires at least one option for select fields and parses options by line/comma', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={onSubmit} form={null} />
    );
    await fireEvent.changeText(getByTestId('form-title-input'), 'X');
    await fireEvent.press(getByTestId('form-add-field'));
    await fireEvent.changeText(getByTestId('field-label-0'), 'Escolha');
    await fireEvent.press(getByTestId('field-type-0'));
    await fireEvent.press(getByTestId('field-type-0-option-select'));
    await fireEvent.press(getByText('Salvar'));
    expect(getByText('Campos de seleção precisam de pelo menos uma opção.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(getByTestId('field-options-0'), 'Sim, Não\n\n Talvez ,');
    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: [
          { label: 'Escolha', field_type: 'select', required: false, options: ['Sim', 'Não', 'Talvez'], order: 0 },
        ],
      })
    );
  });

  it('keeps ids of existing fields on edit and gives new fields no id', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={onSubmit} form={existingForm} />
    );
    expect(getByText('Editar ficha')).toBeTruthy();
    await fireEvent.changeText(getByTestId('field-label-0'), 'Alergias graves');
    await fireEvent.press(getByTestId('form-add-field'));
    await fireEvent.changeText(getByTestId('field-label-2'), 'Novo');
    await fireEvent.press(getByText('Salvar'));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Ficha inicial',
      is_active: true,
      client_editable: false,
      fields: [
        { id: 11, label: 'Alergias graves', field_type: 'text', required: true, options: null, order: 0 },
        { id: 12, label: 'Tipo', field_type: 'select', required: false, options: ['A', 'B'], order: 1 },
        { label: 'Novo', field_type: 'text', required: false, options: null, order: 2 },
      ],
    });
  });

  it('reorders fields and recalculates order, keeping ids', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={onSubmit} form={existingForm} />
    );
    await fireEvent.press(getByTestId('field-down-0'));
    await fireEvent.press(getByText('Salvar'));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.fields.map((f: any) => [f.id, f.order])).toEqual([
      [12, 0],
      [11, 1],
    ]);

    onSubmit.mockClear();
    await fireEvent.press(getByTestId('field-up-1'));
    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit.mock.calls[0][0].fields.map((f: any) => f.id)).toEqual([11, 12]);
  });

  it('warns before removing an existing field and removes only after confirming', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={onSubmit} form={existingForm} />
    );
    await fireEvent.press(getByTestId('field-remove-0'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][1]).toMatch(/respostas/);

    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit.mock.calls[0][0].fields).toHaveLength(2);

    const buttons: any[] = alertSpy.mock.calls[0][2] as any;
    const confirm = buttons.find((b) => b.style === 'destructive');
    await act(async () => {
      confirm.onPress();
    });
    onSubmit.mockClear();
    await fireEvent.press(getByText('Salvar'));
    expect(onSubmit.mock.calls[0][0].fields.map((f: any) => f.id)).toEqual([12]);
    expect(onSubmit.mock.calls[0][0].fields[0].order).toBe(0);
  });

  it('removes a new field without warning', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { queryByTestId, getByTestId } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={jest.fn()} form={null} />
    );
    await fireEvent.press(getByTestId('form-add-field'));
    await fireEvent.press(getByTestId('field-remove-0'));
    expect(alertSpy).not.toHaveBeenCalled();
    expect(queryByTestId('field-label-0')).toBeNull();
  });

  it('shows the error message received from the parent', async () => {
    const { getByText } = await render(
      <FormEditorModal visible onClose={jest.fn()} onSubmit={jest.fn()} form={null} errorMessage="Falhou" />
    );
    expect(getByText('Falhou')).toBeTruthy();
  });
});
