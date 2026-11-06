import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import ClientVouchersScreen from "../ClientVouchersScreen";

jest.mock("../../../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      textPrimary: "#000",
      textSecondary: "#666",
      background: "#fff",
      surface: "#f8fafc",
      border: "#ccc",
      brandPrimary: "#3b82f6",
      success: "#22c55e",
      successBackground: "#eafaf1",
      error: "#ef4444",
      errorBackground: "#fdecea",
      info: "#3b82f6",
      infoBackground: "#eaf2fd",
    },
  }),
}));

let mockLanguage = "pt";
jest.mock("../../../contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: mockLanguage, setLanguage: jest.fn() }),
}));

const mockShowToast = jest.fn();
jest.mock("../../../contexts/ToastContext", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockFetchClientVouchers = jest.fn();
jest.mock("../../../services/clientBooking", () => ({
  fetchClientVouchers: (...args) => mockFetchClientVouchers(...args),
}));

function makeNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

describe("ClientVouchersScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage = "pt";
  });

  it("shows loading state while fetching", async () => {
    let resolve;
    mockFetchClientVouchers.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const { findByText } = await render(
      <ClientVouchersScreen navigation={makeNavigation()} />
    );
    expect(await findByText("Carregando vouchers…")).toBeTruthy();
    resolve([]);
  });

  it("shows the empty state when the client has no vouchers", async () => {
    mockFetchClientVouchers.mockResolvedValue([]);
    const { findByText } = await render(
      <ClientVouchersScreen navigation={makeNavigation()} />
    );
    expect(await findByText("Ainda não tens vouchers atribuídos.")).toBeTruthy();
  });

  it("renders vouchers with code, benefit summary and status", async () => {
    mockFetchClientVouchers.mockResolvedValue([
      {
        id: 1,
        voucher_code: "PROMO10",
        voucher_type: "percent",
        voucher_value: "10.00",
        status: "active",
      },
      {
        id: 2,
        voucher_code: "FREECUT",
        voucher_type: "free_service",
        voucher_value: null,
        status: "used",
      },
    ]);
    const { findByText } = await render(
      <ClientVouchersScreen navigation={makeNavigation()} />
    );
    expect(await findByText("Código: PROMO10")).toBeTruthy();
    expect(await findByText("10.00% de desconto")).toBeTruthy();
    expect(await findByText("Código: FREECUT")).toBeTruthy();
    expect(await findByText("Serviço grátis")).toBeTruthy();
    expect(await findByText("Ativo")).toBeTruthy();
    expect(await findByText("Usado")).toBeTruthy();
  });

  it("shows an error toast when loading fails", async () => {
    mockFetchClientVouchers.mockRejectedValue(new Error("network error"));
    await render(<ClientVouchersScreen navigation={makeNavigation()} />);
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "error",
        message: "Falha ao carregar vouchers.",
      })
    );
  });

  it("shows English copy when language is en", async () => {
    mockLanguage = "en";
    mockFetchClientVouchers.mockResolvedValue([]);
    const { findByText } = await render(
      <ClientVouchersScreen navigation={makeNavigation()} />
    );
    expect(await findByText("My vouchers")).toBeTruthy();
    expect(
      await findByText("You don't have any vouchers assigned yet.")
    ).toBeTruthy();
  });
});
