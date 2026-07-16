import client from "./client";

export interface AppointmentData {
    id?: number;
    professional: number;
    service: number;
    customer: number;
    slot: number;
    notes?: string;
    status?: string;
}

export async function fetchAppointmentDetail(id: number, { slug }: { slug?: string } = {}) {
    const params: any = {};
    const headers: any = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.get(`appointments/${id}/`, { params, headers });
    return response.data;
}

export async function createAppointment(data: AppointmentData, { slug }: { slug?: string } = {}) {
    const params: any = {};
    const headers: any = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.post("appointments/", data, { params, headers });
    return response.data;
}

export async function updateAppointment(id: number, data: Partial<AppointmentData>, { slug }: { slug?: string } = {}) {
    const params: any = {};
    const headers: any = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.patch(`salon/appointments/${id}/`, data, { params, headers });
    return response.data;
}

export async function cancelAppointment(id: number, { slug }: { slug?: string } = {}) {
    const params: any = {};
    const headers: any = {};

    if (slug) {
        params.tenant = slug;
        headers['X-Tenant-Slug'] = slug;
    }

    const response = await client.post(`appointments/${id}/cancel/`, {}, { params, headers });
    return response.data;
}

export async function importAppointmentsCSV(
    file: { uri: string; name: string; mimeType?: string },
    { dryRun = false, slug }: { dryRun?: boolean; slug?: string } = {}
) {
    const headers: any = { 'Content-Type': 'multipart/form-data' };
    const params: any = { dry_run: dryRun ? 'true' : 'false' };

    if (slug) {
        headers['X-Tenant-Slug'] = slug;
        params.tenant = slug;
    }

    const formData = new FormData();
    formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'text/csv',
    } as any);

    const response = await client.post('import/appointments/', formData, { headers, params });
    return response.data;
}

export async function fetchAppointmentsImportTemplate({ slug }: { slug?: string } = {}) {
    const headers: any = {};
    const params: any = {};

    if (slug) {
        headers['X-Tenant-Slug'] = slug;
        params.tenant = slug;
    }

    const response = await client.get('import/templates/appointments.csv', {
        headers,
        params,
        responseType: 'text',
    });
    return response.data;
}

export async function exportAppointmentsCSV({ slug }: { slug?: string } = {}) {
    const headers: any = {};
    const params: any = {};

    if (slug) {
        headers['X-Tenant-Slug'] = slug;
        params.tenant = slug;
    }

    const response = await client.get('salon/appointments/export/', {
        headers,
        params,
        responseType: 'text',
    });
    return response.data;
}
