import React from 'react';
import { Alert } from 'react-native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import VouchersScreen from '../VouchersScreen';

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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

const mockFetchVouchers = jest.fn();
const mockCreateVoucher = jest.fn();
const mockUpdateVoucher = jest.fn();
const mockDeleteVoucher = jest.fn();
const mockAssignVoucher = jest.fn();
const mockSendVoucherEmail = jest.fn();
jest.mock('../../api/vouchers', () => ({
  fetchVouchers: (...args: any[]) => mockFetchVouchers(...args),
  createVoucher: (...args: any[]) => mockCreateVoucher(...args),
  updateVoucher: (...args: any[]) => mockUpdateVoucher(...args),
  deleteVoucher: (...args: any[]) => mockDeleteVoucher(...args),
  assignVoucher: (...args: any[]) => mockAssignVoucher(...args),
  sendVoucherEmail: (...args: any[]) => mockSendVoucherEmail(...args),
}));

const mockFetchAdminServices = jest.fn();
jest.mock('../../api/services', () => ({
  fetchAdminServices: (...args: any[]) => mockFetchAdminServices(...args),
}));

jest.mock('../../components/VoucherFormModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    VoucherFormModal: ({ visible, onSubmit }: any) => {
      if (!visible) return null;
      return (
        <Pressable
          onPress={() =>
            onSubmit({ type: 'percent', value: 10, max_uses: 1, valid_until: null, notes: '', service: null })
          }
        >
          <Text>submit-stub</Text>
        </Pressable>
      );
    },
  };
});

jest.mock('../../components/VoucherAssignModal', () => {
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    VoucherAssignModal: ({ visible, onSubmit }: any) => {
      if (!visible) return null;
      return (
        <Pressable onPress={() => onSubmit({ client: { id: 7, name: 'Maria' }, sendEmail: false })}>
          <Text>assign-submit-stub</Text>
        </Pressable>
      );
    },
  };
});

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

describe('VouchersScreen', () => {
  beforeEach(() => {
    mockFetchAdminServices.mockResolvedValue([]);
    mockLanguage = 'pt';
  });
  afterEach(() => jest.clearAllMocks());

  it('shows English text when language is en', async () => {
    mockLanguage = 'en';
    mockFetchVouchers.mockResolvedValue([]);
    const { findByText } = await render(<VouchersScreen />);
    expect(await findByText('Vouchers')).toBeTruthy();
    expect(await findByText('New voucher')).toBeTruthy();
  });

  it('renders vouchers fetched from the API with the benefit summary', async () => {
    mockFetchVouchers.mockResolvedValue([
      { id: 1, code: 'PROMO10', type: 'percent', value: 10, max_uses: 5, valid_until: null },
    ]);
    const { findByText } = await render(<VouchersScreen />);
    expect(await findByText('PROMO10')).toBeTruthy();
    expect(await findByText('10% de desconto')).toBeTruthy();
  });

  it('shows the free_service benefit with the service name when available', async () => {
    mockFetchAdminServices.mockResolvedValue([{ id: 2, name: 'Corte' }]);
    mockFetchVouchers.mockResolvedValue([
      { id: 1, code: 'FREECUT', type: 'free_service', service: 2, max_uses: 1, valid_until: null },
    ]);
    const { findByText } = await render(<VouchersScreen />);
    expect(await findByText('Serviço grátis: Corte')).toBeTruthy();
  });

  it('shows an expired badge for a voucher whose valid_until is in the past', async () => {
    mockFetchVouchers.mockResolvedValue([
      { id: 1, code: 'OLD10', type: 'percent', value: 10, max_uses: 1, valid_until: '2000-01-01' },
    ]);
    const { findByText } = await render(<VouchersScreen />);
    expect(await findByText('Expirado')).toBeTruthy();
  });

  it('shows an empty state when there are no vouchers', async () => {
    mockFetchVouchers.mockResolvedValue([]);
    const { findByText } = await render(<VouchersScreen />);
    expect(await findByText('Nenhum voucher criado.')).toBeTruthy();
  });

  it('creates a voucher and adds it to the list', async () => {
    mockFetchVouchers.mockResolvedValue([]);
    mockCreateVoucher.mockResolvedValue({ id: 2, code: 'NEW10', type: 'percent', value: 10, max_uses: 1 });
    const { getByText, findByText } = await render(<VouchersScreen />);
    await waitFor(() => expect(mockFetchVouchers).toHaveBeenCalled());
    await fireEvent.press(getByText('Novo voucher'));
    await fireEvent.press(getByText('submit-stub'));
    expect(mockCreateVoucher).toHaveBeenCalledWith({
      slug: 'acme',
      type: 'percent',
      value: 10,
      max_uses: 1,
      valid_until: null,
      notes: '',
      service: null,
    });
    expect(await findByText('NEW10')).toBeTruthy();
  });

  it('removes a voucher after confirmation from the action menu', async () => {
    mockFetchVouchers.mockResolvedValue([
      { id: 1, code: 'PROMO10', type: 'percent', value: 10, max_uses: 1, valid_until: null },
    ]);
    mockDeleteVoucher.mockResolvedValue({});
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const confirmButton = buttons?.find((b: any) => b.text === 'Remover');
      confirmButton?.onPress?.();
    });

    const { findByText, getByTestId } = await render(<VouchersScreen />);
    await findByText('PROMO10');
    fireEvent(getByTestId('voucher-item-1'), 'longPress');

    await fireEvent.press(await findByText('Remover'));

    await waitFor(() => expect(mockDeleteVoucher).toHaveBeenCalledWith(1, { slug: 'acme' }));

    alertSpy.mockRestore();
  });

  it('assigns a voucher to a client from the action menu', async () => {
    mockFetchVouchers.mockResolvedValue([
      { id: 1, code: 'PROMO10', type: 'percent', value: 10, max_uses: 1, valid_until: null },
    ]);
    mockAssignVoucher.mockResolvedValue({ id: 50, client: 7 });

    const { findByText, getByTestId } = await render(<VouchersScreen />);
    await findByText('PROMO10');
    fireEvent(getByTestId('voucher-item-1'), 'longPress');

    await fireEvent.press(await findByText('Atribuir a cliente'));
    await fireEvent.press(await findByText('assign-submit-stub'));

    expect(mockAssignVoucher).toHaveBeenCalledWith(1, 7, { slug: 'acme' });
  });
});
