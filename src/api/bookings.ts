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
