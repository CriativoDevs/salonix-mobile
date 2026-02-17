import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BookingsScreen from "../screens/BookingsScreen";
import BookingDetailScreen from "../screens/BookingDetailScreen";
import BookingCreateScreen from "../screens/BookingCreateScreen";

const Stack = createNativeStackNavigator();

const BookingsNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="BookingsList"
        component={BookingsScreen}
      />
      <Stack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
      />
      <Stack.Screen
        name="BookingCreate"
        component={BookingCreateScreen}
      />
    </Stack.Navigator>
  );
};

export default BookingsNavigator;
