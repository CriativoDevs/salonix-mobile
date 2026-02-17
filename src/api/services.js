import client from "./client";

export async function fetchServices({ slug, limit = 100 } = {}) {
    const params = { limit };
    const headers = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.get("public/services/", { params, headers });
    return response.data;
}
