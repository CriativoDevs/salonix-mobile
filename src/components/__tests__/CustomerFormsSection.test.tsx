import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CustomerFormsSection } from '../CustomerFormsSection';

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
      success: '#16a34a',
    },
  }),
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt', setLanguage: jest.fn() }),
}));

const mockFetchForms = jest.fn();
const mockFetchResponses = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
jest.mock('../../api/forms', () => ({
  fetchForms: (...a: any[]) => mockFetchForms(...a),
  fetchCustomerFormResponses: (...a: any[]) => mockFetchResponses(...a),
  createFormResponse: (...a: any[]) => mockCreate(...a),
  updateFormResponse: (...a: any[]) => mockUpdate(...a),
}));

const form = {
  id: 'form-1',
  title: 'Anamnese',
  is_active: true,
  fields: [
    { id: 'a', label: 'Alergias', field_type: 'text', required: true, options: [] },
    { id: 'b', label: 'Gestante', field_type: 'boolean', required: false, options: [] },
    { id: 'c', label: 'Idade', field_type: 'number', required: false, options: [] },
  ],
};

async function expand(utils: ReturnType<typeof render> extends Promise<infer R> ? R : never) {
  await fireEvent.press(utils.getByText('Fichas do cliente'));
}

describe('CustomerFormsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchForms.mockResolvedValue([form, { ...form, id: 'form-2', title: 'Inativa', is_active: false }]);
    mockFetchResponses.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 'r1', form: 'form-1', answers: [] });
    mockUpdate.mockResolvedValue({ id: 'r1', form: 'form-1', answers: [] });
  });

  it('does not fetch anything before expanding', async () => {
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    expect(u.getByText('Fichas do cliente')).toBeTruthy();
    expect(mockFetchForms).not.toHaveBeenCalled();
    expect(mockFetchResponses).not.toHaveBeenCalled();
  });

  it('fetches once on first expand and shows only active forms', async () => {
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => expect(u.getByText('Anamnese')).toBeTruthy());
    expect(u.queryByText('Inativa')).toBeNull();
    expect(mockFetchForms).toHaveBeenCalledWith({ slug: 'acme' });
    expect(mockFetchResponses).toHaveBeenCalledWith('c1', { slug: 'acme' });
    await expand(u); // collapse
    await expand(u); // expand again
    expect(mockFetchForms).toHaveBeenCalledTimes(1);
  });

  it('shows empty state', async () => {
    mockFetchForms.mockResolvedValue([]);
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => expect(u.getByText(/Nenhuma ficha ativa/)).toBeTruthy());
  });

  it('shows load error', async () => {
    mockFetchForms.mockRejectedValue(new Error('boom'));
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => expect(u.getByText('Não foi possível carregar as fichas.')).toBeTruthy());
  });

  it('prefills values from existing response', async () => {
    mockFetchResponses.mockResolvedValue([
      { id: 'r1', form: 'form-1', answers: [{ field_id: 'a', value: 'Penicilina' }, { field_id: 'b', value: 'true' }] },
    ]);
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => expect(u.getByDisplayValue('Penicilina')).toBeTruthy());
    expect(u.getByRole('switch').props.value).toBe(true);
  });

  it('blocks submit when required field is empty', async () => {
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => u.getByText('Anamnese'));
    await fireEvent.press(u.getByText('Salvar'));
    expect(u.getByText('Preencha o campo obrigatório: Alergias')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('creates response with full payload (boolean default "false")', async () => {
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => u.getByText('Anamnese'));
    await fireEvent.changeText(u.getByTestId('form-field-a'), 'Nenhuma');
    await fireEvent.press(u.getByText('Salvar'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate).toHaveBeenCalledWith(
      {
        form: 'form-1',
        customer: 'c1',
        answers: [
          { field_id: 'a', value: 'Nenhuma' },
          { field_id: 'b', value: 'false' },
          { field_id: 'c', value: '' },
        ],
      },
      { slug: 'acme' }
    );
    await waitFor(() => expect(u.getByText('Ficha salva.')).toBeTruthy());
  });

  it('sends boolean as "true" after toggling', async () => {
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => u.getByText('Anamnese'));
    await fireEvent.changeText(u.getByTestId('form-field-a'), 'x');
    await fireEvent(u.getByRole('switch'), 'valueChange', true);
    await fireEvent.press(u.getByText('Salvar'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate.mock.calls[0][0].answers).toContainEqual({ field_id: 'b', value: 'true' });
  });

  it('updates (PATCH) when a response already exists', async () => {
    mockFetchResponses.mockResolvedValue([
      { id: 'r1', form: 'form-1', answers: [{ field_id: 'a', value: 'Penicilina' }] },
    ]);
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => u.getByDisplayValue('Penicilina'));
    await fireEvent.changeText(u.getByTestId('form-field-c'), '30');
    await fireEvent.press(u.getByText('Salvar'));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate).toHaveBeenCalledWith(
      'r1',
      {
        answers: [
          { field_id: 'a', value: 'Penicilina' },
          { field_id: 'b', value: 'false' },
          { field_id: 'c', value: '30' },
        ],
      },
      { slug: 'acme' }
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('shows API error on save', async () => {
    mockCreate.mockRejectedValue({ response: { data: { detail: 'Campo inválido.' } } });
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => u.getByText('Anamnese'));
    await fireEvent.changeText(u.getByTestId('form-field-a'), 'x');
    await fireEvent.press(u.getByText('Salvar'));
    await waitFor(() => expect(u.getByText('Campo inválido.')).toBeTruthy());
    expect(u.queryByText('Ficha salva.')).toBeNull();
  });

  it('renders titles, labels and values as literal text', async () => {
    mockFetchForms.mockResolvedValue([
      { ...form, title: '<b>t</b>', fields: [{ id: 'a', label: '<b>x</b>', field_type: 'text', required: false, options: [] }] },
    ]);
    mockFetchResponses.mockResolvedValue([
      { id: 'r1', form: 'form-1', answers: [{ field_id: 'a', value: '<b>y</b>' }] },
    ]);
    const u = await render(<CustomerFormsSection customerId="c1" slug="acme" />);
    await expand(u);
    await waitFor(() => expect(u.getByText('<b>t</b>')).toBeTruthy());
    expect(u.getByText('<b>x</b>')).toBeTruthy();
    expect(u.getByDisplayValue('<b>y</b>')).toBeTruthy();
  });
});
