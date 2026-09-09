import client from "./client";

function buildHeaders({ slug } = {}) {
  const headers = {};
  if (slug) {
    headers["X-Tenant-Slug"] = slug;
  }
  return headers;
}

export async function fetchCmsPages({ slug } = {}) {
  const headers = buildHeaders({ slug });
  const response = await client.get("cms/pages/", { headers });
  return response.data;
}

export async function fetchCmsPage(slug, { slug: tenantSlug } = {}) {
  const headers = buildHeaders({ slug: tenantSlug });
  const response = await client.get(`cms/pages/${slug}/`, { headers });
  return response.data;
}

export async function fetchRoadmap() {
  const response = await client.get("cms/roadmap/");
  return response.data;
}

export default { fetchCmsPages, fetchCmsPage, fetchRoadmap };
