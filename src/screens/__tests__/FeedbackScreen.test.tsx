import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FeedbackScreen from '../FeedbackScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      textTertiary: '#999',
      border: '#ccc',
      brandPrimary: '#3b82f6',
      background: '#fff',
      surface: '#f8fafc',
      surfaceVariant: '#eee',
      success: '#22c55e',
      error: '#ef4444',
      errorBackground: '#fee2e2',
    },
  }),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt' }),
}));

const mockShowToast = jest.fn();
jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockSubmitFeedback = jest.fn();
jest.mock('../../api/feedback', () => ({
  submitFeedback: (...args: any[]) => mockSubmitFeedback(...args),
}));

describe('FeedbackScreen', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockShowToast.mockClear();
    mockSubmitFeedback.mockReset();
  });
  afterEach(() => jest.clearAllMocks());

  it('shows validation errors when submitting an empty form', async () => {
    const { getByText } = await render(<FeedbackScreen />);

    await fireEvent.press(getByText('Enviar feedback'));

    expect(getByText('Selecione uma avaliação de 1 a 5.')).toBeTruthy();
    expect(getByText('Selecione uma categoria.')).toBeTruthy();
    expect(getByText('Escreva uma mensagem.')).toBeTruthy();
    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it('requires a custom category when "Outro" is selected', async () => {
    const { getByText, getByTestId } = await render(<FeedbackScreen />);

    await fireEvent.press(getByTestId('feedback-rating-5'));
    await fireEvent.press(getByTestId('feedback-category-other'));
    await act(async () => {
      fireEvent.changeText(getByTestId('feedback-message-input'), 'Mensagem de teste');
    });

    await fireEvent.press(getByText('Enviar feedback'));

    expect(getByText('Especifique a categoria.')).toBeTruthy();
    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it('submits the form and shows the thank-you state (happy path)', async () => {
    mockSubmitFeedback.mockResolvedValue({ id: 1 });

    const { getByText, getByTestId } = await render(<FeedbackScreen />);

    await fireEvent.press(getByTestId('feedback-rating-4'));
    await fireEvent.press(getByTestId('feedback-category-app'));
    await act(async () => {
      fireEvent.changeText(getByTestId('feedback-message-input'), 'Está a correr muito bem!');
    });

    await fireEvent.press(getByText('Enviar feedback'));

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith(
        {
          category: 'app',
          custom_category: undefined,
          rating: 4,
          message: 'Está a correr muito bem!',
          anonymous: false,
        },
        { slug: 'acme' }
      );
    });

    await waitFor(() => expect(getByText('Obrigado pelo feedback!')).toBeTruthy());
  });

  it('shows an inline error and a toast when the API call fails', async () => {
    mockSubmitFeedback.mockRejectedValue({
      response: { status: 400, data: { detail: 'Captcha inválido.' } },
    });

    const { getByText, getByTestId } = await render(<FeedbackScreen />);

    await fireEvent.press(getByTestId('feedback-rating-3'));
    await fireEvent.press(getByTestId('feedback-category-praise'));
    await act(async () => {
      fireEvent.changeText(getByTestId('feedback-message-input'), 'Parabéns pela plataforma');
    });

    await fireEvent.press(getByText('Enviar feedback'));

    await waitFor(() => expect(getByText('Captcha inválido.')).toBeTruthy());
    expect(mockShowToast).toHaveBeenCalledWith({ type: 'error', message: 'Captcha inválido.' });
  });

  it('toggles the anonymous option', async () => {
    mockSubmitFeedback.mockResolvedValue({ id: 2 });

    const { getByText, getByTestId } = await render(<FeedbackScreen />);

    await fireEvent.press(getByTestId('feedback-rating-5'));
    await fireEvent.press(getByTestId('feedback-category-support'));
    await act(async () => {
      fireEvent.changeText(getByTestId('feedback-message-input'), 'Suporte excelente');
    });
    await fireEvent.press(getByTestId('feedback-anonymous-toggle'));

    await fireEvent.press(getByText('Enviar feedback'));

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ anonymous: true }),
        { slug: 'acme' }
      );
    });
  });
});
