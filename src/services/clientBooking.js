/**
 * clientBooking.js - Client-facing booking & profile endpoints
 *
 * Serviços de domínio "cliente" além de login/perfil básico (que ficam em
 * auth.js): catálogo público (slots), CRUD de agendamentos e atualização de
 * perfil. Espelha salonix-frontend-web/src/api/clientMe.js — mesmos
 * endpoints, mesmos contratos de payload/paginação.
 */

import client from "../api/client";

const PAGE_SIZE = 20;

function normalizePage(data) {
  if (Array.isArray(data)) {
    // Compatibilidade: formato antigo (array simples).
    return { results: data, hasMore: false };
  }
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    hasMore: Boolean(data?.has_more),
  };
}

/**
 * Slots disponíveis de um profissional (endpoint público, mas o tenant é
 * obrigatório via header — o cliente já sabe o seu tenant após login).
 */
export const fetchPublicSlots = async ({
  tenantSlug,
  professionalId,
  dateFrom,
  dateTo,
} = {}) => {
  if (!professionalId) {
    throw new Error("professionalId é obrigatório");
  }
  const params = { professional_id: professionalId };
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (tenantSlug) params.tenant = tenantSlug;

  const headers = {};
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;

  const response = await client.get("public/slots/", { params, headers });
  return response.data;
};

export const fetchClientUpcoming = async ({ offset = 0, limit = PAGE_SIZE } = {}) => {
  const { data } = await client.get("clients/me/appointments/upcoming/", {
    params: { offset, limit },
  });
  return normalizePage(data);
};

export const fetchClientHistory = async ({ offset = 0, limit = PAGE_SIZE } = {}) => {
  const { data } = await client.get("clients/me/appointments/history/", {
    params: { offset, limit },
  });
  return normalizePage(data);
};

export const createClientAppointment = async ({
  serviceId,
  professionalId,
  slotId,
  notes,
}) => {
  const { data } = await client.post("clients/me/appointments/", {
    service: serviceId,
    professional: professionalId,
    slot: slotId,
    notes: notes || "",
  });
  return data;
};

export const cancelClientAppointment = async (id) => {
  const { data } = await client.patch(`clients/me/appointments/${id}/cancel/`, {});
  return data;
};

export const updateClientProfile = async (partial) => {
  const { data } = await client.patch("clients/me/profile/", partial);
  return data;
};

/**
 * @param {{uri: string, name?: string, mimeType?: string}} photoFile - asset
 *   vindo de expo-image-picker.
 */
export const updateClientProfilePhoto = async (photoFile) => {
  const formData = new FormData();
  formData.append("photo", {
    uri: photoFile.uri,
    name: photoFile.name || "photo.jpg",
    type: photoFile.mimeType || "image/jpeg",
  });
  const { data } = await client.patch("clients/me/profile/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
