import client from "./client";

export async function fetchSlots({ professional_id, date_from, date_to, is_available, limit = 20, offset = 0, ordering = "-start_time", slug } = {}) {
    const params = {
        limit,
        offset,
        ordering,
    };

    if (professional_id) {
        params.professional_id = professional_id;
    }

    if (date_from) {
        params.date_from = date_from;
    }

    if (date_to) {
        params.date_to = date_to;
    }

    if (is_available !== undefined) {
        params.is_available = is_available;
    }

    if (slug) {
        params.tenant = slug;
    }

    const headers = {};
    if (slug) {
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.get("slots/", { params, headers });
    return response.data;
}

export async function createSlot(data) {
    const { slug, professional_id, start_time, end_time, ...rest } = data;

    const payload = {
        professional: Number(professional_id),
        start_time,
        end_time,
        is_available: true,
        ...rest,
    };

    const params = {};
    const headers = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.post("slots/", payload, { params, headers });
    return response.data;
}

export async function deleteSlot(id, { slug } = {}) {
    const params = {};
    const headers = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.delete(`slots/${id}/`, { params, headers });
    return response.data;
}

export async function fetchSlotDetail(id, { slug } = {}) {
    const params = {};
    const headers = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.get(`slots/${id}/`, { params, headers });
    return response.data;
}
