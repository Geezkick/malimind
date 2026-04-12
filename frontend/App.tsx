import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { useAuthStore } from './src/store/authStore';
import { Ionicons } from '@expo/vector-icons';

import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ChamaScreen } from './src/screens/ChamaScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Chamas') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'AI Chat') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chamas" component={ChamaScreen} />
      <Tab.Screen name="AI Chat" component={ChatScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
