import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FormFieldInput } from '../FormFieldInput';

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

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

const base = { id: 'f1', label: 'Alergias', required: false, options: [] as string[] };

describe('FormFieldInput', () => {
  beforeEach(() => {
    mockLanguage = 'pt';
  });

  it('renders text field and emits changes as string', async () => {
    const onChange = jest.fn();
    const { getByDisplayValue } = await render(
      <FormFieldInput field={{ ...base, field_type: 'text' }} value="abc" onChange={onChange} />
    );
    await fireEvent.changeText(getByDisplayValue('abc'), 'xyz');
    expect(onChange).toHaveBeenCalledWith('xyz');
  });

  it('renders textarea as multiline', async () => {
    const { getByDisplayValue } = await render(
      <FormFieldInput field={{ ...base, field_type: 'textarea' }} value="longo" onChange={jest.fn()} />
    );
    expect(getByDisplayValue('longo').props.multiline).toBe(true);
  });

  it('renders number with numeric keyboard', async () => {
    const { getByDisplayValue } = await render(
      <FormFieldInput field={{ ...base, field_type: 'number' }} value="12" onChange={jest.fn()} />
    );
    expect(getByDisplayValue('12').props.keyboardType).toBe('numeric');
  });

  it('boolean switch emits "true"/"false"', async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <FormFieldInput field={{ ...base, field_type: 'boolean' }} value="false" onChange={onChange} />
    );
    const sw = getByRole('switch');
    expect(sw.props.value).toBe(false);
    await fireEvent(sw, 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith('true');
  });

  it('boolean reflects "true" value', async () => {
    const { getByRole } = await render(
      <FormFieldInput field={{ ...base, field_type: 'boolean' }} value="true" onChange={jest.fn()} />
    );
    expect(getByRole('switch').props.value).toBe(true);
  });

  it('select shows the selected option', async () => {
    const { getByText } = await render(
      <FormFieldInput
        field={{ ...base, field_type: 'select', options: ['Sim', 'Não'] }}
        value="Sim"
        onChange={jest.fn()}
      />
    );
    expect(getByText('Sim')).toBeTruthy();
  });

  it('date renders a text input with the value', async () => {
    const { getByDisplayValue } = await render(
      <FormFieldInput field={{ ...base, field_type: 'date' }} value="2026-01-31" onChange={jest.fn()} />
    );
    expect(getByDisplayValue('2026-01-31')).toBeTruthy();
  });

  it('shows required marker with accessibility label', async () => {
    const { getByLabelText } = await render(
      <FormFieldInput field={{ ...base, field_type: 'text', required: true }} value="" onChange={jest.fn()} />
    );
    expect(getByLabelText('obrigatório')).toBeTruthy();
  });

  it('required marker label is English when language is en', async () => {
    mockLanguage = 'en';
    const { getByLabelText } = await render(
      <FormFieldInput field={{ ...base, field_type: 'text', required: true }} value="" onChange={jest.fn()} />
    );
    expect(getByLabelText('required')).toBeTruthy();
  });

  it('renders label and value as plain text', async () => {
    const { getByText, getByDisplayValue } = await render(
      <FormFieldInput
        field={{ ...base, label: '<b>x</b>', field_type: 'text' }}
        value="<b>y</b>"
        onChange={jest.fn()}
      />
    );
    expect(getByText('<b>x</b>')).toBeTruthy();
    expect(getByDisplayValue('<b>y</b>')).toBeTruthy();
  });
});
