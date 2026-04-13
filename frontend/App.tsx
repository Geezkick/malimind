import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NativeWindStyleSheet } from 'nativewind';

NativeWindStyleSheet.setOutput({
  default: "native",
});
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { useAuthStore } from './src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Platform, ActivityIndicator, useWindowDimensions, StyleSheet } from 'react-native';

import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { SynergyCircleScreen } from './src/screens/SynergyCircleScreen';
import { WorkScreen } from './src/screens/WorkScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PostJobScreen } from './src/screens/PostJobScreen';
import { WorkerProfileScreen } from './src/screens/WorkerProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ToastProvider } from './src/components/ToastProvider';
import { WebSidebar } from './src/components/WebSidebar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MaliTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#5B2EFF', // Royal Purple
    background: '#0A0A0B', // Obsidian Black
    card: '#111113', // Surface
    text: '#F9FAFB', // Soft White
    border: 'rgba(255,255,255,0.08)',
  },
};

// FORCE-FIRST WEB VISIBILITY & LAYOUT OVERRIDE
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root, [data-testid="app-container"] {
      background-color: #0A0A0B !important;
      color: #F9FAFB !important;
      display: flex !important;
      flex-direction: column !important;
      height: 100% !important;
      min-height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    /* Total Blackout Fix: Force all nested text elements to inherit Soft White */
    span, div, p, [class*="css-text"] {
      color: #F9FAFB !important;
    }

    /* Web Sidebar Scroll Fix */
    body {
       overflow-y: auto !important;
    }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #0A0A0B; }
    ::-webkit-scrollbar-thumb { background: #1E1E22; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #5B2EFF; }
  `;
  document.head.append(style);
}

function MainTabs() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 1024;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Synergy') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Work') iconName = focused ? 'briefcase' : 'briefcase-outline';
          else if (route.name === 'Mali') iconName = focused ? 'sparkles' : 'sparkles-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#5B2EFF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          display: isWeb ? 'none' : 'flex',
          backgroundColor: 'rgba(17, 17, 19, 0.8)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: Platform.OS === 'ios' ? 88 : 74,
          paddingBottom: Platform.OS === 'ios' ? 30 : 14,
          paddingTop: 12,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Synergy" component={SynergyCircleScreen} options={{ tabBarLabel: 'Synergy' }} />
      <Tab.Screen name="Work" component={WorkScreen} />
      <Tab.Screen name="Mali" component={ChatScreen} />
    </Tab.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0B' } }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PostJob"
        component={PostJobScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const { token, hydrated, hydrate } = useAuthStore();
  const { width } = useWindowDimensions();
  const navigationRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState('Home');

  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > 1024;

  useEffect(() => {
    hydrate();
  }, []);

  const handleStateChange = () => {
    const route = navigationRef.getCurrentRoute()?.name;
    if (route) setCurrentRoute(route);
  };

  const navigateTo = (route: string) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(route as never);
    }
  };

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#5B2EFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <View style={{ flex: 1, backgroundColor: '#0A0A0B' }}>
          <StatusBar style="light" />
          <QueryClientProvider client={queryClient}>
            <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column', height: '100%' }}>
              
              {token && isDesktop && (
                <WebSidebar 
                  activeRoute={currentRoute} 
                  onNavigate={navigateTo} 
                />
              )}

              <View style={{
                flex: 1,
                width: '100%',
                maxWidth: isDesktop ? undefined : (isWeb ? 850 : '100%'),
                alignSelf: 'center',
                backgroundColor: '#0A0A0B',
                shadowColor: '#000',
                shadowOpacity: (isWeb && !isDesktop) ? 0.8 : 0,
                shadowRadius: 50,
                // Layout coordination fix: ensure the container expands on web
                minHeight: (isWeb ? '100vh' : undefined) as any,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <NavigationContainer 
                  theme={MaliTheme} 
                  ref={navigationRef}
                  onStateChange={handleStateChange}
                >
                  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0B' } }}>
                    {token ? (
                      <Stack.Screen name="Authenticated" component={AuthenticatedStack} />
                    ) : (
                      <Stack.Screen name="Login" component={LoginScreen} />
                    )}
                  </Stack.Navigator>
                </NavigationContainer>
              </View>
            </View>
          </QueryClientProvider>
        </View>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
