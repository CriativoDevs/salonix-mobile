import { useCallback, useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { useTenant } from '../hooks/useTenant';

type Appointment = {
  id: string;
  rangeLabel: string;
  clientName: string;
  service: string;
  professional: string;
  status: 'confirmed' | 'pending' | 'cancelled' | string;
};

type DashboardStats = {
  bookings: number;
  bookingsCompleted: number;
  credits: string;
  clients: number;
};

type DashboardData = {
  stats: DashboardStats;
  upcoming: Appointment[];
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

export default function useDashboardData() {
  const { slug } = useTenant();
  const [data, setData] = useState<DashboardData>({
    stats: { bookings: 0, bookingsCompleted: 0, credits: '0,00', clients: 0 },
    upcoming: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reqConfig = useMemo(() => {
    const headers: Record<string, string> = {};
    const params: Record<string, string> = {};
    if (slug) {
      headers['X-Tenant-Slug'] = slug;
      params.tenant = slug;
    }
    return { headers, params };
  }, [slug]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const fromIso = toApiDate(startOfDay(now));
      const toIso = toApiDate(endOfDay(now));

      const [creditsRes, overviewRes, customersRes, apptsRes, prosRes, servicesRes] = await Promise.all([
        client.get('users/credits/balance/', reqConfig).catch(() => ({ data: { current_balance: 0 } })),
        client
          .get('reports/overview/', {
            headers: reqConfig.headers,
            params: { ...reqConfig.params, from: fromIso, to: toIso },
          })
          .catch(() => ({ data: {} })),
        client
          .get('salon/customers/', {
            headers: reqConfig.headers,
            params: { ...reqConfig.params, page_size: 1 },
          })
          .catch(() => ({ data: { count: 0 } })),
        client
          .get('salon/appointments/', {
            headers: reqConfig.headers,
            params: {
              ...reqConfig.params,
              date_from: fromIso,
              date_to: toIso,
              ordering: 'slot_time',
              page_size: 200,
            },
          })
          .catch(() => ({ data: { results: [] } })),
        client
          .get('professionals/', {
            headers: reqConfig.headers,
            params: { ...reqConfig.params, limit: 200 },
          })
          .catch(() => ({ data: [] })),
        client
          .get('public/services/', {
            headers: reqConfig.headers,
            params: { ...reqConfig.params, limit: 200 },
          })
          .catch(() => ({ data: [] })),
      ]);

      const rawBalance = creditsRes?.data?.current_balance ?? 0;
      const numericBalance = Number(rawBalance) || 0;
      const creditsStr = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericBalance);
      const customersPayload = normalizeListResponse(customersRes?.data);
      const customers = customersPayload.count ?? 0;
      const appointmentsPayload = normalizeListResponse(apptsRes?.data);
      const list = appointmentsPayload.results;
      const professionalsPayload = normalizeListResponse(prosRes?.data);
      const servicesPayload = normalizeListResponse(servicesRes?.data);
      const professionalMap = new Map(
        professionalsPayload.results.map((p: any) => [String(p.id), p]),
      );
      const serviceMap = new Map(
        servicesPayload.results.map((s: any) => [String(s.id), s]),
      );

      const activeStatuses = new Set(['scheduled']);
      const completedStatuses = new Set(['completed', 'paid']);

      const bookings = list.filter((appt: any) =>
        activeStatuses.has(String(appt?.status || '').toLowerCase()),
      ).length;

      const bookingsCompleted = list.filter((appt: any) =>
        completedStatuses.has(String(appt?.status || '').toLowerCase()),
      ).length;

      const candidates = list
        .filter((appt: any) => {
          if (appt?.id == null) return false;
          const status = String(appt?.status || '').toLowerCase();
          return !status || activeStatuses.has(status);
        })
        .slice(0, 20);

      const customerCache = new Map<string | number, any>();
      const detailed = await Promise.all(
        candidates.map(async (appt: any) => {
          let slotPayload =
            typeof appt.slot === 'object' && appt.slot ? appt.slot : null;

          const hasDetailedSlot =
            appt && typeof appt.slot === 'object' && appt.slot;

          if (
            (!slotPayload || !slotPayload.start_time) &&
            !hasDetailedSlot &&
            appt?.slot
          ) {
            try {
              const response = await client.get(`slots/${appt.slot}/`, {
                headers: reqConfig.headers,
                params: reqConfig.params,
              });
              slotPayload = response.data || null;
            } catch {
              slotPayload = slotPayload || null;
            }
          }

          let customerPayload = null;
          const customerId = typeof appt?.customer === 'number' || typeof appt?.customer === 'string'
            ? appt.customer
            : appt?.customer?.id ?? null;
          if (customerId != null) {
            if (customerCache.has(customerId)) {
              customerPayload = customerCache.get(customerId);
            } else {
              try {
                const res = await client.get(`salon/customers/${customerId}/`, {
                  headers: reqConfig.headers,
                  params: reqConfig.params,
                });
                customerPayload = res.data || null;
                customerCache.set(customerId, customerPayload);
              } catch {
                customerCache.set(customerId, null);
              }
            }
          }

          const professionalKey =
            (typeof appt?.professional === 'object'
              ? appt?.professional?.id
              : appt?.professional) ??
            appt?.professional_id ??
            null;
          const professionalPayload =
            (professionalKey != null
              ? professionalMap.get(String(professionalKey))
              : null) ||
            (typeof appt?.professional === 'object' ? appt?.professional : null) ||
            null;

          const serviceKey =
            (typeof appt?.service === 'object'
              ? appt?.service?.id
              : appt?.service) ??
            appt?.service_id ??
            null;
          const servicePayload =
            (serviceKey != null ? serviceMap.get(String(serviceKey)) : null) ||
            (typeof appt?.service === 'object' ? appt?.service : null) ||
            null;

          const startRaw =
            slotPayload?.start_time ||
            appt?.slot_start ||
            appt?.start_time ||
            appt?.slot_time ||
            null;
          const endRaw =
            slotPayload?.end_time ||
            appt?.slot_end ||
            appt?.end_time ||
            null;

          const startDate = parseSlotDate(startRaw);
          const endDate = parseSlotDate(endRaw);

          return {
            base: appt,
            start: startDate,
            end: endDate,
            customer: customerPayload,
            professional: professionalPayload,
            service: servicePayload,
          };
        }),
      );

      const enriched = detailed.filter((item) => item.start);

      enriched.sort((a, b) => {
        const ta = a.start ? a.start.getTime() : 0;
        const tb = b.start ? b.start.getTime() : 0;
        return ta - tb;
      });

      const nowTs = now.getTime();
      const windowEndTs = nowTs + 15 * 60 * 1000;

      const futureAppointments = enriched.filter((item) => {
        if (!item.start) return false;
        const ts = item.start.getTime();
        if (!Number.isFinite(ts)) return false;
        return ts >= nowTs;
      });

      const withinWindow = futureAppointments.filter((item) => {
        if (!item.start) return false;
        const ts = item.start.getTime();
        if (!Number.isFinite(ts)) return false;
        return ts <= windowEndTs;
      });

      const fallbackUpcoming = futureAppointments.length ? futureAppointments : enriched;
      const selectedRaw = withinWindow.length ? withinWindow : fallbackUpcoming;
      const upcomingSource = selectedRaw.slice(0, 5);

      const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
      });
      const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const upcoming: Appointment[] = upcomingSource.map((item) => {
        const startDate = item.start || new Date();
        const appt = item.base;
        const endDate = item.end;
        
        // Format date part - capitalize first letter and remove period
        const rawDatePart = dateFormatter.format(startDate);
        const datePart = rawDatePart.replace(/^(\d+)\s+de\s+(.+)\.$/, '$1 de $2.');
        
        const startPart = timeFormatter.format(startDate);
        const endPart = endDate ? timeFormatter.format(endDate) : null;
        const rangeLabel = endPart
          ? `${datePart} • ${startPart} – ${endPart}`
          : `${datePart} • ${startPart}`;
        
        // Extract service name with fallbacks
        const serviceName = 
          item?.service?.name ||
          item?.service?.title ||
          (typeof appt?.service === 'object' && appt?.service?.name) ||
          appt?.service_name ||
          'Serviço';
        
        // Extract professional name with fallbacks
        const professionalName =
          item?.professional?.name ||
          (typeof appt?.professional === 'object' && appt?.professional?.name) ||
          appt?.professional_name ||
          'Nome Qualquer';
        
        // Extract customer name with fallbacks
        const customerName =
          item?.customer?.name ||
          (typeof appt?.customer === 'object' && appt?.customer?.name) ||
          appt?.customer_name ||
          appt?.client_name ||
          'Nome de Cliente';
        
        return {
          id: String(appt?.id ?? Math.random()),
          rangeLabel,
          clientName: customerName,
          service: serviceName,
          professional: professionalName,
          status: appt?.status || 'scheduled',
        };
      });

      setData({
        stats: { bookings, bookingsCompleted, credits: creditsStr, clients: customers },
        upcoming,
      });
    } catch (err) {
      setError(err);
      setData({
        stats: { bookings: 0, bookingsCompleted: 0, credits: '0,00', clients: 0 },
        upcoming: [],
      });
    } finally {
      setLoading(false);
    }
  }, [reqConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
