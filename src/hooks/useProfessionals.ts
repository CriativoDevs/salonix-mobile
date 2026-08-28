import { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import { useTenant } from './useTenant';
import { useAuth } from './useAuth';

export type Professional = any;

type UseProfessionalsParams = {
  serviceId?: number | string;
  enabled?: boolean;
};

// Extraido de BookingCreateScreen: carrega os profissionais ativos do tenant,
// opcionalmente filtrados por servico, respeitando a mesma regra de
// permissao para Colaboradores (so veem a si proprios).
export function useProfessionals({ serviceId, enabled = true }: UseProfessionalsParams = {}) {
  const { slug } = useTenant();
  const { userInfo } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!slug || !enabled) return;
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: 100, tenant: slug };
      if (serviceId != null) {
        params.service_id = serviceId;
      }
      const response = await client.get('public/professionals/', {
        params,
        headers: { 'X-Tenant-Slug': slug },
      });
      const data = response.data;
      let results = Array.isArray(data) ? data : data.results || [];

      // Filtragem de segurança para Colaboradores
      // Se o usuário não for Admin/Manager, ele só pode ver/agendar para si mesmo
      if (userInfo && userInfo.role !== 'owner' && userInfo.role !== 'manager' && !userInfo.is_superuser) {
        results = results.filter(
          (p: any) => p.user === userInfo.id || p.email === userInfo.email || p.staff_member === userInfo.id
        );
      }

      setProfessionals(results);
    } catch (error) {
      console.error('Error loading professionals:', error);
    } finally {
      setLoading(false);
    }
  }, [slug, serviceId, enabled, userInfo]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { professionals, loading, reload };
}

export default useProfessionals;
