import React, { createContext, useCallback, useEffect, useState } from "react";
import { fetchTenantMeta } from "../api/tenant";
import { parseApiError } from "../utils/apiError";
import {
  DEFAULT_TENANT_META,
  DEFAULT_TENANT_SLUG,
  mergeTenantMeta,
  sanitizeTenantSlug,
} from "../utils/tenant";
import {
  getStoredTenantSlug,
  storeTenantSlug as saveTenantSlug,
} from "../utils/tenantStorage";

const defaultContextValue = {
  slug: DEFAULT_TENANT_SLUG,
  tenant: DEFAULT_TENANT_META,
  plan: DEFAULT_TENANT_META.plan,
  flags: DEFAULT_TENANT_META.flags,
  theme: DEFAULT_TENANT_META.theme,
  modules: DEFAULT_TENANT_META.modules,
  branding: DEFAULT_TENANT_META.branding,
  channels: DEFAULT_TENANT_META.channels,
  profile: DEFAULT_TENANT_META.profile,
  onboarding_state: DEFAULT_TENANT_META.onboarding_state,
  loading: true,
  error: null,
  refetch: async () => DEFAULT_TENANT_META,
  setTenantSlug: () => {},
  applyTenantBootstrap: () => {},
};

export const TenantContext = createContext(defaultContextValue);

export function TenantProvider({ children }) {
  const [slug, setSlug] = useState(DEFAULT_TENANT_SLUG);
  const [tenant, setTenant] = useState(DEFAULT_TENANT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTenant = useCallback(
    async (targetSlug, { silent = false } = {}) => {
      const sanitizedSlug =
        sanitizeTenantSlug(targetSlug) || DEFAULT_TENANT_SLUG;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        if (!sanitizedSlug || sanitizedSlug === DEFAULT_TENANT_SLUG) {
          const fallbackMeta = {
            ...DEFAULT_TENANT_META,
            slug: DEFAULT_TENANT_SLUG,
          };
          setTenant(fallbackMeta);
          setSlug(fallbackMeta.slug);
          return fallbackMeta;
        }

        const data = await fetchTenantMeta(sanitizedSlug);
        const merged = mergeTenantMeta(DEFAULT_TENANT_META, data);

        setTenant(merged);
        setSlug(merged.slug);
        await saveTenantSlug(merged.slug);

        return merged;
      } catch (err) {
        const errorMessage = parseApiError(err, "Erro ao carregar tenant");
        console.error("[Tenant] loadTenant error:", errorMessage);

        if (!silent) {
          setError(errorMessage);
        }

        const fallback = {
          ...DEFAULT_TENANT_META,
          slug: sanitizedSlug,
        };
        setTenant(fallback);
        setSlug(fallback.slug);

        return fallback;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  const refetch = useCallback(
    async (options) => {
      return await loadTenant(slug, options);
    },
    [slug, loadTenant]
  );

  const setTenantSlug = useCallback(
    (newSlug) => {
      const sanitized = sanitizeTenantSlug(newSlug) || DEFAULT_TENANT_SLUG;
      if (sanitized !== slug) {
        loadTenant(sanitized);
      }
    },
    [slug, loadTenant]
  );

  const applyTenantBootstrap = useCallback((bootstrapData) => {
    if (!bootstrapData || !bootstrapData.slug) return;
    const merged = mergeTenantMeta(DEFAULT_TENANT_META, bootstrapData);
    setTenant(merged);
    setSlug(merged.slug);
    saveTenantSlug(merged.slug);
  }, []);

  useEffect(() => {
    const init = async () => {
      const stored = await getStoredTenantSlug();
      const initialSlug = stored || DEFAULT_TENANT_SLUG;
      await loadTenant(initialSlug);
    };
    init();
  }, [loadTenant]);

  const value = {
    slug,
    tenant,
    plan: tenant.plan,
    flags: tenant.flags,
    theme: tenant.theme,
    modules: tenant.modules,
    branding: tenant.branding,
    channels: tenant.channels,
    profile: tenant.profile,
    onboarding_state: tenant.onboarding_state,
    loading,
    error,
    refetch,
    setTenantSlug,
    applyTenantBootstrap,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}
