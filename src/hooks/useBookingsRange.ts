import { useCallback, useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { useTenant } from './useTenant';
import { BookingItem, buildBookingItem, normalizeListResponse } from './bookingsShared';

const PAGE_SIZE = 100;

type UseBookingsRangeResult = {
  appointments: BookingItem[];
  loading: boolean;
  error: unknown;
  refetch: () => void;
};

export default function useBookingsRange(
  dateFrom: string | null,
  dateTo: string | null
): UseBookingsRangeResult {
  const { slug } = useTenant();
  const [appointments, setAppointments] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const slotCacheRef = useRef<Map<string | number, any>>(new Map());
  const customerCacheRef = useRef<Map<string | number, any>>(new Map());

  const fetchAll = useCallback(async () => {
    if (!slug || !dateFrom || !dateTo) return;
    setLoading(true);
    setError(null);
    slotCacheRef.current.clear();
    customerCacheRef.current.clear();

    const headers: Record<string, string> = { 'X-Tenant-Slug': slug };
    const baseParams: Record<string, any> = {
      tenant: slug,
      date_from: dateFrom,
      date_to: dateTo,
      ordering: 'slot__start_time',
    };

    try {
      const [servicesRes, professionalsRes, customersRes] = await Promise.all([
        client
          .get('public/services/', { headers, params: { ...baseParams, limit: 200 } })
          .catch(() => ({ data: [] })),
        client
          .get('professionals/', { headers, params: { ...baseParams, limit: 200 } })
          .catch(() => ({ data: [] })),
        client
          .get('salon/customers/', { headers, params: { ...baseParams, limit: 200 } })
          .catch(() => ({ data: { results: [] } })),
      ]);

      const serviceMap = new Map(
        normalizeListResponse(servicesRes?.data).results.map((s: any) => [String(s.id), s])
      );
      const professionalMap = new Map(
        normalizeListResponse(professionalsRes?.data).results.map((p: any) => [String(p.id), p])
      );
      const customerMap = new Map(
        normalizeListResponse(customersRes?.data).results.map((c: any) => [String(c.id), c])
      );

      let offset = 0;
      let all: any[] = [];
      // Busca todas as paginas do intervalo - vistas de calendario precisam de
      // todos os agendamentos visiveis no periodo, sem paginacao por scroll.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await client.get('salon/appointments/', {
          headers,
          params: { ...baseParams, limit: PAGE_SIZE, offset },
        });
        const payload = normalizeListResponse(response?.data);
        all = all.concat(payload.results);
        offset += PAGE_SIZE;
        if (all.length >= payload.count || payload.results.length === 0) break;
      }

      const detailed = await Promise.all(
        all.map(async (item: any) => {
          let detail: any = null;
          try {
            const res = await client.get(`appointments/${item.id}/`, {
              headers,
              params: { tenant: slug },
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
                  headers,
                  params: { tenant: slug },
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
                  headers,
                  params: { tenant: slug },
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
        })
      );

      setAppointments(detailed);
    } catch (err) {
      setError(err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [slug, dateFrom, dateTo]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { appointments, loading, error, refetch: fetchAll };
}
