import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ShareRegistrationLinkModal } from '../ShareRegistrationLinkModal';

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

jest.mock('react-native-qrcode-svg', () => {
  const { View } = require('react-native');
  return ({ value }: { value: string }) => <View testID="qr-code" accessibilityLabel={value} />;
});

const mockSetStringAsync = jest.fn();
jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: any[]) => mockSetStringAsync(...args),
}));

jest.mock('../../utils/env', () => ({
  getRegistrationLink: (slug: string) => `https://timelyone.today/join/${slug}`,
}));

describe('ShareRegistrationLinkModal', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the QR code and link for the given slug', async () => {
    const { getByTestId, getByText } = await render(
      <ShareRegistrationLinkModal visible onClose={jest.fn()} slug="acme" />
    );

    expect(getByTestId('qr-code').props.accessibilityLabel).toBe(
      'https://timelyone.today/join/acme'
    );
    expect(getByText('https://timelyone.today/join/acme')).toBeTruthy();
  });

  it('copies the link to the clipboard when "Copiar link" is pressed', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = await render(
      <ShareRegistrationLinkModal visible onClose={jest.fn()} slug="acme" />
    );

    await fireEvent.press(getByText('Copiar link'));

    await waitFor(() => {
      expect(mockSetStringAsync).toHaveBeenCalledWith('https://timelyone.today/join/acme');
    });
  });

  it('calls onClose when "Fechar" is pressed', async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <ShareRegistrationLinkModal visible onClose={onClose} slug="acme" />
    );

    fireEvent.press(getByText('Fechar'));

    expect(onClose).toHaveBeenCalled();
  });
});
