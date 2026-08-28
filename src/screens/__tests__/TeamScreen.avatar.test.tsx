import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
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

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ userInfo: { id: 1, role: 'owner' } }),
}));

const mockFetchProfessionals = jest.fn();
jest.mock('../../api/professionals', () => ({
  fetchProfessionals: (...args: any[]) => mockFetchProfessionals(...args),
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

describe('TeamScreen - avatar', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders an Avatar with the photo URL resolved for a professional whose staff member has a photo', async () => {
    mockFetchStaffMembers.mockResolvedValue([
      { id: 5, first_name: 'Ana', last_name: 'Souza', email: 'ana@acme.pt', status: 'active', role: 'collaborator', photo: '/media/staff_photos/ana.jpg' },
    ]);
    mockFetchProfessionals.mockResolvedValue({
      results: [{ id: 100, staff_member: 5, name: 'Ana Souza', is_active: true }],
      count: 1,
    });

    const { getByTestId } = await render(<TeamScreen />);

    await waitFor(() => {
      expect(getByTestId('team-avatar-100').props.source.uri).toContain('/media/staff_photos/ana.jpg');
    });
  });

  it('renders an Avatar fallback (no source) when the staff member has no photo', async () => {
    mockFetchStaffMembers.mockResolvedValue([
      { id: 6, first_name: 'Bruno', last_name: 'Lima', email: 'bruno@acme.pt', status: 'active', role: 'collaborator', photo: null },
    ]);
    mockFetchProfessionals.mockResolvedValue({
      results: [{ id: 101, staff_member: 6, name: 'Bruno Lima', is_active: true }],
      count: 1,
    });

    const { getByTestId } = await render(<TeamScreen />);

    await waitFor(() => {
      expect(getByTestId('team-avatar-101').props.source).toBeUndefined();
    });
  });
});
