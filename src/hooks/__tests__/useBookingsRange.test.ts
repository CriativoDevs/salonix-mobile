import { renderHook, waitFor } from '@testing-library/react-native';
import useBookingsRange from '../useBookingsRange';

jest.mock('../useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

jest.mock('../../api/client', () => ({
  get: jest.fn(),
}));

const client = require('../../api/client');

describe('useBookingsRange', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches every page in the range and builds booking items', async () => {
    client.get.mockImplementation((url: string, config: any) => {
      if (url === 'public/services/') return Promise.resolve({ data: [] });
      if (url === 'professionals/') return Promise.resolve({ data: [] });
      if (url === 'salon/customers/') return Promise.resolve({ data: { results: [] } });
      if (url === 'salon/appointments/') {
        const offset = config?.params?.offset || 0;
        if (offset === 0) {
          return Promise.resolve({
            data: {
              count: 2,
              results: [
                { id: 1, service: 1, professional: 1, customer: 1, slot: 1, status: 'scheduled' },
              ],
            },
          });
        }
        return Promise.resolve({
          data: {
            count: 2,
            results: [
              { id: 2, service: 1, professional: 1, customer: 1, slot: 2, status: 'scheduled' },
            ],
          },
        });
      }
      if (url.startsWith('appointments/')) return Promise.resolve({ data: null });
      if (url.startsWith('slots/')) {
        return Promise.resolve({
          data: { id: 1, start_time: '2026-07-06T09:00:00', end_time: '2026-07-06T09:30:00' },
        });
      }
      return Promise.resolve({ data: null });
    });

    const { result } = await renderHook(() => useBookingsRange('2026-07-06', '2026-07-12'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.appointments).toHaveLength(2);
  });

  it('does not fetch when the range is incomplete', async () => {
    await renderHook(() => useBookingsRange(null, null));
    expect(client.get).not.toHaveBeenCalled();
  });
});
