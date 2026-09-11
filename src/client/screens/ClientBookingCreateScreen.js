import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../contexts/ToastContext";
import { useClientAuth } from "../../hooks/useClientAuth";
import { Button, Card } from "../../components/ui";
import { parseSlotDate, formatDateTimeRange } from "../../utils/date";
import { fetchServices } from "../../api/services";
import { fetchProfessionals } from "../../api/professionals";
import { fetchPublicSlots, createClientAppointment } from "../../services/clientBooking";

function asList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

const STEPS = ["service", "professional", "slot", "confirm"];

export default function ClientBookingCreateScreen({ navigation }) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { tenantSlug } = useClientAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (!tenantSlug) return;
    setLoading(true);
    fetchServices({ slug: tenantSlug })
      .then((data) => setServices(asList(data)))
      .catch(() => showToast({ type: "error", message: "Falha ao carregar serviços." }))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  const pickService = (service) => {
    setSelectedService(service);
    setLoading(true);
    fetchProfessionals({ slug: tenantSlug })
      .then((data) => setProfessionals(asList(data)))
      .catch(() =>
        showToast({ type: "error", message: "Falha ao carregar profissionais." })
      )
      .finally(() => setLoading(false));
    setStep(1);
  };

  const pickProfessional = (professional) => {
    setSelectedProfessional(professional);
    setLoading(true);
    fetchPublicSlots({ tenantSlug, professionalId: professional.id })
      .then((data) => setSlots(asList(data)))
      .catch(() => showToast({ type: "error", message: "Falha ao carregar horários." }))
      .finally(() => setLoading(false));
    setStep(2);
  };

  const pickSlot = (slot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const confirm = async () => {
    setSubmitting(true);
    try {
      await createClientAppointment({
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        slotId: selectedSlot.id,
      });
      showToast({ type: "success", message: "Agendamento confirmado!" });
      navigation.goBack();
    } catch (error) {
      const message =
        error?.response?.data?.slot?.[0] ||
        error?.response?.data?.detail ||
        "Não foi possível confirmar o agendamento.";
      showToast({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
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
          Voltar
        </Button>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Novo agendamento
        </Text>
      </View>

      {loading ? (
        <Text style={{ color: colors.textSecondary, padding: 24 }}>Carregando…</Text>
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
                  Nenhum serviço disponível.
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
                  Nenhum profissional disponível.
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
                  Nenhum horário disponível para este profissional.
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
              <Button
                variant="primary"
                onPress={confirm}
                loading={submitting}
                disabled={submitting}
              >
                Confirmar agendamento
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
});
