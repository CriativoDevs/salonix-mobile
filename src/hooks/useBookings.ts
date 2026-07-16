import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import client from '../api/client';
import { useTenant } from '../hooks/useTenant';
import { BookingItem, normalizeListResponse, buildBookingItem } from './bookingsShared';

type BookingFilters = {
  status?: string;
  dateFrom?: string | Date | null;
  dateTo?: string | Date | null;
  customerId?: string | number | null;
  limit?: number;
  ordering?: string;
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

            return buildBookingItem({
              item,
              detail,
              slotPayload,
              customerPayload,
              serviceMap,
              professionalMap,
            });
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
