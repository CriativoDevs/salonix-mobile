import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import TeamScreen from '../TeamScreen';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#000',
      textSecondary: '#666',
      brandPrimary: '#3b82f6',
      background: '#fff',
      border: '#ccc',
      surfaceVariant: '#eee',
    },
  }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

let mockUserInfo: any = { id: 1, role: 'owner', email: 'owner@acme.pt' };
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ userInfo: mockUserInfo }),
}));

const mockShowToast = jest.fn();
jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockFetchProfessionals = jest.fn();
const mockCreateProfessional = jest.fn();
jest.mock('../../api/professionals', () => ({
  fetchProfessionals: (...args: any[]) => mockFetchProfessionals(...args),
  createProfessional: (...args: any[]) => mockCreateProfessional(...args),
  updateProfessional: jest.fn(),
  deleteProfessional: jest.fn(),
}));

const mockFetchStaffMembers = jest.fn();
jest.mock('../../api/staff', () => ({
  fetchStaffMembers: (...args: any[]) => mockFetchStaffMembers(...args),
  inviteStaffMember: jest.fn(),
  exportStaffCSV: jest.fn(),
  updateStaffContact: jest.fn(),
}));

const mockFetchServices = jest.fn();
jest.mock('../../api/services', () => ({
  fetchServices: (...args: any[]) => mockFetchServices(...args),
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'pt', setLanguage: jest.fn() }),
}));

describe('TeamScreen - become professional shortcut', () => {
  afterEach(() => jest.clearAllMocks());
  beforeEach(() => {
    mockUserInfo = { id: 1, role: 'owner', email: 'owner@acme.pt' };
  });

  it('shows the shortcut when the owner has no linked Professional', async () => {
    mockFetchStaffMembers.mockResolvedValue([
      { id: 10, first_name: 'Dona', last_name: 'Maria', email: 'owner@acme.pt', status: 'active', role: 'owner' },
    ]);
    mockFetchProfessionals.mockResolvedValue({ results: [], count: 0 });

    const { getByTestId, getByText } = await render(<TeamScreen />);

    await waitFor(() => expect(getByTestId('become-professional-button')).toBeTruthy());
    expect(getByText('Torne-se profissional')).toBeTruthy();
  });

  it('hides the shortcut when the owner already has a linked Professional', async () => {
    mockFetchStaffMembers.mockResolvedValue([
      { id: 10, first_name: 'Dona', last_name: 'Maria', email: 'owner@acme.pt', status: 'active', role: 'owner' },
    ]);
    mockFetchProfessionals.mockResolvedValue({
      results: [{ id: 200, staff_member: 10, name: 'Dona Maria', is_active: true }],
      count: 1,
    });

    const { queryByTestId } = await render(<TeamScreen />);

    await waitFor(() => expect(mockFetchStaffMembers).toHaveBeenCalled());
    expect(queryByTestId('become-professional-button')).toBeNull();
  });

  it('hides the shortcut for non-owner roles', async () => {
    mockUserInfo = { id: 2, role: 'collaborator', email: 'collab@acme.pt' };
    mockFetchStaffMembers.mockResolvedValue([
      { id: 11, first_name: 'Colab', last_name: 'Orador', email: 'collab@acme.pt', status: 'active', role: 'collaborator' },
    ]);
    mockFetchProfessionals.mockResolvedValue({ results: [], count: 0 });

    const { queryByTestId } = await render(<TeamScreen />);

    await waitFor(() => expect(mockFetchStaffMembers).toHaveBeenCalled());
    expect(queryByTestId('become-professional-button')).toBeNull();
  });

  it('creates the Professional with all tenant services linked in a single tap', async () => {
    mockFetchStaffMembers.mockResolvedValue([
      { id: 10, first_name: 'Dona', last_name: 'Maria', email: 'owner@acme.pt', status: 'active', role: 'owner' },
    ]);
    mockFetchProfessionals.mockResolvedValue({ results: [], count: 0 });
    mockFetchServices.mockResolvedValue({ results: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    mockCreateProfessional.mockResolvedValue({ id: 999, staff_member: 10 });

    const { getByTestId } = await render(<TeamScreen />);

    await waitFor(() => expect(getByTestId('become-professional-button')).toBeTruthy());
    fireEvent.press(getByTestId('become-professional-button'));

    await waitFor(() => expect(mockCreateProfessional).toHaveBeenCalledTimes(1));
    expect(mockCreateProfessional).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Dona Maria',
        staff_member: 10,
        service_ids: [1, 2, 3],
        is_active: true,
        slug: 'acme',
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' })
    );
  });
});
