import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ClientAuthProvider } from "../../contexts/ClientAuthContext";
import { useClientAuth } from "../../hooks/useClientAuth";
import { useTheme } from "../../hooks/useTheme";
import ClientLoginScreen from "../screens/ClientLoginScreen";
import ClientAppointmentsScreen from "../screens/ClientAppointmentsScreen";
import ClientBookingCreateScreen from "../screens/ClientBookingCreateScreen";
import ClientProfileScreen from "../screens/ClientProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ClientTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === "ClientAppointments" ? "calendar-outline" : "person-outline";
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="ClientAppointments"
        component={ClientAppointmentsScreen}
        options={{ title: "Agendamentos" }}
      />
      <Tab.Screen
        name="ClientProfile"
        component={ClientProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
}

function ClientRoutes() {
  const { isAuthenticated } = useClientAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="ClientHome" component={ClientTabs} />
          <Stack.Screen
            name="ClientBookingCreate"
            component={ClientBookingCreateScreen}
          />
        </>
      ) : (
        <Stack.Screen name="ClientLogin" component={ClientLoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function ClientNavigator() {
  return (
    <ClientAuthProvider>
      <ClientRoutes />
    </ClientAuthProvider>
  );
}
