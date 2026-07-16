export type BookingItem = {
  id: string;
  status: string;
  rangeLabel: string;
  start: Date | null;
  end: Date | null;
  customerId: string | number | null;
  customerName: string;
  serviceId: string | number | null;
  serviceName: string;
  professionalId: string | number | null;
  professionalName: string;
  slotId: string | number | null;
};

export function normalizeListResponse(payload: any): { results: any[]; count: number } {
  if (!payload) {
    return { results: [], count: 0 };
  }

  if (Array.isArray(payload)) {
    const list = payload.filter(Boolean);
    return { results: list, count: list.length };
  }

  const results = Array.isArray(payload.results) ? payload.results.filter(Boolean) : [];

  const count =
    typeof payload.count === 'number' && Number.isFinite(payload.count)
      ? payload.count
      : results.length;

  return { results, count };
}

export function parseSlotDate(raw: any): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === 'number') {
    const numericDate = new Date(raw);
    return Number.isNaN(numericDate.getTime()) ? null : numericDate;
  }
  if (typeof raw === 'string') {
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  try {
    const candidate = new Date(raw);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  } catch {
    return null;
  }
}

export function formatDateTimeRange(start: Date | null, end: Date | null): string {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
    return '--';
  }
  const endValid = end instanceof Date && !Number.isNaN(end.getTime()) ? end : null;
  try {
    const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const datePart = dateFormatter.format(start).replace('.', '');
    const startTime = timeFormatter.format(start);
    const endTime = endValid ? timeFormatter.format(endValid) : null;
    return endTime ? `${datePart} ${startTime} - ${endTime}` : `${datePart} ${startTime}`;
  } catch {
    const base = start.toISOString?.() || String(start);
    const fallback = endValid?.toISOString?.() || (endValid ? String(endValid) : null);
    return fallback ? `${base} - ${fallback}` : base;
  }
}

export function buildBookingItem(params: {
  item: any;
  detail: any;
  slotPayload: any;
  customerPayload: any;
  serviceMap: Map<string, any>;
  professionalMap: Map<string, any>;
}): BookingItem {
  const { item, detail, slotPayload, customerPayload, serviceMap, professionalMap } = params;

  const serviceName =
    detail?.service?.name ||
    serviceMap.get(String(item.service))?.name ||
    (typeof item.service === 'object' ? item.service?.name : '') ||
    'Servico';

  const professionalName =
    detail?.professional?.name ||
    professionalMap.get(String(item.professional))?.name ||
    (typeof item.professional === 'object' ? item.professional?.name : '') ||
    'Profissional';

  const slotStart =
    slotPayload?.start_time ||
    detail?.slot_start ||
    item?.slot_start ||
    item?.start_time ||
    item?.slot_time ||
    null;
  const slotEnd =
    slotPayload?.end_time || detail?.slot_end || item?.slot_end || item?.end_time || null;

  const startDate = parseSlotDate(slotStart);
  const endDate = parseSlotDate(slotEnd);

  const rangeLabel = formatDateTimeRange(startDate, endDate);

  return {
    id: String(item.id),
    status: detail?.status || item.status || 'scheduled',
    rangeLabel,
    start: startDate,
    end: endDate,
    customerId: customerPayload?.id ?? item.customer ?? null,
    customerName:
      customerPayload?.name || detail?.client_username || item?.client_name || 'Cliente',
    serviceId: detail?.service?.id ?? item.service ?? null,
    serviceName,
    professionalId: detail?.professional?.id ?? item.professional ?? null,
    professionalName,
    slotId: slotPayload?.id ?? item.slot ?? null,
  };
}
