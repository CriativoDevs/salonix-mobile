import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SlotBulkGenerateModal } from '../SlotBulkGenerateModal';

// Nota: `@react-native-picker/picker` não responde a `fireEvent(el, 'valueChange', ...)`
// neste ambiente de testes — o host component subjacente (RNCPicker/PickerIOS) expõe
// um prop `onChange` que espera `{ nativeEvent: { newValue, newIndex } }`, e o
// `fireEvent` do RNTL não mapeia corretamente para este evento customizado. A forma
// confirmada e fiável de simular a seleção é invocar `onChange` diretamente, dentro de
// `act()`.
async function selectProfessional(getByTestId: any, value: string, index = 0) {
  await act(async () => {
    getByTestId('bulk-generate-professional-picker').props.onChange({
      nativeEvent: { newValue: value, newIndex: index },
    });
  });
}

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      surface: '#f8fafc',
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

    await selectProfessional(getByTestId, '1', 0);
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
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByTestId } = await render(
      <SlotBulkGenerateModal
        visible
        onClose={onClose}
        onSuccess={onSuccess}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await selectProfessional(getByTestId, '1', 0);
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
    expect(alertSpy).toHaveBeenCalledWith('Horários gerados', 'Criados: 12, Ignorados: 3');
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    alertSpy.mockRestore();
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

    await selectProfessional(getByTestId, '1', 0);
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

    await selectProfessional(getByTestId, '1', 0);
    await fireEvent.press(getByText('Gerar horários'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível gerar os horários.');
    });

    alertSpy.mockRestore();
  });
});
