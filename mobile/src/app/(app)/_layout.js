import { Alert, View } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Botao } from '../../components/ui';

export default function AppLayout() {
  const { user, isAdminReal, modoUsuario, alternarModoUsuario, logout } = useAuth();
  const { cores } = useTheme();

  const sair = () =>
    Alert.alert('Sair', `Sair da conta de ${user?.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.primary,
        tabBarInactiveTintColor: cores.muted,
        tabBarStyle: { backgroundColor: cores.card, borderTopColor: cores.border },
        headerStyle: { backgroundColor: cores.card },
        headerTintColor: cores.text,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            {/* Admin em preview: atalho rápido pra voltar, em qualquer aba */}
            {isAdminReal && modoUsuario && (
              <Botao titulo="Voltar p/ admin" variante="contorno" pequeno onPress={alternarModoUsuario} />
            )}
            <Botao titulo="Sair" variante="link" pequeno onPress={sair} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="movimentacoes"
        options={{
          title: 'Movimentações',
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical-outline" size={size} color={color} />,
        }}
      />

      {/* Aba só aparece (e só é acessível) pra quem É admin de verdade — fica visível mesmo
          durante o modo "visão de usuário", senão o admin não teria como voltar. */}
      <Tabs.Protected guard={isAdminReal}>
        <Tabs.Screen
          name="usuarios"
          options={{
            title: 'Usuários',
            tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          }}
        />
      </Tabs.Protected>
    </Tabs>
  );
}
