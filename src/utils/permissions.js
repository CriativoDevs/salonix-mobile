export function isOwner(userInfo) {
  return userInfo?.role === 'owner';
}

// Owner/manager: gestão do negócio. Colaborador não passa. Sem bypass de
// superuser (mesma regra de isOwner). O BE é a barreira real (BE-SEC-01);
// isto só evita pedidos que dariam 403.
export function isOwnerOrManager(userInfo) {
  return userInfo?.role === 'owner' || userInfo?.role === 'manager';
}

// Visão geral/histórico de cobrança: o BE devolve 403 para colaborador.
export function canViewBilling(userInfo) {
  return isOwnerOrManager(userInfo);
}
