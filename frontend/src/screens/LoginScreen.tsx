import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';

export const LoginScreen = () => {
  const [email, setEmail] = useState('john@example.com');
  const [password, setPassword] = useState('password123');
  const [isLogin, setIsLogin] = useState(true);
  const login = useAuthStore((state) => state.login);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        const { data } = await apiClient.post('/auth/login', { email, password });
        login(data.token, data.user);
      } else {
        const { data } = await apiClient.post('/auth/register', { 
            name: 'New User', 
            email, 
            password 
        });
        login(data.token, data.user);
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-primary-50">
      <View className="mb-10 items-center">
        <Text className="text-4xl font-bold text-primary-900 mb-2">MaliMind</Text>
        <Text className="text-lg text-gray-600">Your AI Financial Copilot</Text>
      </View>

      <View className="space-y-4">
        <TextInput
          className="bg-white p-4 rounded-xl border border-gray-200"
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          className="bg-white p-4 rounded-xl border border-gray-200"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          className="bg-primary-600 p-4 rounded-xl items-center mt-4"
          onPress={handleAuth}
        >
          <Text className="text-white font-bold text-lg">
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="items-center mt-6"
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text className="text-primary-600 font-semibold">
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
