import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClientHomePlaceholderScreen from "../screens/ClientHomePlaceholderScreen";

const Stack = createNativeStackNavigator();

export default function ClientNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientHome" component={ClientHomePlaceholderScreen} />
    </Stack.Navigator>
  );
}
