import AsyncStorage from "@react-native-async-storage/async-storage";

const TENANT_SLUG_KEY = "salonix_tenant_slug";

export const getStoredTenantSlug = async () => {
  try {
    return await AsyncStorage.getItem(TENANT_SLUG_KEY);
  } catch (error) {
    console.error("[tenantStorage] Error getting tenant slug:", error);
    return null;
  }
};

export const storeTenantSlug = async (slug) => {
  try {
    if (slug) {
      await AsyncStorage.setItem(TENANT_SLUG_KEY, slug);
    } else {
      await AsyncStorage.removeItem(TENANT_SLUG_KEY);
    }
  } catch (error) {
    console.error("[tenantStorage] Error storing tenant slug:", error);
  }
};

export const clearStoredTenantSlug = async () => {
  await storeTenantSlug(null);
};
