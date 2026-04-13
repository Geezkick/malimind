import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Svg, Path, Circle, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { MaliButton } from '../components/MaliButton';
import { MalimindLogo } from '../components/MalimindLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Real Google "G" SVG icon with official brand colors
const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export const LoginScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = 'Please fill in all required fields.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Required Fields', msg);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      if (isLogin) {
        const { data } = await apiClient.post('/auth/login', { email, password });
        login(data.token, data.user);
      } else {
        const { data } = await apiClient.post('/auth/register', { name, email, password });
        login(data.token, data.user);
      }
    } catch (e: any) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e.response?.data?.message || 'Authentication failed. Please try again.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg = `${provider} sign-in is being configured.`;
    if (Platform.OS === 'web') alert(msg);
    else Alert.alert('Coming Soon', msg);
  };

  const switchMode = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setIsLogin(!isLogin);
  };

  const inputStyle = (field: string) => ({
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: focusedInput === field ? 'rgba(91,46,255,0.05)' : 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: focusedInput === field ? '#5B2EFF' : 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0B' }}>
      {/* Ambient glows */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', top: -100, left: -80,
          width: 350, height: 350, borderRadius: 175,
          backgroundColor: 'rgba(91,46,255,0.08)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', bottom: -80, right: -60,
          width: 280, height: 280, borderRadius: 140,
          backgroundColor: 'rgba(57,255,20,0.04)',
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'space-between',
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── LOGO ── */}
          <Animated.View style={{ alignItems: 'center', opacity: fadeAnim }}>
            <MalimindLogo width={220} variant="full" />
          </Animated.View>

          {/* ── FORM ── */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Card */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
              borderRadius: 28,
              padding: 28,
            }}>

              {/* Heading */}
              <View style={{ marginBottom: 28 }}>
                <Text style={{ color: '#F9FAFB', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 }}>
                  {isLogin ? 'Sign in' : 'Create account'}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>
                  {isLogin ? 'Welcome back to Malimind' : 'Start your financial journey today'}
                </Text>
              </View>

              {/* ── INPUTS ── */}
              {!isLogin && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 2 }}>Full Name</Text>
                  <View style={inputStyle('name')}>
                    <Ionicons name="person-outline" size={17} color={focusedInput === 'name' ? '#5B2EFF' : '#4B5563'} style={{ marginRight: 12 }} />
                    <TextInput
                      style={[{ flex: 1, color: '#F9FAFB', fontSize: 16, fontWeight: '500' }, Platform.OS === 'web' ? { outline: 'none' } as any : {}]}
                      placeholder="John Kamau"
                      placeholderTextColor="#374151"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 2 }}>Email</Text>
                <View style={inputStyle('email')}>
                  <Ionicons name="mail-outline" size={17} color={focusedInput === 'email' ? '#5B2EFF' : '#4B5563'} style={{ marginRight: 12 }} />
                  <TextInput
                    style={[{ flex: 1, color: '#F9FAFB', fontSize: 16, fontWeight: '500' }, Platform.OS === 'web' ? { outline: 'none' } as any : {}]}
                    placeholder="name@company.com"
                    placeholderTextColor="#374151"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginHorizontal: 2 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Password</Text>
                  {isLogin && (
                    <TouchableOpacity>
                      <Text style={{ color: '#5B2EFF', fontSize: 12, fontWeight: '700' }}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={inputStyle('password')}>
                  <Ionicons name="lock-closed-outline" size={17} color={focusedInput === 'password' ? '#5B2EFF' : '#4B5563'} style={{ marginRight: 12 }} />
                  <TextInput
                    style={[{ flex: 1, color: '#F9FAFB', fontSize: 16, fontWeight: '500' }, Platform.OS === 'web' ? { outline: 'none' } as any : {}]}
                    placeholder="••••••••"
                    placeholderTextColor="#374151"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary CTA */}
              <MaliButton
                variant="glow"
                title={loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                onPress={handleAuth}
                disabled={loading}
              />

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <Text style={{ color: '#4B5563', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginHorizontal: 12 }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
              </View>

              {/* Social Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Apple – white pill, iOS native style */}
                <TouchableOpacity
                  onPress={() => handleSocialAuth('Apple')}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 52,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
                  }}
                >
                  <Ionicons name="logo-apple" size={20} color="#000000" />
                  <Text style={{ color: '#000000', fontWeight: '700', fontSize: 15, letterSpacing: -0.3 }}>Apple</Text>
                </TouchableOpacity>

                {/* Google – dark pill with real G icon */}
                <TouchableOpacity
                  onPress={() => handleSocialAuth('Google')}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 52,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 14,
                  }}
                >
                  <GoogleIcon size={20} />
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: -0.3 }}>Google</Text>
                </TouchableOpacity>
              </View>

              {/* Switch mode */}
              <TouchableOpacity onPress={switchMode} style={{ marginTop: 24, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>
                  {isLogin ? "Don't have an account?  " : 'Already have an account?  '}
                  <Text style={{ color: '#5B2EFF', fontWeight: '700' }}>
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── FOOTER ── */}
          <Animated.View style={{ alignItems: 'center', opacity: fadeAnim }}>
            <Text style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}>
              Powered by Bohenix
            </Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
