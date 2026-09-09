import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import RoadmapScreen from '../RoadmapScreen';

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

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt' }),
}));

const mockFetchRoadmap = jest.fn();
jest.mock('../../api/cms', () => ({
  fetchRoadmap: (...args: any[]) => mockFetchRoadmap(...args),
}));

describe('RoadmapScreen', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockFetchRoadmap.mockReset();
  });
  afterEach(() => jest.clearAllMocks());

  it('groups and renders roadmap items by status', async () => {
    mockFetchRoadmap.mockResolvedValue([
      { title: 'Exportar relatórios', description: 'Exportação em CSV', status: 'delivered', order: 1 },
      { title: 'App mobile para clientes', description: '', status: 'in_progress', order: 2 },
      { title: 'Integração WhatsApp', description: 'Notificações via WhatsApp', status: 'planned', order: 3 },
    ]);

    const { getByText } = await render(<RoadmapScreen />);

    await waitFor(() => expect(getByText('Exportar relatórios')).toBeTruthy());
    expect(getByText('Entregue')).toBeTruthy();
    expect(getByText('App mobile para clientes')).toBeTruthy();
    expect(getByText('Em progresso')).toBeTruthy();
    expect(getByText('Integração WhatsApp')).toBeTruthy();
    expect(getByText('Planeado')).toBeTruthy();
  });

  it('shows an empty state when there are no roadmap items', async () => {
    mockFetchRoadmap.mockResolvedValue([]);

    const { getByText } = await render(<RoadmapScreen />);

    await waitFor(() => expect(getByText('Nenhum item no roadmap de momento.')).toBeTruthy());
  });

  it('shows an error message when the request fails', async () => {
    mockFetchRoadmap.mockRejectedValue(new Error('network error'));

    const { getByText } = await render(<RoadmapScreen />);

    await waitFor(() => expect(getByText('Não foi possível carregar o roadmap.')).toBeTruthy());
  });
});
