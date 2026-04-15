import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MaliHeader } from '../components/MaliHeader';
import { MaliCard } from '../components/MaliCard';
import { apiClient } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const UpgradeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Trigger STK Push (simulated logic for now, using the simulate endpoint)
      await apiClient.post('/subscription/simulate-upgrade');
      
      // Invalidate dashboard to fetch new premium features
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      Alert.alert(
        t('upgrade.welcome'),
        t('upgrade.welcomeDesc'),
        [{ text: "Awesome", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert("Upgrade Failed", err?.response?.data?.message || "Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title={t('upgrade.title')} showBack />
      
      <View className="flex-1 w-full max-w-[800px] mx-auto">
        <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
          
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary-500/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="star" size={40} color="#5B2EFF" />
            </View>
            <Text className="text-white text-[28px] font-black tracking-tight mb-2 text-center">{t('upgrade.title')}</Text>
            <Text className="text-obsidian-300 text-[15px] font-medium text-center leading-relaxed">
              {t('upgrade.subtitle')}
            </Text>
          </View>
  
          <Text className="text-obsidian-400 font-bold text-[13px] uppercase tracking-[2px] mb-4 text-center">{t('upgrade.proFeatures')}</Text>
  
          <MaliCard variant="elevated" className="mb-4 p-5 border-white/[0.03]">
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 bg-white/5 rounded-full items-center justify-center">
                <Ionicons name="calendar" size={24} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-[16px]">{t('upgrade.predictiveCashflow')}</Text>
                <Text className="text-obsidian-400 text-[13px] mt-1 leading-tight">{t('upgrade.predictiveDesc')}</Text>
              </View>
            </View>
          </MaliCard>
  
          <MaliCard variant="elevated" className="mb-4 p-5 border-white/[0.03]">
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 bg-white/5 rounded-full items-center justify-center">
                <Ionicons name="shield-checkmark" size={24} color="#16C784" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-[16px]">{t('upgrade.safeToSpend')}</Text>
                <Text className="text-obsidian-400 text-[13px] mt-1 leading-tight">{t('upgrade.safeToSpendDesc')}</Text>
              </View>
            </View>
          </MaliCard>
  
          <MaliCard variant="elevated" className="mb-8 p-5 border-white/[0.03]">
            <View className="flex-row items-center gap-4">
               <View className="w-12 h-12 bg-white/5 rounded-full items-center justify-center">
                <Ionicons name="git-network" size={24} color="#5B2EFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-[16px]">{t('upgrade.groupTrust')}</Text>
                <Text className="text-obsidian-400 text-[13px] mt-1 leading-tight">{t('upgrade.groupTrustDesc')}</Text>
              </View>
            </View>
          </MaliCard>
  
        </ScrollView>
  
        <View className="absolute bottom-0 w-full p-6 pt-4 bg-obsidian-950/90 border-t border-white/[0.03]" style={{ backdropFilter: 'blur(10px)' } as any}>
          <TouchableOpacity
            onPress={handleUpgrade}
            disabled={loading}
            className={`w-full bg-primary-500 rounded-2xl h-14 flex-row items-center justify-center shadow-lg shadow-primary-500/30 ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-black text-[16px] uppercase tracking-wide text-center">
                {t('upgrade.activateBtn')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
