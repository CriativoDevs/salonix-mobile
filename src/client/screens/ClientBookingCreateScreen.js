import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import { useClientAuth } from "../../hooks/useClientAuth";
import { Button, Card } from "../../components/ui";
import { parseSlotDate, formatDateTimeRange } from "../../utils/date";
import { fetchServices } from "../../api/services";
import { fetchProfessionals } from "../../api/professionals";
import {
  fetchPublicSlots,
  createClientAppointment,
  fetchClientVouchers,
  applyClientVoucherToAppointment,
} from "../../services/clientBooking";
import { describeVoucherBenefit } from "../../utils/voucherBenefit";

function asList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

const COPY = {
  pt: {
    back: "Voltar",
    title: "Novo agendamento",
    loading: "Carregando…",
    noServices: "Nenhum serviço disponível.",
    noProfessionals: "Nenhum profissional disponível.",
    noSlots: "Nenhum horário disponível para este profissional.",
    confirm: "Confirmar agendamento",
    confirmed: "Agendamento confirmado!",
    confirmFailed: "Não foi possível confirmar o agendamento.",
    servicesFailed: "Falha ao carregar serviços.",
    professionalsFailed: "Falha ao carregar profissionais.",
    slotsFailed: "Falha ao carregar horários.",
    voucherSectionTitle: "Usar voucher",
    voucherNone: "Não usar voucher",
    voucherApplyFailed:
      "O agendamento foi criado, mas não foi possível aplicar o voucher.",
  },
  en: {
    back: "Back",
    title: "New booking",
    loading: "Loading…",
    noServices: "No services available.",
    noProfessionals: "No professionals available.",
    noSlots: "No time slots available for this professional.",
    confirm: "Confirm booking",
    confirmed: "Booking confirmed!",
    confirmFailed: "Could not confirm the booking.",
    servicesFailed: "Failed to load services.",
    professionalsFailed: "Failed to load professionals.",
    slotsFailed: "Failed to load time slots.",
    voucherSectionTitle: "Use voucher",
    voucherNone: "Don't use a voucher",
    voucherApplyFailed:
      "The booking was created, but the voucher could not be applied.",
  },
};

