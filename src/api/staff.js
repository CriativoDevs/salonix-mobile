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

function buildStaffContactRequestBody(id, payload) {
    const { photoFile, ...rest } = payload;
    const values = { id, ...rest };

    if (!photoFile) {
        return { body: values, isMultipart: false };
    }

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(key, value);
    });
    formData.append('photo', {
        uri: photoFile.uri,
        name: photoFile.name || 'photo.jpg',
        type: photoFile.mimeType || 'image/jpeg',
    });

    return { body: formData, isMultipart: true };
}

export async function updateStaffContact(id, payload = {}, { slug } = {}) {
    const params = {};
    const headers = {};
    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const { body, isMultipart } = buildStaffContactRequestBody(id, payload);
    if (isMultipart) {
        headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await client.patch('users/staff/contact/', body, { params, headers });
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

export async function importStaffCSV(file, { dryRun = false, slug } = {}) {
    const headers = { 'Content-Type': 'multipart/form-data' };
    const params = { dry_run: dryRun ? 'true' : 'false' };

    if (slug) {
        headers['X-Tenant-Slug'] = slug;
        params.tenant = slug;
    }

    const formData = new FormData();
    formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'text/csv',
    });

    const response = await client.post('import/staff/', formData, { headers, params });
    return response.data;
}

export async function fetchStaffImportTemplate({ slug } = {}) {
    const headers = {};
    const params = {};

    if (slug) {
        headers['X-Tenant-Slug'] = slug;
        params.tenant = slug;
    }

    const response = await client.get('import/templates/staff.csv', {
        headers,
        params,
        responseType: 'text',
    });
    return response.data;
}

export async function exportStaffCSV({ slug } = {}) {
    const headers = {};
    const params = {};

    if (slug) {
        headers['X-Tenant-Slug'] = slug;
        params.tenant = slug;
    }

    const response = await client.get('export/staff.csv', {
        headers,
        params,
        responseType: 'text',
    });
    return response.data;
}
