import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import i18n from '../i18n';

interface AuthState {
  token: string | null;
  user: any | null;
  activeMode: 'employee' | 'employer';
  language: 'en' | 'sw';
  hydrated: boolean;
  biometricsEnabled: boolean;
  notificationsEnabled: boolean;
  analyticsEnabled: boolean;
  aiBehaviorMode: 'NORMAL' | 'STRICT' | 'ADVISORY';
  fraudShieldEnabled: boolean;
  settingsDashboard: any | null;
  profileDashboard: any | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  updateUser: (user: any) => void;
  setMode: (mode: 'employee' | 'employer') => void;
  setLanguage: (lang: 'en' | 'sw') => Promise<void>;
  toggleMode: () => void;
  setBiometrics: (val: boolean) => void;
  setNotifications: (val: boolean) => void;
  setAnalytics: (val: boolean) => void;
  setAIBehaviorMode: (mode: 'NORMAL' | 'STRICT' | 'ADVISORY') => Promise<void>;
  setFraudShield: (val: boolean) => Promise<void>;
  fetchSettingsDashboard: () => Promise<void>;
  fetchProfileDashboard: () => Promise<void>;
  purgeSessionCache: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  activeMode: 'employee',
  language: 'en',
  hydrated: false,
  biometricsEnabled: true,
  notificationsEnabled: true,
  analyticsEnabled: false,
  aiBehaviorMode: 'NORMAL',
  fraudShieldEnabled: true,
  settingsDashboard: null,
  profileDashboard: null,
  login: (token, user) => {
    AsyncStorage.setItem('auth_token', token);
    AsyncStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    AsyncStorage.removeItem('auth_token');
    AsyncStorage.removeItem('auth_user');
    AsyncStorage.removeItem('active_mode');
    set({ token: null, user: null, activeMode: 'employee' });
  },
  updateUser: (user) => {
    AsyncStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },
  setMode: (mode) => {
    AsyncStorage.setItem('active_mode', mode);
    set({ activeMode: mode });
  },
  setLanguage: async (lang) => {
    await AsyncStorage.setItem('app_language', lang);
    i18n.changeLanguage(lang);
    set({ language: lang });
    try {
      await apiClient.put('/users/settings/update', { language: lang });
    } catch (err) {
      console.log('Failed to sync settings to backend');
    }
  },
  toggleMode: () => {
    set((state) => {
      const nextMode = state.activeMode === 'employee' ? 'employer' : 'employee';
      AsyncStorage.setItem('active_mode', nextMode);
      return { activeMode: nextMode };
    });
  },
  setBiometrics: (val: boolean) => {
    AsyncStorage.setItem('setting_biometrics', JSON.stringify(val));
    set({ biometricsEnabled: val });
  },
  setNotifications: (val: boolean) => {
    AsyncStorage.setItem('setting_notifications', JSON.stringify(val));
    set({ notificationsEnabled: val });
  },
  setAnalytics: (val: boolean) => {
    AsyncStorage.setItem('setting_analytics', JSON.stringify(val));
    set({ analyticsEnabled: val });
  },
  setAIBehaviorMode: async (mode) => {
    set({ aiBehaviorMode: mode });
    try {
      await apiClient.put('/users/settings/update', { aiBehaviorMode: mode });
    } catch (err) {
      console.log('Failed to sync AI behavior mode');
    }
  },
  setFraudShield: async (val) => {
    set({ fraudShieldEnabled: val });
    try {
      await apiClient.put('/users/settings/update', { fraudShieldEnabled: val });
    } catch (err) {
      console.log('Failed to sync fraud shield setting');
    }
  },
  fetchSettingsDashboard: async () => {
    try {
      const { data } = await apiClient.get('/users/settings/dashboard');
      set({ 
        settingsDashboard: data,
        aiBehaviorMode: data.aiBehavior.mode,
        fraudShieldEnabled: data.intelligence.fraudShieldEnabled,
        language: data.localization.language as any,
      });
      // Sync local language if backend differs
      if (data.localization.language !== i18n.language) {
        i18n.changeLanguage(data.localization.language);
      }
    } catch (err) {
      console.log('Failed to fetch settings dashboard');
    }
  },
  fetchProfileDashboard: async () => {
    try {
      const { data } = await apiClient.get('/users/profile/dashboard');
      set({ profileDashboard: data });
    } catch (err) {
      console.log('Failed to fetch profile dashboard');
    }
  },
  purgeSessionCache: async () => {
    await AsyncStorage.clear();
    set({ 
      token: null, user: null, activeMode: 'employee', 
      biometricsEnabled: true, notificationsEnabled: true, analyticsEnabled: false 
    });
  },
  hydrate: async () => {
    try {
      const [
        token, userStr, mode, langStr, 
        bioStr, notifStr, analyticsStr
      ] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('auth_user'),
        AsyncStorage.getItem('active_mode'),
        AsyncStorage.getItem('app_language'),
        AsyncStorage.getItem('setting_biometrics'),
        AsyncStorage.getItem('setting_notifications'),
        AsyncStorage.getItem('setting_analytics'),
      ]);
      const prefLang = (langStr as 'en' | 'sw') || 'en';
      if (prefLang) {
        i18n.changeLanguage(prefLang);
      }
      if (token) {
        const user = userStr ? JSON.parse(userStr) : null;
        set({ 
          token, 
          user, 
          activeMode: (mode as 'employee' | 'employer') || 'employee',
          language: prefLang,
          biometricsEnabled: bioStr !== null ? JSON.parse(bioStr) : true,
          notificationsEnabled: notifStr !== null ? JSON.parse(notifStr) : true,
          analyticsEnabled: analyticsStr !== null ? JSON.parse(analyticsStr) : false,
        });
      } else {
         set({ 
           language: prefLang,
           biometricsEnabled: bioStr !== null ? JSON.parse(bioStr) : true,
           notificationsEnabled: notifStr !== null ? JSON.parse(notifStr) : true,
           analyticsEnabled: analyticsStr !== null ? JSON.parse(analyticsStr) : false,
         });
      }
    } catch (_) {}
    set({ hydrated: true });
  },
}));
