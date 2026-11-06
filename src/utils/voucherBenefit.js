/**
 * voucherBenefit.js - Resumo legível do benefício de um ClientVoucher.
 *
 * Espelha salonix-frontend-web/src/utils/voucherBenefit.js (mesma lógica,
 * adaptada à convenção local de i18n do mobile: sem react-i18next, apenas
 * um dicionário pt/en passado pela tela que chama).
 *
 * Limitação conhecida (documentada em to_see.md): o backend
 * (ClientVoucherSerializer, GET /api/clients/me/vouchers/) não expõe o nome
 * do serviço para vouchers do tipo "free_service", nem uma data de validade
 * (`valid_until`). Por isso o resumo de "free_service" fica genérico
 * ("Serviço grátis") e a tela de vouchers não exibe validade.
 */

export function describeVoucherBenefit(clientVoucher, language = "pt") {
  const type = clientVoucher?.voucher_type;
  const value = clientVoucher?.voucher_value;

  if (type === "percent") {
    return language === "en" ? `${value}% discount` : `${value}% de desconto`;
  }
  if (type === "fixed") {
    return language === "en" ? `${value} discount` : `Desconto de ${value}`;
  }
  return language === "en" ? "Free service" : "Serviço grátis";
}
