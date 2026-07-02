/**
 * AuthContext.pushRegistration.test.js
 *
 * MOB-PUSH-REREGISTER: garante que o push token e (re)registado sempre que
 * a app tem uma sessao autenticada valida - seja por login fresco, seja por
 * sessao restaurada no arranque (bootstrap), nao apenas no login() explicito.
 *
 * Bug original: utilizadores com sessao persistida (refresh token rotation)
 * nunca passam de novo pelo login() apos reinstalar o app, logo o push token
 * novo do build nativo nunca era enviado ao backend.
 */
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

jest.mock("../../utils/authStorage", () => ({
  getRefreshToken: jest.fn(),
  initializeTokens: jest.fn(),
  setLogoutHandler: jest.fn(),
}));

jest.mock("../../services/auth", () => ({
  loginStaff: jest.fn(),
  logout: jest.fn(),
  getStaffProfile: jest.fn(),
  getTenantInfo: jest.fn(),
}));

jest.mock("../../api/auth", () => ({
  registerPushToken: jest.fn(),
}));

jest.mock("../../services/notifications", () => ({
  registerForPushNotificationsAsync: jest.fn(),
  getPlatformInfo: jest.fn(() => ({ platform: "ios", appVersion: "1.0.0" })),
}));

jest.mock("../../utils/tenantStorage", () => ({
  clearStoredTenantSlug: jest.fn(),
  storeTenantSlug: jest.fn(),
}));

const { getRefreshToken, initializeTokens } = require("../../utils/authStorage");
const { getStaffProfile } = require("../../services/auth");
const { registerPushToken } = require("../../api/auth");
const {
  registerForPushNotificationsAsync,
} = require("../../services/notifications");

const { AuthProvider, AuthContext } = require("../AuthContext");

const Consumer = () => {
  const { isLoading, isAuthenticated } = React.useContext(AuthContext);
  return (
    <Text>
      {`loading:${isLoading} auth:${isAuthenticated}`}
    </Text>
  );
};

describe("AuthContext - bootstrap com sessao restaurada", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initializeTokens.mockResolvedValue(undefined);
    registerForPushNotificationsAsync.mockResolvedValue({
      token: "ExponentPushToken[bootstrap-test]",
    });
    registerPushToken.mockResolvedValue({ ok: true });
  });

  it("regista o push token quando a sessao e restaurada no arranque (sem passar por login())", async () => {
    getRefreshToken.mockReturnValue("existing-refresh-token");
    getStaffProfile.mockResolvedValue({
      user: { id: 3, email: "pablo@example.com" },
      tenant: { slug: "acme" },
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getStaffProfile).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(registerForPushNotificationsAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(registerPushToken).toHaveBeenCalledWith(
        "ExponentPushToken[bootstrap-test]",
        "ios",
        "1.0.0",
        "acme",
      );
    });
  });

  it("nao tenta registar push token quando nao ha sessao restaurada", async () => {
    getRefreshToken.mockReturnValue(null);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(initializeTokens).toHaveBeenCalled();
    });

    expect(registerForPushNotificationsAsync).not.toHaveBeenCalled();
  });
});
