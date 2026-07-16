import {
  normalizeListResponse,
  parseSlotDate,
  formatDateTimeRange,
  buildBookingItem,
} from '../bookingsShared';

describe('normalizeListResponse', () => {
  it('handles array payloads', () => {
    expect(normalizeListResponse([{ id: 1 }, null, { id: 2 }])).toEqual({
      results: [{ id: 1 }, { id: 2 }],
      count: 2,
    });
  });

  it('handles paginated payloads', () => {
    expect(normalizeListResponse({ results: [{ id: 1 }], count: 5 })).toEqual({
      results: [{ id: 1 }],
      count: 5,
    });
  });

  it('handles null/empty payloads', () => {
    expect(normalizeListResponse(null)).toEqual({ results: [], count: 0 });
  });
});

describe('parseSlotDate', () => {
  it('parses ISO strings', () => {
    const date = parseSlotDate('2026-07-06T09:30:00');
    expect(date?.getFullYear()).toBe(2026);
  });

  it('parses strings with a space instead of T', () => {
    const date = parseSlotDate('2026-07-06 09:30:00');
    expect(date?.getHours()).toBe(9);
  });

  it('returns null for invalid input', () => {
    expect(parseSlotDate(null)).toBeNull();
    expect(parseSlotDate('not-a-date')).toBeNull();
  });
});

describe('formatDateTimeRange', () => {
  it('returns "--" when start is missing', () => {
    expect(formatDateTimeRange(null, null)).toBe('--');
  });

  it('formats a valid start/end range', () => {
    const start = new Date('2026-07-06T09:00:00');
    const end = new Date('2026-07-06T09:30:00');
    expect(formatDateTimeRange(start, end)).toContain('09:00');
    expect(formatDateTimeRange(start, end)).toContain('09:30');
  });
});

describe('buildBookingItem', () => {
  it('assembles a BookingItem from resolved pieces', () => {
    const result = buildBookingItem({
      item: { id: 42, service: 1, professional: 2, customer: 3, slot: 4, status: 'scheduled' },
      detail: null,
      slotPayload: { id: 4, start_time: '2026-07-06T09:00:00', end_time: '2026-07-06T09:30:00' },
      customerPayload: { id: 3, name: 'Ana' },
      serviceMap: new Map([['1', { id: 1, name: 'Corte' }]]),
      professionalMap: new Map([['2', { id: 2, name: 'Joana' }]]),
    });

    expect(result.id).toBe('42');
    expect(result.serviceName).toBe('Corte');
    expect(result.professionalName).toBe('Joana');
    expect(result.customerName).toBe('Ana');
    expect(result.start).toBeInstanceOf(Date);
  });

  it('falls back to defaults when data is missing', () => {
    const result = buildBookingItem({
      item: { id: 1 },
      detail: null,
      slotPayload: null,
      customerPayload: null,
      serviceMap: new Map(),
      professionalMap: new Map(),
    });

    expect(result.serviceName).toBe('Servico');
    expect(result.professionalName).toBe('Profissional');
    expect(result.customerName).toBe('Cliente');
    expect(result.start).toBeNull();
  });
});
