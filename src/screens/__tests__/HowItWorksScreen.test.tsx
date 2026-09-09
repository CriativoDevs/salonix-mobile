import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HowItWorksScreen from '../HowItWorksScreen';

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

const mockFetchCmsPages = jest.fn();
const mockFetchCmsPage = jest.fn();
jest.mock('../../api/cms', () => ({
  fetchCmsPages: (...args: any[]) => mockFetchCmsPages(...args),
  fetchCmsPage: (...args: any[]) => mockFetchCmsPage(...args),
}));

const PAGES = [
  { slug: 'agendamentos', title: '2. Como criar agendamentos', summary: 'Aprenda a agendar clientes.' },
  { slug: 'introducao', title: '1. Introdução', summary: 'Visão geral da plataforma.' },
];

describe('HowItWorksScreen', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockFetchCmsPages.mockReset();
    mockFetchCmsPage.mockReset();
    mockFetchCmsPages.mockResolvedValue(PAGES);
  });
  afterEach(() => jest.clearAllMocks());

  it('lists pages ordered by the number in the title, not by API order', async () => {
    const { getAllByText, getByText } = await render(<HowItWorksScreen />);

    await waitFor(() => expect(getByText('1. Introdução')).toBeTruthy());
    const titles = getAllByText(/^\d\./).map((node: any) => node.props.children);
    expect(titles).toEqual(['1. Introdução', '2. Como criar agendamentos']);
  });

  it('expands a page and loads its content on demand', async () => {
    mockFetchCmsPage.mockResolvedValue({
      slug: 'introducao',
      title: '1. Introdução',
      content: 'Conteúdo completo da página de introdução.',
    });

    const { getByText } = await render(<HowItWorksScreen />);
    await waitFor(() => expect(getByText('1. Introdução')).toBeTruthy());

    await fireEvent.press(getByText('1. Introdução'));

    await waitFor(() => expect(mockFetchCmsPage).toHaveBeenCalledWith('introducao', { slug: 'acme' }));
    await waitFor(() => expect(getByText('Conteúdo completo da página de introdução.')).toBeTruthy());
  });

  it('shows an empty state when there are no pages', async () => {
    mockFetchCmsPages.mockResolvedValue([]);

    const { getByText } = await render(<HowItWorksScreen />);

    await waitFor(() => expect(getByText('Nenhum conteúdo disponível de momento.')).toBeTruthy());
  });

  it('shows an error message when the list request fails', async () => {
    mockFetchCmsPages.mockRejectedValue(new Error('network error'));

    const { getByText } = await render(<HowItWorksScreen />);

    await waitFor(() => expect(getByText('Não foi possível carregar o conteúdo.')).toBeTruthy());
  });
});
