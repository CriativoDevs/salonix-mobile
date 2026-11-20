import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
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

const mockSetStringAsync = jest.fn();
jest.mock("expo-clipboard", () => ({
  setStringAsync: (...args) => mockSetStringAsync(...args),
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
    expect(await findByText("PROMO10")).toBeTruthy();
    expect(await findByText("10.00% de desconto")).toBeTruthy();
    expect(await findByText("FREECUT")).toBeTruthy();
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

  describe("redesign (MOB-CLIENT-VOUCHER-02)", () => {
    const active = {
      id: 1,
      voucher_code: "PROMO10",
      voucher_type: "percent",
      voucher_value: "10.00",
      status: "active",
      assigned_at: "2026-11-10T10:00:00Z",
      used_at: null,
    };
    const used = {
      id: 2,
      voucher_code: "FREECUT",
      voucher_type: "free_service",
      voucher_value: null,
      status: "used",
      assigned_at: "2026-10-01T10:00:00Z",
      used_at: "2026-10-15T10:00:00Z",
    };

    it("copia o código de um voucher ativo e avisa com toast", async () => {
      mockSetStringAsync.mockResolvedValue(true);
      mockFetchClientVouchers.mockResolvedValue([active]);
      const { findByLabelText } = await render(
        <ClientVouchersScreen navigation={makeNavigation()} />
      );

      fireEvent.press(await findByLabelText("Copiar código PROMO10"));

      await waitFor(() => expect(mockSetStringAsync).toHaveBeenCalledWith("PROMO10"));
      await waitFor(() =>
        expect(mockShowToast).toHaveBeenCalledWith({
          type: "success",
          message: "Código copiado.",
        })
      );
    });

    it("avisa com toast de erro quando a cópia falha", async () => {
      mockSetStringAsync.mockRejectedValue(new Error("no clipboard"));
      mockFetchClientVouchers.mockResolvedValue([active]);
      const { findByLabelText } = await render(
        <ClientVouchersScreen navigation={makeNavigation()} />
      );

      fireEvent.press(await findByLabelText("Copiar código PROMO10"));

      await waitFor(() =>
        expect(mockShowToast).toHaveBeenCalledWith({
          type: "error",
          message: "Não foi possível copiar o código.",
        })
      );
    });

    it("não oferece copiar para voucher usado ou expirado", async () => {
      mockFetchClientVouchers.mockResolvedValue([
        used,
        { ...used, id: 3, voucher_code: "OLD", status: "expired", used_at: null },
      ]);
      const { findByText, queryByLabelText } = await render(
        <ClientVouchersScreen navigation={makeNavigation()} />
      );

      expect(await findByText("FREECUT")).toBeTruthy();
      expect(queryByLabelText("Copiar código FREECUT")).toBeNull();
      expect(queryByLabelText("Copiar código OLD")).toBeNull();
    });

    it("mostra a data de atribuição e, quando usado, a data de uso", async () => {
      mockFetchClientVouchers.mockResolvedValue([active, used]);
      const { findByText, findAllByText } = await render(
        <ClientVouchersScreen navigation={makeNavigation()} />
      );

      expect((await findAllByText(/Atribuído em/)).length).toBe(2);
      expect(await findByText(/Usado em/)).toBeTruthy();
    });

    it("não quebra com data inválida ou ausente", async () => {
      mockFetchClientVouchers.mockResolvedValue([
        { ...active, assigned_at: null },
        { ...active, id: 9, voucher_code: "BAD", assigned_at: "not-a-date" },
      ]);
      const { findByText, queryByText } = await render(
        <ClientVouchersScreen navigation={makeNavigation()} />
      );

      expect(await findByText("BAD")).toBeTruthy();
      expect(queryByText(/Atribuído em/)).toBeNull();
    });

    it("mostra textos em inglês no cartão", async () => {
      mockLanguage = "en";
      mockFetchClientVouchers.mockResolvedValue([active]);
      const { findByText, findByLabelText } = await render(
        <ClientVouchersScreen navigation={makeNavigation()} />
      );

      expect(await findByText("10.00% discount")).toBeTruthy();
      expect(await findByText(/Assigned on/)).toBeTruthy();
      expect(await findByLabelText("Copy code PROMO10")).toBeTruthy();
    });
  });
});
