import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { useTenant } from "../hooks/useTenant";
import { ThemeToggle } from "../components/ThemeToggle";
import DashboardScreen from "../screens/DashboardScreen";

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
};
export default function TabNavigator() {
  const { colors } = useTheme();
  const { tenant } = useTenant();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState("pt");

  const expandedLinks = [
    { key: "customers", label: "Clientes", icon: "people-outline" },
    { key: "team", label: "Equipe", icon: "people-circle-outline" },
    { key: "reports", label: "Relatórios", icon: "bar-chart-outline" },
    { key: "feedback", label: "Feedback", icon: "star-outline" },
    { key: "plans", label: "Planos", icon: "pricetag-outline" },
    { key: "settings", label: "Configurações", icon: "settings-outline" },
  ];

  return (
    <>
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
            } else if (route.name === "Horários") {
              iconName = focused ? "time" : "time-outline";
            } else if (route.name === "Mais") {
              iconName = isMenuOpen ? "close" : "ellipsis-horizontal";
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
          children={() => <PlaceholderScreen name="Agendamentos" />}
          options={{ tabBarLabel: "Agendamentos" }}
        />
        <Tab.Screen
          name="Horários"
          children={() => <PlaceholderScreen name="Horários" />}
          options={{ tabBarLabel: "Horários" }}
        />
        <Tab.Screen
          name="Mais"
          children={() => <PlaceholderScreen name="Mais" />}
          options={{
            tabBarLabel: "Mais",
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                activeOpacity={0.7}
                onPress={() => setIsMenuOpen((prev) => !prev)}
              />
            ),
          }}
        />
      </Tab.Navigator>

      {isMenuOpen && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(15,23,42,0.7)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setIsMenuOpen(false)}
          />
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 96,
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.textPrimary,
                  }}
                >
                  {tenant?.name || "Salonix"}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  Menu rápido
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  columnGap: 12,
                }}
              >
                <ThemeToggle size={22} />
                <TouchableOpacity
                  onPress={() =>
                    setLanguage((prev) => (prev === "pt" ? "en" : "pt"))
                  }
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceVariant,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {language === "pt" ? "PT" : "EN"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {expandedLinks.map((link) => (
                <TouchableOpacity
                  key={link.key}
                  style={{
                    width: "48%",
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceVariant,
                    alignItems: "center",
                  }}
                  activeOpacity={0.8}
                  onPress={() => setIsMenuOpen(false)}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons
                      name={link.icon}
                      size={22}
                      color={colors.textPrimary}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: colors.textPrimary,
                      textAlign: "center",
                      textDecorationLine: "underline",
                    }}
                  >
                    {link.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </>
  );
}
