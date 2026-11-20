import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ClientProfileScreen from "../ClientProfileScreen";

jest.mock("../../../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      textPrimary: "#000",
      textSecondary: "#666",
      background: "#fff",
      surface: "#f8fafc",
      border: "#ccc",
      brandPrimary: "#3b82f6",
      error: "#ef4444",
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
  useClientAuth: () => ({
    clientInfo: { name: "Ana", phone_number: "+351911111111", email: "ana@x.com", photo: null },
    refreshProfile: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock("../../../components/ThemeToggle", () => ({ ThemeToggle: () => null }));
jest.mock("../../../components/LanguageToggle", () => ({ LanguageToggle: () => null }));

jest.mock("../../components/ClientFormsSection", () => () => null);

const mockUpdatePhoto = jest.fn();
jest.mock("../../../services/clientBooking", () => ({
  updateClientProfile: jest.fn(),
  updateClientProfilePhoto: (...args) => mockUpdatePhoto(...args),
}));

const mockLaunch = jest.fn();
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: (...args) => mockLaunch(...args),
  MediaTypeOptions: { Images: "Images" },
}));

describe("ClientProfileScreen - foto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejeita foto acima de 2000x2000 px com toast claro e não envia ao BE", async () => {
    mockLaunch.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///tmp/big.jpg", mimeType: "image/jpeg", fileName: "big.jpg", fileSize: 500000, width: 4032, height: 3024 }],
    });

    const { getByText } = await render(<ClientProfileScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />);
    await fireEvent.press(getByText("Adicionar foto"));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "error",
        message: "A imagem deve ter entre 50x50 e 2000x2000 pixels.",
      })
    );
    expect(mockUpdatePhoto).not.toHaveBeenCalled();
  });

  it("envia ao BE uma foto dentro dos limites", async () => {
    mockUpdatePhoto.mockResolvedValue({});
    mockLaunch.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///tmp/ok.jpg", mimeType: "image/jpeg", fileName: "ok.jpg", fileSize: 100000, width: 800, height: 600 }],
    });

    const { getByText } = await render(<ClientProfileScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />);
    await fireEvent.press(getByText("Adicionar foto"));

    await waitFor(() => expect(mockUpdatePhoto).toHaveBeenCalledTimes(1));
  });
});
