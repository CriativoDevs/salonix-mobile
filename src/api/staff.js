import client from "./client";
import { useTenant } from "../hooks/useTenant";

export async function fetchStaffMembers({ slug } = {}) {
    const params = {};
    if (slug) {
        params.tenant = slug;
    }
    const response = await client.get("users/staff/", { params });
    return response.data;
}

export async function updateStaffMember(id, payload, { slug } = {}) {
    const params = {};
    const headers = {};
    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }
    const response = await client.patch(`users/staff/`, { id, ...payload }, { params, headers });
    return response.data;
}

export async function inviteStaffMember(payload, { slug } = {}) {
    const params = {};
    const headers = {};
    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }
    const response = await client.post("users/staff/", payload, { params, headers });
    return response.data;
}

export async function disableStaffMember(id, { slug } = {}) {
    const params = {};
    const headers = {};
    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }
    const response = await client.delete("users/staff/", {
        data: { id },
        params,
        headers,
    });
    return response.data;
}
