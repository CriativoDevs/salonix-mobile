import { renderHook, waitFor } from '@testing-library/react-native';
import useProfessionals from '../useProfessionals';

jest.mock('../useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

const mockUseAuth = jest.fn();
jest.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../api/client', () => ({
  get: jest.fn(),
}));

const client = require('../../api/client');

function makeProfessionals() {
  return [
    { id: 1, name: 'Joana', user: 10, email: 'joana@acme.pt' },
    { id: 2, name: 'Pedro', user: 20, email: 'pedro@acme.pt' },
  ];
}

describe('useProfessionals', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches without service_id when serviceId is not provided', async () => {
    mockUseAuth.mockReturnValue({ userInfo: { id: 10, role: 'owner' } });
    client.get.mockResolvedValue({ data: makeProfessionals() });

    const { result } = await renderHook(() => useProfessionals());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(client.get).toHaveBeenCalledWith(
      'public/professionals/',
      expect.objectContaining({
        params: expect.not.objectContaining({ service_id: expect.anything() }),
      })
    );
    expect(result.current.professionals).toHaveLength(2);
  });

  it('fetches with service_id when serviceId is provided', async () => {
    mockUseAuth.mockReturnValue({ userInfo: { id: 10, role: 'owner' } });
    client.get.mockResolvedValue({ data: makeProfessionals() });

    const { result } = await renderHook(() => useProfessionals({ serviceId: 5 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(client.get).toHaveBeenCalledWith(
      'public/professionals/',
      expect.objectContaining({ params: expect.objectContaining({ service_id: 5 }) })
    );
  });

  it('does not fetch when enabled is false', async () => {
    mockUseAuth.mockReturnValue({ userInfo: { id: 10, role: 'owner' } });
    await renderHook(() => useProfessionals({ enabled: false }));
    expect(client.get).not.toHaveBeenCalled();
  });

  it('filters results to the current user when the role is not owner/manager', async () => {
    mockUseAuth.mockReturnValue({ userInfo: { id: 20, role: 'staff', email: 'pedro@acme.pt' } });
    client.get.mockResolvedValue({ data: makeProfessionals() });

    const { result } = await renderHook(() => useProfessionals());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.professionals).toEqual([
      { id: 2, name: 'Pedro', user: 20, email: 'pedro@acme.pt' },
    ]);
  });

  it('does not filter results for owner/manager/superuser', async () => {
    mockUseAuth.mockReturnValue({ userInfo: { id: 999, role: 'owner' } });
    client.get.mockResolvedValue({ data: makeProfessionals() });

    const { result } = await renderHook(() => useProfessionals());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.professionals).toHaveLength(2);
  });
});
