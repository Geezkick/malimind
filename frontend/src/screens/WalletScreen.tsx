import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Platform, Animated, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaliHeader } from '../components/MaliHeader';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';

export const WalletScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [interactionsComplete, setInteractionsComplete] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setInteractionsComplete(true);
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (interactionsComplete) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true })
      ]).start();
    }
  }, [interactionsComplete, fadeAnim, slideAnim]);

  const handleDeposit = async () => {
    try {
      await apiClient.post('/wallet/deposit', {
        phone,
        amount: parseInt(amount, 10)
      });
      alert('STK Push Initiated. Please check your phone.');
    } catch(e) {
      alert('Deposit failed');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-obsidian-950">
      <MaliHeader title={t('wallet.title')} />
      <Animated.View 
        className="flex-1"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          <View className="w-full max-w-[600px] mx-auto flex-1">
            
            <MaliCard centered={true} className="mb-6 border border-white/[0.05]">
              <Text className="text-obsidian-300 text-sm font-black uppercase tracking-widest text-center mb-1">
                 {t('wallet.currentBalance')}
              </Text>
              <Text className="text-white text-[40px] font-black tracking-tight text-center mb-2">
                KES {((user as any)?.wallet?.balance || 0).toLocaleString()}
              </Text>
            </MaliCard>
    
            <MaliCard centered={true} className="border border-white/[0.05] p-6">
              <View className="items-center mb-8">
                 <Text className="text-white text-[20px] font-black text-center tracking-tight mb-2 uppercase">
                   {t('wallet.deposit')} M-Pesa
                 </Text>
                 <Text className="text-obsidian-400 text-[13px] text-center max-w-[300px]">
                   Add capital securely to your deterministic wallet via M-Pesa.
                 </Text>
              </View>
              
              <View className="w-full items-center">
                <TextInput
                  className="w-full bg-white/[0.03] text-white p-4 rounded-2xl mb-4 border border-white/[0.08] font-bold text-center"
                  placeholder="2547..."
                  placeholderTextColor="#71717A"
                  value={phone}
                  onChangeText={setPhone}
                  style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                />
                <TextInput
                  className="w-full bg-white/[0.03] text-white p-6 rounded-2xl mb-8 border border-white/[0.08] font-black text-center text-[28px]"
                  placeholder="0.00"
                  placeholderTextColor="#71717A"
                  value={amount}
                  keyboardType="numeric"
                  onChangeText={setAmount}
                  style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                />
                <MaliButton title={t('wallet.deposit')} onPress={handleDeposit} className="w-full h-[60px]" />
              </View>
            </MaliCard>
            
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};
