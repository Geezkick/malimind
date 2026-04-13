import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMessage('');
    });
  }, [opacity, translateY]);

  const showToast = useCallback((msg: string, t: ToastType = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setMessage(msg);
    setType(t);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: Platform.OS === 'ios' ? 60 : 40,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(hideToast, 4000);
  }, [hideToast, opacity, translateY]);

  const getTheme = () => {
    switch (type) {
      case 'success': return { bg: '#ECFDF5', border: '#10B981', color: '#065F46', icon: 'checkmark-circle' as const };
      case 'error': return { bg: '#FEF2F2', border: '#EF4444', color: '#991B1B', icon: 'alert-circle' as const };
      default: return { bg: '#F8FAFC', border: '#E5E7EB', color: '#0B1B2B', icon: 'information-circle' as const };
    }
  };

  const theme = getTheme();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <Animated.View 
          style={[
            styles.toastContainer,
            { 
              opacity, 
              transform: [{ translateY }],
              backgroundColor: theme.bg,
              borderColor: theme.border,
            }
          ]}
        >
          <View style={styles.content}>
            <Ionicons name={theme.icon} size={20} color={theme.border} style={styles.icon} />
            <Text style={[styles.text, { color: theme.color }]}>{message}</Text>
            <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
              <Ionicons name="close" size={16} color={theme.color} opacity={0.5} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#0B1B2B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 6 },
      web: { boxShadow: '0 8px 16px rgba(11,27,43,0.1)' } as any,
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
  }
});
