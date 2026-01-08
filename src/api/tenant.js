import client from "./client";

export async function fetchTenantMeta(slug) {
  const response = await client.get(`tenant/${slug}/meta/`);
  return response.data;
}
