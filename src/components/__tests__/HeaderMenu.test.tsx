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

jest.mock('../LanguageToggle', () => {
  const { Pressable, Text } = require('react-native');
  return {
    LanguageToggle: ({ onToggle, language }: any) => (
      <Pressable onPress={onToggle} accessibilityLabel="toggle-language">
        <Text>{language}</Text>
      </Pressable>
    ),
  };
});

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

  // Language toggle está desativado (comentado no HeaderMenu) até a auditoria
  // de i18n do app inteiro (issue MOB-I18N-01) — a maioria das telas ainda
  // ignora `language` e mostra texto fixo em pt, então o toggle não teria
  // efeito visível hoje. Reativar este teste junto com o toggle.
  it('does not render the language toggle even when onToggleLanguage is provided (disabled pending i18n audit)', async () => {
    const { queryByLabelText } = await render(
      <HeaderMenu
        visible
        onClose={jest.fn()}
        onLogout={jest.fn()}
        language="pt"
        onToggleLanguage={jest.fn()}
      />
    );

    expect(queryByLabelText('toggle-language')).toBeNull();
  });

  it('does not render the language toggle when onToggleLanguage is not provided', async () => {
    const { queryByLabelText } = await render(
      <HeaderMenu visible onClose={jest.fn()} onLogout={jest.fn()} />
    );

    expect(queryByLabelText('toggle-language')).toBeNull();
  });
});
