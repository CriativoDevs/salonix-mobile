import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SlotBulkBlockModal } from '../SlotBulkBlockModal';

// Mesma convenção do SlotBulkGenerateModal: o Select é trigger + Modal com lista,
// então a seleção simula abrir o trigger e tocar na opção pretendida.
async function selectProfessional(getByTestId: any, getByText: any, name: string) {
  await fireEvent.press(getByTestId('bulk-block-professional-picker'));
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

const mockBulkBlockSlots = jest.fn();
jest.mock('../../api/slots', () => ({
  bulkBlockSlots: (...args: any[]) => mockBulkBlockSlots(...args),
}));

const PROFESSIONALS = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Bruno' },
];

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

beforeEach(() => {
  mockLanguage = 'pt';
});

describe('SlotBulkBlockModal - language', () => {
  it('shows English text when language is en', async () => {
    mockLanguage = 'en';
    const { getByText } = await render(
      <SlotBulkBlockModal
        visible
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );
    expect(getByText('Bulk Block Slots')).toBeTruthy();
    expect(getByText('Block slots')).toBeTruthy();
  });
});

describe('SlotBulkBlockModal', () => {
  afterEach(() => jest.clearAllMocks());

  it('keeps "Bloquear horários" disabled until a professional is selected', async () => {
    const { getByText } = await render(
      <SlotBulkBlockModal
        visible
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await fireEvent.press(getByText('Bloquear horários'));
    expect(mockBulkBlockSlots).not.toHaveBeenCalled();
  });

  it('shows a client-side validation error when interval is outside 15-480', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = await render(
      <SlotBulkBlockModal
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
    await fireEvent.press(getByText('Bloquear horários'));

    expect(getByText('O intervalo deve ser entre 15 e 480 minutos.')).toBeTruthy();
    expect(mockBulkBlockSlots).not.toHaveBeenCalled();
  });

  it('submits with the selected professional/dates/times/interval/reason and shows the result including skipped_booked', async () => {
    mockBulkBlockSlots.mockResolvedValue({ blocked: 7, created: 4, skipped_booked: 2 });
    const onSuccess = jest.fn();
    const onClose = jest.fn();

    const { getByText, getByTestId, getByPlaceholderText } = await render(
      <SlotBulkBlockModal
        visible
        onClose={onClose}
        onSuccess={onSuccess}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await selectProfessional(getByTestId, getByText, 'Ana');
    await fireEvent.changeText(getByPlaceholderText('Ex: Férias, manutenção...'), 'Férias');
    await fireEvent.press(getByText('Bloquear horários'));

    await waitFor(() => {
      expect(mockBulkBlockSlots).toHaveBeenCalled();
    });
    const [args] = mockBulkBlockSlots.mock.calls[0];
    expect(args).toEqual(
      expect.objectContaining({
        professional_id: '1',
        interval_minutes: 30,
        reason: 'Férias',
        slug: 'acme',
      })
    );
    expect(args.date_from).toBeTruthy();
    expect(args.date_to).toBeTruthy();
    expect(args.start_time).toMatch(/^\d{2}:\d{2}$/);
    expect(args.end_time).toMatch(/^\d{2}:\d{2}$/);

    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Horários bloqueados. Bloqueados: 7, Criados: 4, Já reservados (mantidos): 2',
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the backend error detail message when the request fails with a detail field', async () => {
    mockBulkBlockSlots.mockRejectedValue({
      response: {
        status: 400,
        data: { detail: 'O intervalo de datas não pode exceder 92 dias.' },
      },
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByTestId } = await render(
      <SlotBulkBlockModal
        visible
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await selectProfessional(getByTestId, getByText, 'Ana');
    await fireEvent.press(getByText('Bloquear horários'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro',
        'O intervalo de datas não pode exceder 92 dias.'
      );
    });

    alertSpy.mockRestore();
  });

  it('shows a generic error message when the failure has no detail field', async () => {
    mockBulkBlockSlots.mockRejectedValue({
      response: { status: 400, data: { professional_id: ['Obrigatório.'] } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByTestId } = await render(
      <SlotBulkBlockModal
        visible
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        professionals={PROFESSIONALS}
        slug="acme"
      />
    );

    await selectProfessional(getByTestId, getByText, 'Ana');
    await fireEvent.press(getByText('Bloquear horários'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível bloquear os horários.');
    });

    alertSpy.mockRestore();
  });
});
