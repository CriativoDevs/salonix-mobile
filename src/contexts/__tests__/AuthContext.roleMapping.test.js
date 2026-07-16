/**
 * AuthContext.roleMapping.test.js
 *
 * Bug: o backend devolve o papel do utilizador em `staff_role`
 * ("owner"|"manager"|"collaborator"), mas vários ecrãs (BusinessHoursScreen,
 * BrandingScreen, NotificationsScreen, SlotFormModal) leem `userInfo.role`.
 * Sem este mapeamento, `isAdmin` avalia sempre `false`, mesmo para um owner
 * real — foi reportado pelo Pablo ao testar no Expo Go (não conseguia editar
 * a Marca nem enviar logo).
 */
import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";

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
const { getStaffProfile, loginStaff } = require("../../services/auth");
const { registerForPushNotificationsAsync } = require("../../services/notifications");

const { AuthProvider, AuthContext } = require("../AuthContext");

const RoleConsumer = () => {
  const { userInfo, login } = React.useContext(AuthContext);
  return (
    <>
      <Text>{`role:${userInfo?.role} staff_role:${userInfo?.staff_role}`}</Text>
      <Pressable onPress={() => login("owner@acme.pt", "secret")}>
        <Text>fazer login</Text>
      </Pressable>
    </>
  );
};

describe("AuthContext - mapeamento de staff_role para role", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initializeTokens.mockResolvedValue(undefined);
    registerForPushNotificationsAsync.mockResolvedValue({ token: null });
  });

  it("mapeia staff_role para role no bootstrap de sessão restaurada", async () => {
    getRefreshToken.mockReturnValue("existing-refresh-token");
    getStaffProfile.mockResolvedValue({
      user: { id: 3, email: "owner@acme.pt", staff_role: "owner" },
      tenant: { slug: "acme" },
    });

    const { getByText } = await render(
      <AuthProvider>
        <RoleConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText("role:owner staff_role:owner")).toBeTruthy();
    });
  });

  it("mapeia staff_role para role apos login()", async () => {
    getRefreshToken.mockReturnValue(null);
    loginStaff.mockResolvedValue({
      user: { id: 5, email: "owner@acme.pt", staff_role: "owner" },
      tenant: { slug: "acme" },
    });
    getStaffProfile.mockResolvedValue({
      user: { id: 5, email: "owner@acme.pt", staff_role: "owner" },
      tenant: { slug: "acme" },
    });

    const { getByText } = await render(
      <AuthProvider>
        <RoleConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(initializeTokens).toHaveBeenCalled());
    await fireEvent.press(getByText("fazer login"));

    await waitFor(() => {
      expect(getByText("role:owner staff_role:owner")).toBeTruthy();
    });
  });
});
