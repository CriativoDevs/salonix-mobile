import React from 'react';
import { Alert } from 'react-native';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import FormsScreen from '../FormsScreen';

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
      success: '#22c55e',
    },
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

let mockRole = 'owner';
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ userInfo: { role: mockRole } }),
}));

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

const mockFetchForms = jest.fn();
const mockCreateForm = jest.fn();
const mockUpdateForm = jest.fn();
const mockDeleteForm = jest.fn();
jest.mock('../../api/forms', () => ({
  fetchForms: (...a: any[]) => mockFetchForms(...a),
  createForm: (...a: any[]) => mockCreateForm(...a),
  updateForm: (...a: any[]) => mockUpdateForm(...a),
  deleteForm: (...a: any[]) => mockDeleteForm(...a),
}));

const mockPayload = {
  title: 'Nova',
  is_active: true,
  client_editable: false,
  fields: [{ label: 'X', field_type: 'text', required: false, options: null, order: 0 }],
};
jest.mock('../../components/FormEditorModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    FormEditorModal: ({ visible, onSubmit, form, errorMessage }: any) => {
      if (!visible) return null;
      return (
        <>
          <Text>{form ? `editing-${form.id}` : 'creating'}</Text>
          {errorMessage ? <Text>{errorMessage}</Text> : null}
          <Pressable onPress={() => onSubmit(mockPayload)}>
            <Text>submit-stub</Text>
          </Pressable>
        </>
      );
    },
  };
});

const sampleForms = [
  {
    id: 1,
    title: 'Anamnese',
    is_active: true,
    client_editable: true,
    fields: [{ id: 1 }, { id: 2 }],
  },
  { id: 2, title: 'Termo', is_active: false, client_editable: false, fields: [] },
];

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  mockRole = 'owner';
  mockLanguage = 'pt';
  mockFetchForms.mockResolvedValue(sampleForms);
});

describe('FormsScreen', () => {
  it('lists forms with badges and field count', async () => {
    const { findByText, getByText, getAllByText } = await render(<FormsScreen />);
    expect(await findByText('Anamnese')).toBeTruthy();
    expect(getByText('Termo')).toBeTruthy();
    expect(getByText('Ativa')).toBeTruthy();
    expect(getByText('Inativa')).toBeTruthy();
    expect(getAllByText('Cliente edita')).toHaveLength(1);
    expect(getByText('2 campos')).toBeTruthy();
    expect(mockFetchForms).toHaveBeenCalledWith({ slug: 'acme' });
  });

  it('shows access denied for non owner/manager and does not fetch', async () => {
    mockRole = 'staff';
    const { findByText, queryByText } = await render(<FormsScreen />);
    expect(await findByText('Sem permissão para gerir fichas.')).toBeTruthy();
    expect(queryByText('Nova ficha')).toBeNull();
    expect(mockFetchForms).not.toHaveBeenCalled();
  });

  it('shows the empty state', async () => {
    mockFetchForms.mockResolvedValue([]);
    const { findByText } = await render(<FormsScreen />);
    expect(await findByText('Nenhuma ficha criada.')).toBeTruthy();
  });

  it('shows a load error message', async () => {
    mockFetchForms.mockRejectedValue({ response: { data: { detail: 'Sem acesso' } } });
    const { findByText } = await render(<FormsScreen />);
    expect(await findByText('Sem acesso')).toBeTruthy();
  });

  it('creates a form through the modal', async () => {
    mockCreateForm.mockResolvedValue({ id: 9, title: 'Nova', is_active: true, client_editable: false, fields: [{ id: 1 }] });
    const { findByText, getByText } = await render(<FormsScreen />);
    await findByText('Anamnese');
    await fireEvent.press(getByText('Nova ficha'));
    expect(getByText('creating')).toBeTruthy();
    await fireEvent.press(getByText('submit-stub'));
    await waitFor(() => expect(mockCreateForm).toHaveBeenCalledWith(mockPayload, { slug: 'acme' }));
    expect(await findByText('Nova')).toBeTruthy();
  });

  it('edits a form via updateForm', async () => {
    mockUpdateForm.mockResolvedValue({ ...sampleForms[0], title: 'Anamnese v2' });
    const { findByText, getByTestId, getByText } = await render(<FormsScreen />);
    await findByText('Anamnese');
    await fireEvent.press(getByTestId('form-item-1'));
    expect(getByText('editing-1')).toBeTruthy();
    await fireEvent.press(getByText('submit-stub'));
    await waitFor(() => expect(mockUpdateForm).toHaveBeenCalledWith(1, mockPayload, { slug: 'acme' }));
    expect(await findByText('Anamnese v2')).toBeTruthy();
  });

  it('shows the API error inside the modal when saving fails', async () => {
    mockCreateForm.mockRejectedValue({ response: { data: { title: ['Título inválido'] } } });
    const { findByText, getByText } = await render(<FormsScreen />);
    await findByText('Anamnese');
    await fireEvent.press(getByText('Nova ficha'));
    await fireEvent.press(getByText('submit-stub'));
    expect(await findByText('Título inválido')).toBeTruthy();
  });

  it('confirms before deleting and warns about client responses', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockDeleteForm.mockResolvedValue(true);
    const { findByText, getByTestId, queryByText } = await render(<FormsScreen />);
    await findByText('Anamnese');
    await fireEvent.press(getByTestId('form-delete-1'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][1]).toMatch(/respostas/);
    expect(mockDeleteForm).not.toHaveBeenCalled();

    const buttons: any[] = alertSpy.mock.calls[0][2] as any;
    await act(async () => {
      await buttons.find((b) => b.style === 'destructive').onPress();
    });
    expect(mockDeleteForm).toHaveBeenCalledWith(1, { slug: 'acme' });
    await waitFor(() => expect(queryByText('Anamnese')).toBeNull());
  });

  it('alerts when deleting fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockDeleteForm.mockRejectedValue({ response: { data: { detail: 'Proibido' } } });
    const { findByText, getByTestId } = await render(<FormsScreen />);
    await findByText('Anamnese');
    await fireEvent.press(getByTestId('form-delete-1'));
    const buttons: any[] = alertSpy.mock.calls[0][2] as any;
    await act(async () => {
      await buttons.find((b) => b.style === 'destructive').onPress();
    });
    expect(alertSpy).toHaveBeenLastCalledWith('Erro', 'Proibido');
  });
});
