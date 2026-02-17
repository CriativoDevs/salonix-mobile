import client from "./client";

export async function fetchProfessionals({ limit = 10, offset = 0, search = "", ordering = "-created_at", is_active, slug } = {}) {
    const params = {
        limit,
        offset,
        ordering,
    };

    if (search) {
        params.search = search;
        params.name = search;
        params.q = search;
    }

    if (is_active !== undefined) {
        params.is_active = is_active;
    }

    if (slug) {
        params.tenant = slug;
    }

    const headers = {};
    if (slug) {
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.get("professionals/", { params, headers });
    return response.data;
}

export async function createProfessional(data) {
    const { slug, ...payload } = data;
    const params = {};
    const headers = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.post("professionals/", payload, { params, headers });
    return response.data;
}

export async function updateProfessional(id, data) {
    const { slug, ...payload } = data;
    const params = {};
    const headers = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.patch(`professionals/${id}/`, payload, { params, headers });
    return response.data;
}

export async function deleteProfessional(id, { slug } = {}) {
    const params = {};
    const headers = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.delete(`professionals/${id}/`, { params, headers });
    return response.data;
}

export async function resendProfessionalInvite(id, { slug } = {}) {
    const params = {};
    const headers = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.post(`professionals/${id}/resend-invite/`, {}, { params, headers });
    return response.data;
}
