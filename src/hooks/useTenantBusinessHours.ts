import { useEffect, useState } from 'react';
import { fetchTenantBusinessHours } from '../api/tenant';
import { useTenant } from './useTenant';
import { getBusinessHoursRangeMinutes, BusinessHoursRange } from '../utils/calendarGrid';

type UseTenantBusinessHoursResult = {
  range: BusinessHoursRange;
  loading: boolean;
};

export default function useTenantBusinessHours(): UseTenantBusinessHoursResult {
  const { slug } = useTenant();
  const [range, setRange] = useState<BusinessHoursRange>(getBusinessHoursRangeMinutes(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTenantBusinessHours({ slug })
      .then((data: unknown) => {
        if (cancelled) return;
        setRange(getBusinessHoursRangeMinutes(data as any));
      })
      .catch(() => {
        if (cancelled) return;
        setRange(getBusinessHoursRangeMinutes(null));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { range, loading };
}
