import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from './src/store/authStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';


// Import Tailwind CSS for web
if (Platform.OS === 'web') {
  require('./web/tailwind.css');
}
import { ChatScreen } from './src/screens/ChatScreen';
import { SynergyCircleScreen } from './src/screens/SynergyCircleScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LiquidityRulesScreen } from './src/screens/LiquidityRulesScreen';
import { PulseAlertsScreen } from './src/screens/PulseAlertsScreen';
import { SessionManagementScreen } from './src/screens/SessionManagementScreen';
import { NetworkIntegrityScreen } from './src/screens/NetworkIntegrityScreen';
import { ToastProvider } from './src/components/ToastProvider';
import { UpgradeScreen } from './src/screens/UpgradeScreen';
import { useTranslation } from 'react-i18next';
import './src/i18n'; // Initialize i18n early

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111114',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.06)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: '#5B2EFF',
        tabBarInactiveTintColor: '#4B5563',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Mali') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Synergy') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Wallet') iconName = focused ? 'wallet' : 'wallet-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.dashboard') }} />
      <Tab.Screen name="Mali" component={ChatScreen} options={{ title: t('tabs.mali') }} />
      <Tab.Screen name="Synergy" component={SynergyCircleScreen} options={{ title: t('tabs.synergy') }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: t('tabs.wallet') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { token, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#5B2EFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Upgrade" component={UpgradeScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="LiquidityRules" component={LiquidityRulesScreen} />
          <Stack.Screen name="PulseAlerts" component={PulseAlertsScreen} />
          <Stack.Screen name="SessionManagement" component={SessionManagementScreen} />
          <Stack.Screen name="NetworkIntegrity" component={NetworkIntegrityScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
