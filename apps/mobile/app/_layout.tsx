import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0b3d2e" },
            headerTintColor: "#f5e9c8",
            contentStyle: { backgroundColor: "#0b3d2e" },
          }}
        >
          <Stack.Screen name="index" options={{ title: "King" }} />
          <Stack.Screen name="local" options={{ title: "Yerel Oyun" }} />
          <Stack.Screen name="single" options={{ title: "Tek Kişilik" }} />
          <Stack.Screen name="online" options={{ title: "Online" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
