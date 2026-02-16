import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { useTenant } from "../hooks/useTenant";
import DashboardScreen from "../screens/DashboardScreen";
import BookingsNavigator from "./BookingsNavigator";
import CustomersScreen from "../screens/CustomersScreen";
import TeamScreen from "../screens/TeamScreen";

const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ name }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ color: colors.textPrimary }}>{name}</Text>
    </View>
  );
}; // Keep if needed for Horários

const HorariosScreen = () => <PlaceholderScreen name="Horários" />;

export default function TabNavigator() {
  const { colors } = useTheme();

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
          height: 80,
          paddingBottom: 12,
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
      <Tab.Screen
        name="Team"
        component={TeamScreen}
        options={{ tabBarLabel: "Equipe" }}
      />
      {/* 
      <Tab.Screen
        name="Horários"
        children={() => <PlaceholderScreen name="Horários" />}
        options={{ tabBarLabel: "Horários" }}
      />
      User didn't explicitly ask to remove Horários but said "remove button 'Mais'". 
      Typically 5 items max. 1.Home, 2.Agenda, 3.Clients, 4.Team, 5.Horarios fits.
      I will keep Horários as requested implicitly by omission of removal request? 
      "O botão de clientes e de equipe, pode colocar na barra de navegação e remover o botão de menu Mais".
      It doesn't say "remove Horários".
      */}
      <Tab.Screen
        name="Horários"
        component={HorariosScreen}
        options={{ tabBarLabel: "Horários" }}
      />
    </Tab.Navigator>
  );
}

