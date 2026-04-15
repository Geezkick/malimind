import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Animated, InteractionManager, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import { MaliCard } from '../components/MaliCard';
import { MaliHeader } from '../components/MaliHeader';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaliMeter } from '../components/MaliMeter';
import { IntelligenceEmptyState } from '../components/IntelligenceEmptyState';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const HomeScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [interactionsComplete, setInteractionsComplete] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(10)).current;

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/dashboard');
      return {
        ...data,
        safeToSpendFactors: data.safeToSpendFactors ? (typeof data.safeToSpendFactors === 'string' ? JSON.parse(data.safeToSpendFactors) : data.safeToSpendFactors) : null
      };
    }
  });

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setInteractionsComplete(true);
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (!isLoading && interactionsComplete) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true })
      ]).start();
    }
  }, [isLoading, interactionsComplete, fadeAnim, slideAnim]);

  useEffect(() => {
    if (!user?.id) return;
    
    const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    const socket = io(backendUrl);
    
    socket.on('connect', () => {
      socket.emit('join_user_channel', user.id);
    });

    socket.on('dashboard_update', (payload) => {
      queryClient.setQueryData(['dashboard'], (oldData: any) => ({
        ...oldData,
        ...payload,
        safeToSpendFactors: payload.safeToSpendFactors ? (typeof payload.safeToSpendFactors === 'string' ? JSON.parse(payload.safeToSpendFactors) : payload.safeToSpendFactors) : oldData?.safeToSpendFactors
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, queryClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-obsidian-950">
        <MaliHeader title={t('home.title')} />
        <View className="p-6 gap-6">
          <SkeletonLoader height={140} borderRadius={24} />
          <SkeletonLoader height={100} borderRadius={24} />
          <SkeletonLoader height={160} borderRadius={24} />
        </View>
      </View>
    );
  }

  const cockpit = dashboard?.spendingCockpit;

  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title={t('home.title')} />

      <Animated.View 
        className="flex-1"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <ScrollView
          className="flex-1 px-6 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B2EFF" />}
        >
          {/* 1. Wallet Balance & Safe-to-Spend v4 */}
          <View className="w-full max-w-[840px] mx-auto">
            <View className="flex-row gap-5 mb-8">
               <MaliCard variant="intelligence" centered={true} className="flex-1 p-8 rounded-[32px]">
                  <Text className="text-obsidian-400 font-bold text-[10px] uppercase tracking-[2px] mb-2 text-center">{t('home.liquidCapital')}</Text>
                  <Text className="text-white text-[32px] font-black text-center tracking-tight">
                    {dashboard?.currency} {dashboard?.balance?.toLocaleString()}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-3 opacity-60">
                    <Ionicons name="shield-checkmark" size={12} color="#16C784" />
                    <Text className="text-success text-[10px] font-black uppercase">Verified by Ledger</Text>
                  </View>
               </MaliCard>
               
               <LinearGradient
                  colors={['#5B2EFF', '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 32, padding: 1, flex: 1 }}
               >
                 <MaliCard variant="intelligence" centered={true} className="flex-1 p-8 rounded-[32px] bg-obsidian-950/90 border-0">
                    <Text className="text-primary-300 font-bold text-[10px] uppercase tracking-[2px] mb-2 text-center">{t('home.safeToSpend')}</Text>
                    <Text className="text-white text-[32px] font-black text-center tracking-tight">
                      {dashboard?.currency} {Math.round(dashboard?.safeToSpend || 0).toLocaleString()}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-3">
                      <Ionicons name="pulse" size={12} color="#A855F7" />
                      <Text className="text-primary-300 text-[10px] font-black uppercase">Risk Adjusted</Text>
                    </View>
                 </MaliCard>
               </LinearGradient>
            </View>
    
            {/* Mali AI Explanation Card 2.0 */}
            <MaliCard variant="glass-premium" className="mb-10 p-0 border-primary-500/20 rounded-[32px] overflow-hidden">
              <LinearGradient
                colors={['rgba(91, 46, 255, 0.1)', 'transparent']}
                className="p-8"
              >
                <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-2xl bg-primary-500/20 items-center justify-center">
                       <Ionicons name="sparkles" size={18} color="#5B2EFF" />
                    </View>
                    <View>
                      <Text className="text-white font-black text-[14px] uppercase tracking-widest">{t('home.maliInsight')}</Text>
                      <Text className="text-primary-400 text-[9px] font-black uppercase tracking-widest opacity-60">Report v4.1 Native Intelligence</Text>
                    </View>
                  </View>
                  <View className="bg-primary-500/20 px-3 py-1.5 rounded-xl border border-primary-500/30">
                     <Text className="text-primary-400 font-black text-[10px] text-center uppercase tracking-widest">{t('home.risk')}: {dashboard?.riskScore}</Text>
                  </View>
                </View>

                <MaliCard variant="elevated" className="bg-white/[0.03] border-white/5 p-6 mb-8 rounded-[24px]">
                  <Text className="text-white text-[16px] leading-relaxed font-semibold tracking-tight">
                    {dashboard?.lastInsight}
                  </Text>
                </MaliCard>
                
                {/* Safe-to-Spend Reasons (Explainability) */}
                {dashboard?.safeToSpendFactors && (
                  <View className="gap-4">
                     {[
                       { label: t('home.trustReason'), detail: dashboard.safeToSpendFactors.trustReason, icon: 'shield-checkmark', color: '#16C784' },
                       { label: t('home.behaviorReason'), detail: dashboard.safeToSpendFactors.behaviorReason, icon: 'pulse', color: '#A855F7' },
                       { label: t('home.budgetPressure'), detail: dashboard.safeToSpendFactors.pressureReason, icon: 'speedometer', color: '#F59E0B' }
                     ].map((item, idx) => (
                       <View key={idx} className="flex-row items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.04]">
                          <View className="w-8 h-8 rounded-xl bg-white/[0.03] items-center justify-center">
                            <Ionicons name={item.icon as any} size={14} color={item.color} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-obsidian-400 text-[9px] font-black uppercase tracking-widest mb-0.5">{item.label}</Text>
                            <Text className="text-white/80 text-[12px] font-bold">{item.detail}</Text>
                          </View>
                       </View>
                     ))}
                  </View>
                )}
              </LinearGradient>
            </MaliCard>

            {/* 2. Upcoming Obligations Cockpit */}
            <View className="flex-row items-center justify-between mb-4 px-1">
               <Text className="text-white text-[16px] font-black uppercase tracking-widest">{t('home.upcomingUtilities')}</Text>
               <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
                  <Text className="text-primary-500 text-[11px] font-black uppercase">{t('wallet.deposit')}</Text>
               </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10" contentContainerStyle={{ paddingHorizontal: width > 840 ? (width - 840) / 2 : 0 }}>
              {cockpit?.upcomingUtilities?.length > 0 ? cockpit.upcomingUtilities.map((bill: any, i: number) => {
                const daysLeft = Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <MaliCard key={i} variant="elevated" className="w-[200px] p-6 mr-4 border-white/[0.03] rounded-[28px] bg-obsidian-900 shadow-2xl">
                     <View className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 items-center justify-center mb-4">
                        <Ionicons name="receipt-outline" size={20} color="#5B2EFF" />
                     </View>
                     <Text className="text-white font-black text-[15px] mb-1 leading-tight" numberOfLines={1}>{bill.name}</Text>
                     <Text className="text-obsidian-300 font-bold text-[13px]">{dashboard?.currency} {bill.amount.toLocaleString()}</Text>
                     
                     <View className="mt-6 pt-4 border-t border-white/[0.05]">
                        <View className={`px-2 py-1 rounded-lg self-start ${daysLeft < 3 ? 'bg-error/10' : 'bg-primary-500/10'}`}>
                           <Text className={`text-[9px] font-black uppercase tracking-wider ${daysLeft < 3 ? 'text-error' : 'text-primary-400'}`}>
                              {t('home.utilityDue', { days: daysLeft })}
                           </Text>
                        </View>
                     </View>
                  </MaliCard>
                );
              }) : (
                <View className="w-full">
                   <IntelligenceEmptyState 
                      icon="receipt-outline"
                      title={t('home.noUpcomingUtilities') || "Clear Horizon"}
                      description="No capital leaks detected. You have a zero-debt obligation window for the next cycle."
                   />
                </View>
              )}
            </ScrollView>

            {/* 3. Savings Momentum */}
            <Text className="text-white text-[16px] font-black mb-6 px-1 uppercase tracking-widest">{t('home.savingsMomentum')}</Text>
            <View className="mb-10">
              {cockpit?.savingsGoals?.length > 0 ? cockpit.savingsGoals.map((goal: any, i: number) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <MaliCard key={i} variant="elevated" className="mb-5 p-6 border-white/[0.05] rounded-[28px] shadow-lg">
                     <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center gap-4">
                           <View className="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 items-center justify-center">
                              <Ionicons name="trending-up" size={20} color="#16C784" />
                           </View>
                           <View>
                              <Text className="text-white font-black text-[15px] tracking-tight">{goal.name}</Text>
                              <Text className="text-obsidian-400 text-[10px] font-bold uppercase tracking-widest">{t('home.daysRemaining', { days: daysLeft })}</Text>
                           </View>
                        </View>
                        <View className="items-end">
                           <Text className="text-white font-black text-[16px]">{dashboard?.currency} {goal.currentAmount.toLocaleString()}</Text>
                           <Text className="text-obsidian-400 text-[9px] font-bold uppercase">Target: {goal.targetAmount.toLocaleString()}</Text>
                        </View>
                     </View>
                     
                     <MaliMeter 
                        progress={progress} 
                        variant="success" 
                        size="md"
                        subLabel={t('home.goalProgress', { progress: Math.round(progress) })}
                     />
                  </MaliCard>
                );
              }) : (
                <IntelligenceEmptyState 
                   icon="trending-up-outline"
                   title={t('home.noSavingsGoals') || "Liquid Stagnation"}
                   description="No dedicated capital growth engines found. Consider seeding a new savings circle for automated compounding."
                   actionLabel="Set Growth Goal"
                />
              )}
            </View>

            {/* 4. Category Pressure Meters */}
            <Text className="text-white text-[16px] font-black mb-6 px-1 uppercase tracking-widest">{t('home.budgetPressure')}</Text>
            <View className="flex-row flex-wrap gap-5 mb-12">
              {cockpit?.categories?.map((cat: any, i: number) => {
                const progress = (cat.spent / cat.limit) * 100;
                const isOver = cat.spent >= cat.limit;
                return (
                  <MaliCard key={i} variant="surface" className="flex-1 min-w-[160px] p-6 border-white/[0.05] rounded-[28px] shadow-sm">
                     <View className="flex-row justify-between items-start mb-4">
                        <Text className="text-obsidian-400 font-bold text-[10px] uppercase tracking-widest flex-1" numberOfLines={1}>{cat.name}</Text>
                        {isOver && <Ionicons name="warning" size={14} color="#FF4D4D" />}
                     </View>
                     
                     <MaliMeter 
                        progress={progress} 
                        variant={isOver ? 'error' : 'primary'} 
                        size="sm"
                        subLabel={`${Math.round(progress)}%`}
                     />
                     
                     <View className="mt-4 pt-3 border-t border-white/[0.02] flex-row justify-between items-center">
                        <Text className="text-white font-black text-[13px]">{dashboard?.currency} {cat.spent.toLocaleString()}</Text>
                        <Text className="text-obsidian-500 text-[9px] font-bold">Of {cat.limit.toLocaleString()}</Text>
                     </View>
                  </MaliCard>
                );
              })}
            </View>

            {/* Existing Synergies Link (Bottom) */}
            <TouchableOpacity onPress={() => navigation.navigate('Synergy')} className="active:opacity-80">
               <MaliCard variant="intelligence" className="mb-6 p-6 border-white/[0.05] rounded-[28px] flex-row items-center justify-between shadow-2xl">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl items-center justify-center mr-4">
                       <Ionicons name="git-network" size={24} color="#5B2EFF" />
                    </View>
                    <View>
                       <Text className="text-white font-black text-[16px] tracking-tight">{t('home.activeSynergies')}</Text>
                       <Text className="text-primary-400 text-[11px] font-bold uppercase tracking-widest">{dashboard?.activeSynergies?.length || 0} Network Pools Active</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#51525C" />
               </MaliCard>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
};
