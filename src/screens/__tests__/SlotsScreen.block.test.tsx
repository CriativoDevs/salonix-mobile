import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SlotsScreen from '../SlotsScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      surfaceVariant: '#f1f5f9',
      error: '#ef4444',
      warning: '#f59e0b',
      warningBackground: '#fef3c7',
    },
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

const mockFetchSlots = jest.fn();
const mockCreateSlot = jest.fn();
const mockDeleteSlot = jest.fn();
const mockBlockSlot = jest.fn();
const mockUnblockSlot = jest.fn();
jest.mock('../../api/slots', () => ({
  fetchSlots: (...args: any[]) => mockFetchSlots(...args),
  createSlot: (...args: any[]) => mockCreateSlot(...args),
  deleteSlot: (...args: any[]) => mockDeleteSlot(...args),
  blockSlot: (...args: any[]) => mockBlockSlot(...args),
  unblockSlot: (...args: any[]) => mockUnblockSlot(...args),
}));

const mockFetchProfessionals = jest.fn();
jest.mock('../../api/professionals', () => ({
  fetchProfessionals: (...args: any[]) => mockFetchProfessionals(...args),
}));

let mockUseAuthReturn: any = { userInfo: { id: 1, role: 'owner' } };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthReturn,
}));

jest.mock('../../components/SlotBulkGenerateModal', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    SlotBulkGenerateModal: () => <Text>bulk-generate-modal-stub</Text>,
  };
});

jest.mock('../../components/SlotBulkBlockModal', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    SlotBulkBlockModal: () => <Text>bulk-block-modal-stub</Text>,
  };
});

jest.mock('../../components/SlotFormModal', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    SlotFormModal: () => <Text>slot-form-modal-stub</Text>,
  };
});

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

const availableSlot = {
  id: 1,
  professional: 1,
  start_time: '2026-08-01T10:00:00Z',
  end_time: '2026-08-01T11:00:00Z',
  status: 'available',
};

const blockedSlot = {
  id: 2,
  professional: 1,
  start_time: '2026-08-01T12:00:00Z',
  end_time: '2026-08-01T13:00:00Z',
  status: 'blocked',
  blocked_reason: 'Manutenção',
};

const bookedSlot = {
  id: 3,
  professional: 1,
  start_time: '2026-08-01T14:00:00Z',
  end_time: '2026-08-01T15:00:00Z',
  status: 'booked',
};

describe('SlotsScreen - block/unblock actions', () => {
  beforeEach(() => {
    mockFetchProfessionals.mockResolvedValue({ results: [{ id: 1, name: 'Ana' }] });
    mockUseAuthReturn = { userInfo: { id: 1, role: 'owner' } };
    mockLanguage = 'pt';
  });
  afterEach(() => jest.clearAllMocks());

  it('shows "Bloquear horário" and hides "Desbloquear horário" for an available slot', async () => {
    mockFetchSlots.mockResolvedValue({ results: [availableSlot], count: 1 });

    const { getByText, queryByText, findByText } = await render(<SlotsScreen />);
    await findByText('10:00 – 11:00');

    fireEvent(getByText('10:00 – 11:00'), 'longPress');

    await waitFor(() => expect(getByText('Bloquear horário')).toBeTruthy());
    expect(queryByText('Desbloquear horário')).toBeNull();
  });

  it('shows "Desbloquear horário" and hides "Bloquear horário" for a blocked slot, with the reason shown', async () => {
    mockFetchSlots.mockResolvedValue({ results: [blockedSlot], count: 1 });

    const { getByText, queryByText, findByText } = await render(<SlotsScreen />);
    await findByText('12:00 – 13:00');

    expect(getByText('Bloqueado')).toBeTruthy();
    expect(getByText('Manutenção')).toBeTruthy();

    fireEvent(getByText('12:00 – 13:00'), 'longPress');

    await waitFor(() => expect(getByText('Desbloquear horário')).toBeTruthy());
    expect(queryByText('Bloquear horário')).toBeNull();
  });

  it('hides both "Bloquear horário" and "Desbloquear horário" for a booked slot', async () => {
    mockFetchSlots.mockResolvedValue({ results: [bookedSlot], count: 1 });

    const { getByText, queryByText, findByText } = await render(<SlotsScreen />);
    await findByText('14:00 – 15:00');

    expect(getByText('Reservado')).toBeTruthy();

    fireEvent(getByText('14:00 – 15:00'), 'longPress');

    await waitFor(() => expect(getByText('Excluir')).toBeTruthy());
    expect(queryByText('Bloquear horário')).toBeNull();
    expect(queryByText('Desbloquear horário')).toBeNull();
  });

  it('calls unblockSlot and updates the slot when confirmed', async () => {
    mockFetchSlots.mockResolvedValue({ results: [blockedSlot], count: 1 });
    mockUnblockSlot.mockResolvedValue({ id: 2, status: 'available', blocked_reason: null });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons: any) => {
      const confirmButton = buttons.find((b: any) => b.text === 'Desbloquear');
      confirmButton?.onPress?.();
    });

    const { getByText, findByText } = await render(<SlotsScreen />);
    await findByText('12:00 – 13:00');

    fireEvent(getByText('12:00 – 13:00'), 'longPress');
    await waitFor(() => expect(getByText('Desbloquear horário')).toBeTruthy());
    fireEvent.press(getByText('Desbloquear horário'));

    await waitFor(() => expect(mockUnblockSlot).toHaveBeenCalledWith(2, { slug: 'acme' }));

    alertSpy.mockRestore();
  });

  it('shows a lock icon button on available/blocked slots and hides it on booked, triggering block/unblock directly', async () => {
    mockFetchSlots.mockResolvedValue({
      results: [availableSlot, blockedSlot, bookedSlot],
      count: 3,
    });
    mockUnblockSlot.mockResolvedValue({ id: 2, status: 'available', blocked_reason: null });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons: any) => {
      const confirmButton = buttons.find((b: any) => b.text === 'Desbloquear');
      confirmButton?.onPress?.();
    });

    const { getByTestId, queryByTestId, findByText } = await render(<SlotsScreen />);
    await findByText('10:00 – 11:00');

    expect(getByTestId('slot-icon-block-1')).toBeTruthy();
    expect(getByTestId('slot-icon-unblock-2')).toBeTruthy();
    expect(queryByTestId('slot-icon-block-3')).toBeNull();
    expect(queryByTestId('slot-icon-unblock-3')).toBeNull();

    fireEvent.press(getByTestId('slot-icon-unblock-2'));

    await waitFor(() => expect(mockUnblockSlot).toHaveBeenCalledWith(2, { slug: 'acme' }));

    alertSpy.mockRestore();
  });
});
