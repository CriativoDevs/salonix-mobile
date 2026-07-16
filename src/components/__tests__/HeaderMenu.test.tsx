import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HeaderMenu } from '../HeaderMenu';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      surface: '#f8fafc',
      border: '#ccc',
      error: '#ef4444',
    },
  }),
}));

jest.mock('../ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

describe('HeaderMenu', () => {
  afterEach(() => jest.clearAllMocks());

  it('calls onNavigateToAccount when "Conta" is pressed', async () => {
    const onNavigateToAccount = jest.fn();
    const { getByText } = await render(
      <HeaderMenu visible onClose={jest.fn()} onLogout={jest.fn()} onNavigateToAccount={onNavigateToAccount} />
    );

    await fireEvent.press(getByText('Conta'));

    expect(onNavigateToAccount).toHaveBeenCalled();
  });

  it('calls onNavigateToSettings when "Definições" is pressed', async () => {
    const onNavigateToSettings = jest.fn();
    const { getByText } = await render(
      <HeaderMenu visible onClose={jest.fn()} onLogout={jest.fn()} onNavigateToSettings={onNavigateToSettings} />
    );

    await fireEvent.press(getByText('Definições'));

    expect(onNavigateToSettings).toHaveBeenCalled();
  });

  it('shows a confirmation before calling onLogout when "Sair" is pressed', async () => {
    const onLogout = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons: any) => {
      const confirmButton = buttons?.find((b: any) => b.text === 'Sair');
      confirmButton?.onPress?.();
    });

    const { getByText } = await render(
      <HeaderMenu visible onClose={jest.fn()} onLogout={onLogout} />
    );

    await fireEvent.press(getByText('Sair'));

    await waitFor(() => expect(onLogout).toHaveBeenCalled());

    alertSpy.mockRestore();
  });
});
