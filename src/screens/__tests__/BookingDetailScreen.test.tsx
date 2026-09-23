import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import BookingDetailScreen from '../BookingDetailScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      error: '#ef4444',
      success: '#22c55e',
      successBackground: '#dcfce7',
      info: '#0ea5e9',
      infoBackground: '#e0f2fe',
      errorBackground: '#fee2e2',
    },
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme', tenant: { name: 'Salão Exemplo' } }),
}));

jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

const mockFetchAppointmentDetail = jest.fn();
jest.mock('../../api/bookings', () => ({
  fetchAppointmentDetail: (...args: any[]) => mockFetchAppointmentDetail(...args),
  cancelAppointment: jest.fn(),
  updateAppointment: jest.fn(),
}));

function makeNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn(), popToTop: jest.fn() };
}

const scheduledAppointment = {
  id: 1,
  status: 'scheduled',
  customer: { name: 'Maria', phone_number: '912345678' },
  service: { name: 'Corte de cabelo', duration_minutes: 30, price_eur: '20.00' },
  professional: { name: 'Ana' },
  slot: { start_time: '2026-10-01T15:30:00Z', end_time: '2026-10-01T16:00:00Z' },
};

let mockLanguage = 'pt';
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

describe('BookingDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    mockLanguage = 'pt';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows English text when language is en', async () => {
    mockLanguage = 'en';
    mockFetchAppointmentDetail.mockResolvedValue(scheduledAppointment);

    const { findByText } = await render(
      <BookingDetailScreen navigation={makeNavigation()} route={{ params: { id: 1 } }} />
    );

    expect(await findByText('Mark as Completed')).toBeTruthy();
    expect(await findByText('Cancel Appointment')).toBeTruthy();
  });

  it('shows the "Enviar lembrete via WhatsApp" button when the customer has a phone number', async () => {
    mockFetchAppointmentDetail.mockResolvedValue(scheduledAppointment);

    const { findByRole } = await render(
      <BookingDetailScreen navigation={makeNavigation()} route={{ params: { id: 1 } }} />
    );

    expect(await findByRole('button', { name: 'Enviar lembrete via WhatsApp' })).toBeTruthy();
  });

  it('does not show the WhatsApp button when the customer has no phone number', async () => {
    mockFetchAppointmentDetail.mockResolvedValue({
      ...scheduledAppointment,
      customer: { name: 'Maria', phone_number: '' },
    });

    const { findByText, queryByRole } = await render(
      <BookingDetailScreen navigation={makeNavigation()} route={{ params: { id: 1 } }} />
    );

    await findByText('Maria');
    expect(queryByRole('button', { name: 'Enviar lembrete via WhatsApp' })).toBeNull();
  });

  it('does not show the WhatsApp reminder button for cancelled appointments', async () => {
    mockFetchAppointmentDetail.mockResolvedValue({
      ...scheduledAppointment,
      status: 'cancelled',
    });

    const { findByText, queryByRole } = await render(
      <BookingDetailScreen navigation={makeNavigation()} route={{ params: { id: 1 } }} />
    );

    await findByText('Maria');
    expect(queryByRole('button', { name: 'Enviar lembrete via WhatsApp' })).toBeNull();
  });
});
