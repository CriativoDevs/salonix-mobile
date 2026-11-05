import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ClientBookingCreateScreen from "../ClientBookingCreateScreen";

jest.mock("../../../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      textPrimary: "#000",
      textSecondary: "#666",
      background: "#fff",
      surface: "#f8fafc",
      border: "#ccc",
      brandPrimary: "#3b82f6",
    },
  }),
}));

jest.mock("../../../contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "pt", setLanguage: jest.fn() }),
}));

const mockShowToast = jest.fn();
jest.mock("../../../contexts/ToastContext", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock("../../../hooks/useClientAuth", () => ({
  useClientAuth: () => ({ tenantSlug: "acme" }),
}));

const mockFetchServices = jest.fn();
jest.mock("../../../api/services", () => ({
  fetchServices: (...args) => mockFetchServices(...args),
}));

const mockFetchProfessionals = jest.fn();
jest.mock("../../../api/professionals", () => ({
  fetchProfessionals: (...args) => mockFetchProfessionals(...args),
}));

const mockFetchPublicSlots = jest.fn();
const mockCreateClientAppointment = jest.fn();
const mockFetchClientVouchers = jest.fn();
const mockApplyClientVoucherToAppointment = jest.fn();
jest.mock("../../../services/clientBooking", () => ({
  fetchPublicSlots: (...args) => mockFetchPublicSlots(...args),
  createClientAppointment: (...args) => mockCreateClientAppointment(...args),
  fetchClientVouchers: (...args) => mockFetchClientVouchers(...args),
  applyClientVoucherToAppointment: (...args) =>
    mockApplyClientVoucherToAppointment(...args),
}));

function makeNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

const SERVICE = { id: 1, name: "Corte" };
const PROFESSIONAL = { id: 2, name: "Joana" };
const SLOT = {
  id: 3,
  start_time: "2026-08-30T10:00:00",
  end_time: "2026-08-30T10:30:00",
};
const ACTIVE_VOUCHER = {
  id: 10,
  voucher_code: "PROMO10",
  voucher_type: "percent",
  voucher_value: "10.00",
  status: "active",
};

async function goToConfirmStep(getByText, findByText) {
  await fireEvent.press(await findByText("Corte"));
  await fireEvent.press(await findByText("Joana"));
  await fireEvent.press(await findByText(/10:00/));
}

describe("ClientBookingCreateScreen voucher selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchServices.mockResolvedValue([SERVICE]);
    mockFetchProfessionals.mockResolvedValue([PROFESSIONAL]);
    mockFetchPublicSlots.mockResolvedValue([SLOT]);
    mockFetchClientVouchers.mockResolvedValue([ACTIVE_VOUCHER]);
  });

  it("does not show the voucher section when the client has no active vouchers", async () => {
    mockFetchClientVouchers.mockResolvedValue([]);
    const { findByText, queryByText } = await render(
      <ClientBookingCreateScreen navigation={makeNavigation()} />
    );
    await goToConfirmStep(null, findByText);
    expect(queryByText("Usar voucher")).toBeNull();
  });

  it("shows the voucher section with the benefit summary for active vouchers only", async () => {
    mockFetchClientVouchers.mockResolvedValue([
      ACTIVE_VOUCHER,
      { id: 11, voucher_code: "USED1", voucher_type: "fixed", voucher_value: "5.00", status: "used" },
    ]);
    const { findByText, queryByText } = await render(
      <ClientBookingCreateScreen navigation={makeNavigation()} />
    );
    await goToConfirmStep(null, findByText);

    expect(await findByText("Usar voucher")).toBeTruthy();
    expect(await findByText("PROMO10")).toBeTruthy();
    expect(await findByText("10.00% de desconto")).toBeTruthy();
    expect(queryByText("USED1")).toBeNull();
  });

  it("creates the appointment and applies the selected voucher on confirm", async () => {
    mockCreateClientAppointment.mockResolvedValue({ id: 99 });
    mockApplyClientVoucherToAppointment.mockResolvedValue({ id: 10, status: "used" });

    const { findByText } = await render(
      <ClientBookingCreateScreen navigation={makeNavigation()} />
    );
    await goToConfirmStep(null, findByText);

    await fireEvent.press(await findByText("PROMO10"));
    await fireEvent.press(await findByText("Confirmar agendamento"));

    await waitFor(() => {
      expect(mockCreateClientAppointment).toHaveBeenCalledWith({
        serviceId: SERVICE.id,
        professionalId: PROFESSIONAL.id,
        slotId: SLOT.id,
      });
      expect(mockApplyClientVoucherToAppointment).toHaveBeenCalledWith(99, 10);
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "success",
        message: "Agendamento confirmado!",
      });
    });
  });

  it("does not apply any voucher when 'Não usar voucher' stays selected (default)", async () => {
    mockCreateClientAppointment.mockResolvedValue({ id: 99 });

    const { findByText } = await render(
      <ClientBookingCreateScreen navigation={makeNavigation()} />
    );
    await goToConfirmStep(null, findByText);
    await fireEvent.press(await findByText("Confirmar agendamento"));

    await waitFor(() => {
      expect(mockCreateClientAppointment).toHaveBeenCalled();
      expect(mockApplyClientVoucherToAppointment).not.toHaveBeenCalled();
    });
  });

  it("keeps the appointment created and shows a warning toast when applying the voucher fails", async () => {
    mockCreateClientAppointment.mockResolvedValue({ id: 99 });
    mockApplyClientVoucherToAppointment.mockRejectedValue({
      response: { data: { client_voucher_id: ["Este voucher já foi usado."] } },
    });

    const navigation = makeNavigation();
    const { findByText } = await render(
      <ClientBookingCreateScreen navigation={navigation} />
    );
    await goToConfirmStep(null, findByText);

    await fireEvent.press(await findByText("PROMO10"));
    await fireEvent.press(await findByText("Confirmar agendamento"));

    await waitFor(() => {
      expect(mockCreateClientAppointment).toHaveBeenCalled();
      expect(mockApplyClientVoucherToAppointment).toHaveBeenCalledWith(99, 10);
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "warning",
        message: "Este voucher já foi usado.",
      });
      // O agendamento já foi criado, então o fluxo segue normalmente.
      expect(navigation.goBack).toHaveBeenCalled();
    });
  });

  it("falls back to a generic message when the apply-voucher error has no recognizable field", async () => {
    mockCreateClientAppointment.mockResolvedValue({ id: 99 });
    mockApplyClientVoucherToAppointment.mockRejectedValue(new Error("network error"));

    const { findByText } = await render(
      <ClientBookingCreateScreen navigation={makeNavigation()} />
    );
    await goToConfirmStep(null, findByText);

    await fireEvent.press(await findByText("PROMO10"));
    await fireEvent.press(await findByText("Confirmar agendamento"));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "warning",
        message: "O agendamento foi criado, mas não foi possível aplicar o voucher.",
      });
    });
  });
});
