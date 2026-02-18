import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import DashboardScreen from "../screens/DashboardScreen";
import BookingsNavigator from "./BookingsNavigator";
import CustomersScreen from "../screens/CustomersScreen";
import TeamScreen from "../screens/TeamScreen";
import SlotsScreen from "../screens/SlotsScreen";
import {
  addNotificationListeners,
  handleInitialNotificationNavigation,
  setNotificationNavigationHandler,
} from "../services/notifications";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors } = useTheme();
  const { userInfo } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const isCollaborator = userInfo?.staff_role === "collaborator";

  useEffect(() => {
    setNotificationNavigationHandler((data) => {
      const route =
        data && typeof data.route === "string" ? data.route : undefined;
      let bookingId;

      if (route && route.startsWith("appointment/")) {
        const parts = route.split("/");
        if (parts[1]) {
          bookingId = parts[1];
        }
      } else {
        const rawBookingId =
          (data && data.bookingId) ??
          (data && data.booking_id) ??
          (data && data.appointment_id);
        if (
          typeof rawBookingId === "string" ||
          typeof rawBookingId === "number"
        ) {
          bookingId = String(rawBookingId);
        }
      }

      console.log("[Notifications] Navigation handler", {
        route,
        bookingId,
      });

      if (bookingId) {
        navigation.navigate("Agendamentos", {
          screen: "BookingDetail",
          params: {
            bookingId,
          },
        });
        return;
      }

      navigation.navigate("Agendamentos");
    });

    addNotificationListeners();

    handleInitialNotificationNavigation().catch((error) => {
      console.warn(
        "[Notifications] Failed to handle initial notification response",
        error,
      );
    });

    return () => {
      setNotificationNavigationHandler(null);
    };
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 0,
          marginBottom: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Agendamentos") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Customers") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Team") {
            iconName = focused ? "people-circle" : "people-circle-outline";
          } else if (route.name === "Horários") {
            iconName = focused ? "time" : "time-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={20}
              color={color}
              style={{ marginBottom: 0 }}
            />
          );
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: "Início" }}
      />
      <Tab.Screen
        name="Agendamentos"
        component={BookingsNavigator}
        options={{ tabBarLabel: "Agenda" }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{ tabBarLabel: "Clientes" }}
      />
      {!isCollaborator && (
        <Tab.Screen
          name="Team"
          component={TeamScreen}
          options={{ tabBarLabel: "Equipe" }}
        />
      )}
      <Tab.Screen
        name="Horários"
        component={SlotsScreen}
        options={{ tabBarLabel: "Horários" }}
      />
    </Tab.Navigator>
  );
}
