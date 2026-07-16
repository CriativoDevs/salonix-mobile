import { renderHook, waitFor } from '@testing-library/react-native';
import useTenantBusinessHours from '../useTenantBusinessHours';

jest.mock('../useTenant', () => ({
  useTenant: () => ({ slug: 'acme' }),
}));

jest.mock('../../api/tenant', () => ({
  fetchTenantBusinessHours: jest.fn(),
}));

const { fetchTenantBusinessHours } = require('../../api/tenant');

describe('useTenantBusinessHours', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns the computed range from the API response', async () => {
    fetchTenantBusinessHours.mockResolvedValue([
      { day_of_week: 1, is_active: true, start_time: '08:00:00', end_time: '19:00:00' },
    ]);

    const { result } = await renderHook(() => useTenantBusinessHours());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.range).toEqual({ startMinutes: 480, endMinutes: 1140 });
  });

  it('falls back to the default range when the fetch fails', async () => {
    fetchTenantBusinessHours.mockRejectedValue(new Error('network error'));

    const { result } = await renderHook(() => useTenantBusinessHours());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.range).toEqual({ startMinutes: 540, endMinutes: 1080 });
  });
});
