import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  user: any | null;
  activeMode: 'employee' | 'employer';
  hydrated: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  updateUser: (user: any) => void;
  setMode: (mode: 'employee' | 'employer') => void;
  toggleMode: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  activeMode: 'employee',
  hydrated: false,
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
  toggleMode: () => {
    set((state) => {
      const nextMode = state.activeMode === 'employee' ? 'employer' : 'employee';
      AsyncStorage.setItem('active_mode', nextMode);
      return { activeMode: nextMode };
    });
  },
  hydrate: async () => {
    try {
      const [token, userStr, mode] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('auth_user'),
        AsyncStorage.getItem('active_mode'),
      ]);
      if (token) {
        const user = userStr ? JSON.parse(userStr) : null;
        set({ 
          token, 
          user, 
          activeMode: (mode as 'employee' | 'employer') || 'employee' 
        });
      }
    } catch (_) {}
    set({ hydrated: true });
  },
}));
