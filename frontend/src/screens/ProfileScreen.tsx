import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Animated, Image, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaliHeader } from '../components/MaliHeader';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { io } from 'socket.io-client';

export const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { 
    user, 
    language, 
    setLanguage, 
    profileDashboard, 
    fetchProfileDashboard 
  } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  // Real-time synchronization
  useEffect(() => {
    fetchProfileDashboard();

    const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    const socket = io(backendUrl);
    
    socket.on('connect', () => {
      if (user?.id) socket.emit('join_user_channel', user.id);
    });

    socket.on('dashboard_update', () => {
      fetchProfileDashboard();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    if (profileDashboard) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start();
    }
  }, [profileDashboard]);

  if (!profileDashboard) {
    return (
      <View className="flex-1 bg-obsidian-950">
        <MaliHeader title={t('profile.title')} showBack={true} />
        <View className="p-6 gap-6">
          <SkeletonLoader height={240} borderRadius={32} />
          <SkeletonLoader height={120} borderRadius={24} />
          <SkeletonLoader height={160} borderRadius={24} />
        </View>
      </View>
    );
  }

  const { identity, subscription, aiBehavior, localization, security, memory } = profileDashboard;

  const initials = (identity?.name || user?.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-white/30 text-[10px] font-black uppercase tracking-[3px] mb-4 mt-8 ml-2">{title}</Text>
  );

  const InfoRow = ({ label, value, icon, color = "#5B2EFF" }: any) => (
    <View className="flex-row items-center p-5 border-b border-white/[0.02]">
      <View className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.05] items-center justify-center mr-4">
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-obsidian-400 text-[10px] font-black uppercase tracking-widest">{label}</Text>
        <Text className="text-white font-bold text-[15px] mt-0.5">{value}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title={t('profile.title')} showBack={true} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Animated.View
          className="px-6 py-4 max-w-[800px] w-full mx-auto"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* 1. Financial Identity Card */}
          <MaliCard variant="glass" className="items-center py-10 mb-2 border-white/[0.05] relative overflow-hidden">
             <View className="absolute -top-10 -right-10 w-48 h-48 bg-primary-500/5 blur-[60px] rounded-full" />
             
             <View className="w-24 h-24 bg-obsidian-800 rounded-[32px] border border-white/10 items-center justify-center mb-6 shadow-2xl overflow-hidden">
                {identity.avatar ? (
                  <Image source={{ uri: identity.avatar }} className="w-full h-full" />
                ) : (
                  <Text className="text-white text-3xl font-black">{initials}</Text>
                )}
             </View>

             <Text className="text-white text-2xl font-black tracking-tight">{identity.name}</Text>
             <Text className="text-obsidian-400 text-[13px] font-medium mb-8">{identity.email}</Text>

             <View className="w-full flex-row gap-4 px-4">
                <View className="flex-1 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.05] items-center">
                   <Text className="text-obsidian-400 text-[9px] font-black uppercase tracking-wider mb-1">{t('profile.labels.trustScore')}</Text>
                   <Text className="text-success text-lg font-black">{identity.avgTrustScore}</Text>
                </View>
                <View className="flex-1 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.05] items-center">
                   <Text className="text-obsidian-400 text-[9px] font-black uppercase tracking-wider mb-1">{t('profile.labels.healthIndicator')}</Text>
                   <Text className="text-white text-lg font-black">{identity.healthIndicator}</Text>
                </View>
             </View>
          </MaliCard>

          {/* 2. Subscription Status */}
          <SectionHeader title={t('profile.sections.subscription')} />
          <MaliCard centered={true} variant="surface" className="p-0 overflow-hidden">
             <View className={`p-5 flex-row items-center justify-between ${subscription.isPremium ? 'bg-primary-500/10' : 'bg-white/5'}`}>
                <View className="flex-row items-center gap-3">
                   <View className="w-10 h-10 rounded-full bg-primary-500/20 items-center justify-center">
                      <Ionicons name="star" size={20} color="#5B2EFF" />
                   </View>
                   <View>
                      <Text className="text-white font-black text-[15px]">{subscription.isPremium ? t('profile.labels.proStatus') : t('profile.labels.freeStatus')}</Text>
                      {subscription.renewsAt && (
                        <Text className="text-obsidian-400 text-[11px] font-medium">Renews: {new Date(subscription.renewsAt).toLocaleDateString()}</Text>
                      )}
                   </View>
                </View>
                {!subscription.isPremium && (
                  <TouchableOpacity onPress={() => navigation.navigate('Upgrade')} className="bg-primary-500 px-4 py-2 rounded-xl">
                     <Text className="text-white font-black text-[11px] uppercase">{t('profile.labels.upgradeCta')}</Text>
                  </TouchableOpacity>
                )}
             </View>
          </MaliCard>

          {/* 3. AI Behavior Summary */}
          <SectionHeader title={t('profile.sections.aiBehavior')} />
          <MaliCard variant="glass" className="p-6">
             <View className="flex-row items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-xl bg-primary-500/10 items-center justify-center">
                   <Ionicons name="sparkles" size={18} color="#5B2EFF" />
                </View>
                <Text className="text-white font-black text-[16px]">Mali Intelligence: {aiBehavior.mode}</Text>
             </View>
             <Text className="text-obsidian-300 text-[13px] leading-relaxed font-medium italic">"{aiBehavior.intelligenceSummary}"</Text>
          </MaliCard>

          {/* 4. Language Selection */}
          <SectionHeader title={t('profile.sections.localization')} />
          <MaliCard variant="surface" className="p-5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                 <Ionicons name="globe-outline" size={20} color="#5B2EFF" />
                 <Text className="text-white font-bold">{t('profile.language')}</Text>
              </View>
              <View className="flex-row bg-obsidian-900 rounded-xl p-1 border border-white/5">
                <TouchableOpacity 
                  onPress={() => setLanguage('en')}
                  className={`px-4 py-2 rounded-lg ${language === 'en' ? 'bg-primary-500' : ''}`}
                >
                  <Text className={`text-[12px] font-black ${language === 'en' ? 'text-white' : 'text-obsidian-400'}`}>EN</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setLanguage('sw')}
                  className={`px-4 py-2 rounded-lg ${language === 'sw' ? 'bg-primary-500' : ''}`}
                >
                  <Text className={`text-[12px] font-black ${language === 'sw' ? 'text-white' : 'text-obsidian-400'}`}>SW</Text>
                </TouchableOpacity>
              </View>
          </MaliCard>

          {/* 5. Security Snapshot */}
          <SectionHeader title={t('profile.sections.security')} />
          <MaliCard variant="surface" className="p-0">
             <InfoRow label={t('profile.labels.fraudRisk')} value={security.fraudStatus} icon="shield-half-outline" color={security.fraudStatus === 'STABLE' ? '#10B981' : '#EF4444'} />
             <InfoRow label={t('profile.labels.activeSessions')} value={`${security.activeSessions} Active`} icon="hardware-chip-outline" />
             <InfoRow label={t('profile.labels.trustDecay')} value={`${(security.trustDecay * 100).toFixed(1)}% Velocity`} icon="trending-down-outline" color="#F59E0B" />
          </MaliCard>

          {/* 6. Financial Memory Summary */}
          <SectionHeader title={t('profile.sections.memory')} />
          <MaliCard variant="surface" className="p-0">
             <InfoRow label={t('profile.labels.avgSpending')} value={`${identity.walletCurrency} ${memory.avgSpending.toLocaleString()}/day`} icon="calculator-outline" />
             <InfoRow label={t('profile.labels.consistency')} value={`${memory.consistencyScore}% Reliability`} icon="infinite-outline" />
             <InfoRow label={t('profile.labels.riskTrend')} value={memory.riskTrend} icon="pulse-outline" color={memory.riskTrend === 'STABLE' ? '#3B82F6' : '#10B981'} />
          </MaliCard>

          {/* Settings Junction */}
          <MaliButton 
            title={t('profile.settings')}
            variant="glass"
            className="mt-12 bg-white/5 border-white/10"
            onPress={() => navigation.navigate('Settings')}
          />

          <View className="items-center mt-12 mb-8 gap-2">
            <Text className="text-obsidian-300 text-[11px] font-black uppercase tracking-[4px] opacity-40">Financial Intelligence OS</Text>
            <Text className="text-white/10 text-[10px] font-bold">Encrypted Sovereign Identity Layer • Prot v4.1</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};
