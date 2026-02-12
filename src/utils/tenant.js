export const DEFAULT_TENANT_SLUG = "timelyone";

export const DEFAULT_TENANT_META = {
  slug: DEFAULT_TENANT_SLUG,
  name: "TimelyOne",
  plan: "free",
  flags: {},
  theme: {
    primary: "#6366f1",
    primaryForeground: "#ffffff",
    surface: "#ffffff",
    surfaceForeground: "#1f2937",
    accent: "#8b5cf6",
    border: "#e5e7eb",
  },
  modules: {},
  branding: {
    logo_url: null,
    favicon_url: null,
  },
  channels: {},
  profile: {},
  onboarding_state: null,
};

export const sanitizeTenantSlug = (slug) => {
  if (!slug || typeof slug !== "string") return "";
  return slug.trim().toLowerCase();
};

export const mergeTenantMeta = (base, override) => {
  return {
    ...base,
    ...override,
    theme: { ...base.theme, ...override?.theme },
    modules: { ...base.modules, ...override?.modules },
    branding: { ...base.branding, ...override?.branding },
    channels: { ...base.channels, ...override?.channels },
    profile: { ...base.profile, ...override?.profile },
    flags: { ...base.flags, ...override?.flags },
  };
};