export default function ClientBookingCreateScreen({ navigation }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const { tenantSlug } = useClientAuth();
  const t = COPY[language] || COPY.pt;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  useEffect(() => {
    if (!tenantSlug) return;
    setLoading(true);
    fetchServices({ slug: tenantSlug })
      .then((data) => setServices(asList(data)))
      .catch(() => showToast({ type: "error", message: t.servicesFailed }))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  useEffect(() => {
    fetchClientVouchers()
      .then((data) => setVouchers(data.filter((v) => v.status === "active")))
      .catch(() => setVouchers([]));
  }, []);

  const pickService = (service) => {
    setSelectedService(service);
    setLoading(true);
    fetchProfessionals({ slug: tenantSlug })
      .then((data) => setProfessionals(asList(data)))
      .catch(() =>
        showToast({ type: "error", message: t.professionalsFailed })
      )
      .finally(() => setLoading(false));
    setStep(1);
  };

  const pickProfessional = (professional) => {
    setSelectedProfessional(professional);
    setLoading(true);
    fetchPublicSlots({ tenantSlug, professionalId: professional.id })
      .then((data) => setSlots(asList(data)))
      .catch(() => showToast({ type: "error", message: t.slotsFailed }))
      .finally(() => setLoading(false));
    setStep(2);
  };

  const pickSlot = (slot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const confirm = async () => {
    setSubmitting(true);
    let appointment;
    try {
      appointment = await createClientAppointment({
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        slotId: selectedSlot.id,
      });
    } catch (error) {
      const message =
        error?.response?.data?.slot?.[0] ||
        error?.response?.data?.detail ||
        t.confirmFailed;
      showToast({ type: "error", message });
      setSubmitting(false);
      return;
    }

    // O agendamento já foi criado com sucesso neste ponto. Se houver voucher
    // selecionado, tentamos aplicá-lo, mas uma falha aqui não desfaz o
    // agendamento — apenas avisamos o cliente.
    if (selectedVoucher && appointment?.id) {
      try {
        await applyClientVoucherToAppointment(appointment.id, selectedVoucher.id);
        showToast({ type: "success", message: t.confirmed });
      } catch (voucherError) {
        const message =
          voucherError?.response?.data?.client_voucher_id?.[0] ||
          voucherError?.response?.data?.detail?.[0] ||
          t.voucherApplyFailed;
        showToast({ type: "warning", message });
      }
    } else {
      showToast({ type: "success", message: t.confirmed });
    }

    setSubmitting(false);
    navigation.goBack();
  };

  const goBackStep = () => {
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setStep((prev) => prev - 1);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Button variant="link" onPress={goBackStep}>
          {t.back}
        </Button>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t.title}
        </Text>
      </View>

      {loading ? (
        <Text style={{ color: colors.textSecondary, padding: 24 }}>{t.loading}</Text>
      ) : (
        <>
          {step === 0 && (
            <FlatList
              data={services}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Card onPress={() => pickService(item)}>
                  <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                    {item.name}
                  </Text>
                </Card>
              )}
              ListEmptyComponent={
                <Text style={{ color: colors.textSecondary }}>
                  {t.noServices}
                </Text>
              }
            />
          )}

          {step === 1 && (
            <FlatList
              data={professionals}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Card onPress={() => pickProfessional(item)}>
                  <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                    {item.name}
                  </Text>
                </Card>
              )}
              ListEmptyComponent={
                <Text style={{ color: colors.textSecondary }}>
                  {t.noProfessionals}
                </Text>
              }
            />
          )}

          {step === 2 && (
            <FlatList
              data={slots}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const start = parseSlotDate(item.start_time);
                const end = parseSlotDate(item.end_time);
                return (
                  <Card onPress={() => pickSlot(item)}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                      {formatDateTimeRange(start, end)}
                    </Text>
                  </Card>
                );
              }}
              ListEmptyComponent={
                <Text style={{ color: colors.textSecondary }}>
                  {t.noSlots}
                </Text>
              }
            />
          )}

          {step === 3 && (
            <View style={styles.confirmContent}>
              <Card>
                <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                  {selectedService?.name}
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  {selectedProfessional?.name}
                </Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                  {formatDateTimeRange(
                    parseSlotDate(selectedSlot?.start_time),
                    parseSlotDate(selectedSlot?.end_time)
                  )}
                </Text>
              </Card>

              {vouchers.length > 0 && (
                <View style={styles.voucherSection}>
                  <Text style={[styles.voucherTitle, { color: colors.textPrimary }]}>
                    {t.voucherSectionTitle}
                  </Text>
                  <Card
                    onPress={() => setSelectedVoucher(null)}
                    variant={selectedVoucher === null ? "elevated" : "default"}
                  >
                    <Text style={{ color: colors.textPrimary }}>{t.voucherNone}</Text>
                  </Card>
                  {vouchers.map((voucher) => (
                    <Card
                      key={voucher.id}
                      onPress={() => setSelectedVoucher(voucher)}
                      variant={selectedVoucher?.id === voucher.id ? "elevated" : "default"}
                    >
                      <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                        {voucher.voucher_code}
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>
                        {describeVoucherBenefit(voucher, language)}
                      </Text>
                    </Card>
                  ))}
                </View>
              )}

              <Button
                variant="link"
                onPress={confirm}
                loading={submitting}
                disabled={submitting}
              >
                {t.confirm}
              </Button>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: { fontSize: 20, fontWeight: "700" },
  listContent: { padding: 20, gap: 12 },
  confirmContent: { padding: 20, gap: 16 },
  voucherSection: { gap: 8 },
  voucherTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
});
