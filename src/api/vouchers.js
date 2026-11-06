import client from "./client";

// CRUD de vouchers do tenant (BE-VOUCHER-01, #470 no salonix-backend) +
// atribuicao a clientes (BE-VOUCHER-02, #471) e envio por e-mail
// (BE-VOUCHER-04, #473). Endpoints confirmados em
// salonix-backend/vouchers/{views,urls}.py -- paridade com
// salonix-frontend-web/src/api/vouchers.js (FEW-VOUCHER-01, #311).

export async function fetchVouchers({ slug, limit = 100 } = {}) {
  const params = { limit };
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.get('vouchers/', { params, headers });
  const data = response.data;
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createVoucher(data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.post('vouchers/', payload, { params, headers });
  return response.data;
}

export async function updateVoucher(id, data) {
  const { slug, ...payload } = data;
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.patch(`vouchers/${id}/`, payload, { params, headers });
  return response.data;
}

export async function deleteVoucher(id, { slug } = {}) {
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.delete(`vouchers/${id}/`, { params, headers });
  return response.data;
}

export async function assignVoucher(id, clientId, { slug } = {}) {
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.post(
    `vouchers/${id}/assign/`,
    { client_id: clientId },
    { params, headers }
  );
  return response.data;
}

// Atribuicao em massa (BE-VOUCHER-07) -- retorna
// { assigned: [ClientVoucher, ...], skipped: [{ client_id, reason }] }.
export async function assignVoucherBulk(id, clientIds, { slug } = {}) {
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.post(
    `vouchers/${id}/assign-bulk/`,
    { client_ids: clientIds },
    { params, headers }
  );
  return response.data;
}

export async function sendVoucherEmail(id, clientId, { slug } = {}) {
  const params = {};
  const headers = {};
  if (slug) {
    params.tenant = slug;
    headers['X-Tenant-Slug'] = slug;
  }
  const response = await client.post(
    `vouchers/${id}/send-email/`,
    { client_id: clientId },
    { params, headers }
  );
  return response.data;
}
