import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SlotBulkGenerateModal } from '../SlotBulkGenerateModal';

// O Picker nativo (`@react-native-picker/picker`) foi substituído por `Select`
// (trigger + Modal com lista de opções, ver src/components/ui/Select.tsx) para
// corrigir a sobreposição visual do wheel picker dentro de modais com tema escuro.
// A seleção agora simula a interação real do utilizador: abrir o trigger e tocar
// na opção pretendida.
async function selectProfessional(getByTestId: any, getByText: any, name: string) {
  await fireEvent.press(getByTestId('bulk-generate-professional-picker'));
  await fireEvent.press(getByText(name));
}

const mockShowToast = jest.fn();
jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
      error: '#ef4444',
      brandPrimary: '#3b82f6',
      background: '#fff',
    },
  }),
}));

const mockBulkGenerateSlots = jest.fn();
jest.mock('../../api/slots', () => ({
  bulkGenerateSlots: (...args: any[]) => mockBulkGenerateSlots(...args),
}));

const PROFESSIONALS = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Bruno' },
];

describe('SlotBulkGenerateModal', () => {
  afterEach(() => jest.clearAllMocks());

  it('keeps "Gerar horários" disabled until a professional is selected', async () => {
    const { getByText } = await render(
      <SlotBulkGenerateModal
        visible
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await fireEvent.press(getByText('Gerar horários'));
    expect(mockBulkGenerateSlots).not.toHaveBeenCalled();
  });

  it('shows a client-side validation error when interval is outside 15-480', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = await render(
      <SlotBulkGenerateModal
        visible
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await selectProfessional(getByTestId, getByText, 'Ana');
    const intervalInput = getByPlaceholderText('30');
    await fireEvent.changeText(intervalInput, '5');
    await fireEvent.press(getByText('Gerar horários'));

    expect(getByText('O intervalo deve ser entre 15 e 480 minutos.')).toBeTruthy();
    expect(mockBulkGenerateSlots).not.toHaveBeenCalled();
  });

  it('submits with the selected professional/period/date/interval and shows the result', async () => {
    mockBulkGenerateSlots.mockResolvedValue({ created: 12, skipped: 3 });
    const onSuccess = jest.fn();
    const onClose = jest.fn();

    const { getByText, getByTestId } = await render(
      <SlotBulkGenerateModal
        visible
        onClose={onClose}
        onSuccess={onSuccess}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await selectProfessional(getByTestId, getByText, 'Ana');
    await fireEvent.press(getByText('Semana'));
    await fireEvent.press(getByText('Gerar horários'));

    await waitFor(() => {
      expect(mockBulkGenerateSlots).toHaveBeenCalled();
    });
    const [args] = mockBulkGenerateSlots.mock.calls[0];
    expect(args).toEqual(
      expect.objectContaining({
        professional_id: '1',
        period: 'week',
        interval_minutes: 30,
        slug: 'acme',
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Horários gerados. Criados: 12, Ignorados: 3',
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the backend error detail message when the request fails with a detail field', async () => {
    mockBulkGenerateSlots.mockRejectedValue({
      response: {
        status: 400,
        data: { detail: 'Tenant não possui horário de funcionamento configurado. Configure em Configurações > Horário de funcionamento.' },
      },
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByTestId } = await render(
      <SlotBulkGenerateModal
        visible
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await selectProfessional(getByTestId, getByText, 'Ana');
    await fireEvent.press(getByText('Gerar horários'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro',
        'Tenant não possui horário de funcionamento configurado. Configure em Configurações > Horário de funcionamento.'
      );
    });

    alertSpy.mockRestore();
  });

  it('shows a generic error message when the failure has no detail field', async () => {
    mockBulkGenerateSlots.mockRejectedValue({
      response: { status: 400, data: { period: ['Deve ser \'day\', \'week\' ou \'month\'.'] } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByTestId } = await render(
      <SlotBulkGenerateModal
        visible
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await selectProfessional(getByTestId, getByText, 'Ana');
    await fireEvent.press(getByText('Gerar horários'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível gerar os horários.');
    });

    alertSpy.mockRestore();
  });
});
