import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import client from '../api/client';
import { useTenant } from '../hooks/useTenant';

type BookingFilters = {
  status?: string;
  dateFrom?: string | Date | null;
  dateTo?: string | Date | null;
  customerId?: string | number | null;
  limit?: number;
  ordering?: string;
};

type BookingItem = {
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

type UseBookingsResult = {
  appointments: BookingItem[];
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
  error: unknown;
  customers: any[];
  services: any[];
  professionals: any[];
  refetch: () => void;
  loadMore: () => void;
};

const normalizeListResponse = (payload: any) => {
  if (!payload) {
    return { results: [] as any[], count: 0 };
  }

  if (Array.isArray(payload)) {
    const list = payload.filter(Boolean);
    return { results: list, count: list.length };
  }

  const results = Array.isArray(payload.results)
    ? payload.results.filter(Boolean)
    : [];

  const count =
    typeof payload.count === 'number' && Number.isFinite(payload.count)
      ? payload.count
      : results.length;

  return { ...payload, results, count };
};

const parseSlotDate = (raw: any): Date | null => {
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
};

const toApiDate = (d: Date) => d.toISOString().replace('Z', '+00:00');

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const normalizeDateParam = (value: string | Date | null | undefined, edge: 'start' | 'end') => {
  if (!value) return undefined;
  if (value instanceof Date) {
    const base = edge === 'start' ? startOfDay(value) : endOfDay(value);
    return toApiDate(base);
  }
  return value;
};

const formatDateTimeRange = (start: Date | null, end: Date | null) => {
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
};

export default function useBookings(filters: BookingFilters = {}): UseBookingsResult {
  const { slug } = useTenant();
  const [appointments, setAppointments] = useState<BookingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [lookupLoading, setLookupLoading] = useState(false);

  const slotCacheRef = useRef<Map<string | number, any>>(new Map());
  const customerCacheRef = useRef<Map<string | number, any>>(new Map());

  const limit = typeof filters.limit === 'number' ? filters.limit : 20;
  const ordering = typeof filters.ordering === 'string' && filters.ordering.trim()
    ? filters.ordering.trim()
    : '-created_at';

  const normalizedDateFrom = useMemo(
    () => normalizeDateParam(filters.dateFrom, 'start'),
    [filters.dateFrom],
  );
  const normalizedDateTo = useMemo(
    () => normalizeDateParam(filters.dateTo, 'end'),
    [filters.dateTo],
  );

  const reqConfig = useMemo(() => {
    const headers: Record<string, string> = {};
    const params: Record<string, string> = {};
    if (slug) {
      headers['X-Tenant-Slug'] = slug;
      params.tenant = slug;
    }
    return { headers, params };
  }, [slug]);

  const filtersKey = useMemo(
    () => JSON.stringify({
      status: filters.status || '',
      dateFrom: normalizedDateFrom || '',
      dateTo: normalizedDateTo || '',
      customerId: filters.customerId || '',
      limit,
      ordering,
    }),
    [filters.status, filters.customerId, normalizedDateFrom, normalizedDateTo, limit, ordering],
  );

  const loadLookups = useCallback(async () => {
    if (!slug) return;
    setLookupLoading(true);
    setError(null);
    try {
      const [servicesRes, professionalsRes, customersRes] = await Promise.all([
        client
          .get('public/services/', {
            headers: reqConfig.headers,
            params: { ...reqConfig.params, limit: 200 },
          })
          .catch(() => ({ data: [] })),
        client
          .get('professionals/', {
            headers: reqConfig.headers,
            params: { ...reqConfig.params, limit: 200 },
          })
          .catch(() => ({ data: [] })),
        client
          .get('salon/customers/', {
            headers: reqConfig.headers,
            params: { ...reqConfig.params, limit: 200 },
          })
          .catch(() => ({ data: { results: [] } })),
      ]);

      const servicesPayload = normalizeListResponse(servicesRes?.data);
      const professionalsPayload = normalizeListResponse(professionalsRes?.data);
      const customersPayload = normalizeListResponse(customersRes?.data);

      setServices(servicesPayload.results);
      setProfessionals(professionalsPayload.results);
      setCustomers(customersPayload.results);
    } catch (err) {
      setError(err);
    } finally {
      setLookupLoading(false);
    }
  }, [reqConfig, slug]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const fetchPage = useCallback(
    async (nextOffset: number, replace: boolean) => {
      if (!slug || lookupLoading) return;
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const params: Record<string, any> = {
          ...reqConfig.params,
          limit,
          offset: nextOffset,
          ordering,
        };
        if (filters.status) params.status = filters.status;
        if (normalizedDateFrom) params.date_from = normalizedDateFrom;
        if (normalizedDateTo) params.date_to = normalizedDateTo;
        if (filters.customerId) params.customer_id = filters.customerId;

        const response = await client.get('salon/appointments/', {
          headers: reqConfig.headers,
          params,
        });

        const payload = normalizeListResponse(response?.data);
        const baseResults = payload.results;
        const count = payload.count || baseResults.length;

        const serviceMap = new Map(
          services.map((item: any) => [String(item.id), item]),
        );
        const professionalMap = new Map(
          professionals.map((item: any) => [String(item.id), item]),
        );
        const customerMap = new Map(
          customers.map((item: any) => [String(item.id), item]),
        );

        const detailed = await Promise.all(
          baseResults.map(async (item: any) => {
            let detail = null;
            try {
              const res = await client.get(`appointments/${item.id}/`, {
                headers: reqConfig.headers,
                params: reqConfig.params,
              });
              detail = res?.data || null;
            } catch {
              detail = null;
            }

            let slotPayload = detail?.slot || (typeof item.slot === 'object' ? item.slot : null);
            if (!slotPayload?.start_time && item.slot) {
              const cached = slotCacheRef.current.get(item.slot);
              if (cached) {
                slotPayload = { ...(slotPayload || {}), ...cached };
              } else {
                try {
                  const slotRes = await client.get(`slots/${item.slot}/`, {
                    headers: reqConfig.headers,
                    params: reqConfig.params,
                  });
                  if (slotRes?.data) {
                    slotCacheRef.current.set(item.slot, slotRes.data);
                    slotPayload = { ...(slotPayload || {}), ...slotRes.data };
                  }
                } catch {
                  // ignore slot fallback
                }
              }
            }

            let customerPayload = detail?.customer || customerMap.get(String(item.customer)) || null;
            if (!customerPayload && item.customer != null) {
              const cached = customerCacheRef.current.get(item.customer);
              if (cached) {
                customerPayload = cached;
              } else {
                try {
                  const customerRes = await client.get(`salon/customers/${item.customer}/`, {
                    headers: reqConfig.headers,
                    params: reqConfig.params,
                  });
                  if (customerRes?.data) {
                    customerCacheRef.current.set(item.customer, customerRes.data);
                    customerPayload = customerRes.data;
                  }
                } catch {
                  // ignore customer fallback
                }
              }
            }

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
              slotPayload?.end_time ||
              detail?.slot_end ||
              item?.slot_end ||
              item?.end_time ||
              null;

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
            } as BookingItem;
          }),
        );

        setTotalCount(count);
        setAppointments((prev) => (replace ? detailed : [...prev, ...detailed]));
        setOffset(nextOffset);
      } catch (err) {
        setError(err);
        if (replace) {
          setAppointments([]);
          setTotalCount(0);
        }
      } finally {
        if (replace) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [
      slug,
      lookupLoading,
      reqConfig,
      filters.status,
      filters.customerId,
      normalizedDateFrom,
      normalizedDateTo,
      limit,
      ordering,
      services,
      professionals,
      customers,
    ],
  );

  const refetch = useCallback(() => {
    slotCacheRef.current.clear();
    customerCacheRef.current.clear();
    fetchPage(0, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading) return;
    if (appointments.length >= totalCount) return;
    const nextOffset = offset + limit;
    fetchPage(nextOffset, false);
  }, [appointments.length, fetchPage, limit, loading, loadingMore, offset, totalCount]);

  useEffect(() => {
    if (!slug || lookupLoading) return;
    fetchPage(0, true);
  }, [slug, lookupLoading, filtersKey, fetchPage]);

  return {
    appointments,
    totalCount,
    loading,
    loadingMore,
    error,
    customers,
    services,
    professionals,
    refetch,
    loadMore,
  };
}
