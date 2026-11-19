import { ActivityIndicator, Image, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function RootNavigator() {
  const { user, carregando } = useAuth();
  const { cores } = useTheme();

  if (carregando) {
    // Splash em JS: aparece no Expo Go, onde a splash nativa do app.json não entra em ação
    // (ela só é aplicada num build de verdade, não no cliente genérico do Expo Go).
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.bg, gap: 20 }}>
        <Image
          source={require('../../assets/splash-icon.png')}
          style={{ width: 140, height: 140 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={cores.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Deslogado: só login */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      {/* Logado: área do app (abas) */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
