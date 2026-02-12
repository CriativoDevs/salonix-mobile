import client from "./client";

const TENANT_ENDPOINT = "users/tenant/meta/";

export async function fetchTenantMeta(slug) {
  const params = {};
  if (slug) {
    params.tenant = slug;
  }
  const response = await client.get(TENANT_ENDPOINT, { params });
  return response.data;
}
