import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform, StyleSheet, Animated } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { AddGoalModal } from '../components/AddGoalModal';
import { MaliHeader } from '../components/MaliHeader';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Svg, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

export const HomeScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/dashboard');
      return data;
    }
  });

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    if (!isLoading && dashboard) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isLoading, dashboard]);

  const openTxModal = (type: 'income' | 'expense') => {
    setTxType(type);
    setTxModalVisible(true);
  };

  return (
    <View 
      className="flex-1 bg-obsidian-900 text-white"
      style={Platform.OS === 'web' ? { minHeight: '100%', width: '100%', display: 'flex' } : {}}
    >
      <MaliHeader />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#5B2EFF" onRefresh={refetch} />}
      >
        <View className="px-6 gap-8 max-w-[1200px] w-full mx-auto">
          
           {isLoading && !dashboard ? (
             <View className="flex-1 px-6 gap-6 pt-4">
                <SkeletonLoader height={180} borderRadius={24} />
                <View className="flex-row gap-4">
                   <SkeletonLoader height={74} borderRadius={22} className="flex-1" />
                   <SkeletonLoader height={74} borderRadius={22} className="flex-1" />
                </View>
                <SkeletonLoader height={140} borderRadius={24} />
                <SkeletonLoader height={200} borderRadius={24} />
             </View>
           ) : (
             <Animated.View 
               className="gap-8"
               style={{
                 opacity: fadeAnim,
                 transform: [{ translateY: slideAnim }]
               }}
             >
                {/* FINANCIAL OVERVIEW (HERO) */}
                <MaliCard variant="glass" className="mt-4 relative overflow-visible">
                   {/* Subtle Glow Background */}
                   <View className="absolute -top-10 -left-10 w-40 h-40 bg-primary-500/10 blur-[60px] rounded-full" />
                   
                   <View className="items-center py-4 z-10">
                      <Text className="text-obsidian-300 text-[14px] font-black uppercase tracking-[3px] mb-2">Total Operating Capital</Text>
                      <Text style={{ color: '#F9FAFB' }} className="text-white text-[48px] font-black tracking-tight">
                         KES {dashboard?.balance?.toLocaleString() || '0'}
                      </Text>
                      <View className="flex-row items-center mt-6 bg-success/10 px-4 py-2 rounded-full border border-success/20">
                         <Ionicons name="shield-checkmark" size={14} color="#39FF14" style={{ marginRight: 8 }} />
                         <Text className="text-success text-[13px] font-black uppercase tracking-widest">KES {dashboard?.safeToSpend?.toLocaleString() || '0'} Liquid assets</Text>
                      </View>
                   </View>

                   {/* Value Curve Visual */}
                   <View className="absolute bottom-0 left-0 right-0 h-32 opacity-30">
                      <Svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                         <Defs>
                            <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                               <Stop offset="0" stopColor="#5B2EFF" stopOpacity="0.5" />
                               <Stop offset="1" stopColor="#5B2EFF" stopOpacity="0" />
                            </SvgGradient>
                         </Defs>
                         <Path 
                           d="M0,80 Q50,70 100,85 T200,60 T300,75 T400,40 L400,100 L0,100 Z" 
                           fill="url(#grad)" 
                         />
                         <Path 
                           d="M0,80 Q50,70 100,85 T200,60 T300,75 T400,40" 
                           fill="none" 
                           stroke="#5B2EFF" 
                           strokeWidth="2" 
                         />
                      </Svg>
                   </View>
                </MaliCard>

                {/* QUICK ACTIONS */}
                <View className="flex-row gap-4 flex-wrap">
                   {[
                     { title: 'Add Income', icon: 'add-outline', action: () => openTxModal('income') },
                     { title: 'Add Expense', icon: 'remove-outline', action: () => openTxModal('expense') },
                     { title: 'Synergy Circle', icon: 'people-outline', action: () => navigation.navigate('Synergy') },
                     { title: 'Find Jobs', icon: 'briefcase-outline', action: () => navigation.navigate('Work') },
                   ].map((btn, i) => (
                     <TouchableOpacity 
                       key={i}
                       onPress={btn.action}
                       className="flex-1 min-w-[140px] h-[74px] bg-white/[0.03] border border-white/[0.08] rounded-[22px] flex-row items-center px-5 active:bg-white/5"
                     >
                        <View className="w-11 h-11 bg-white/[0.05] rounded-xl items-center justify-center mr-4">
                           <Ionicons name={btn.icon as any} size={20} color="#F3F4F6" />
                        </View>
                        <Text className="text-white font-black text-[12px] uppercase tracking-tight">{btn.title}</Text>
                     </TouchableOpacity>
                   ))}
                </View>

                {/* JOB OPPORTUNITIES (HORIZONTAL) */}
                <View>
                   <View className="flex-row justify-between items-center mb-6 px-2">
                      <Text className="text-white text-[22px] font-black tracking-tight uppercase">High-Yield Ops</Text>
                      <TouchableOpacity>
                         <Text style={{ color: '#B1B7C1' }} className="text-obsidian-300 text-[12px] font-black uppercase tracking-widest bg-transparent">Global View</Text>
                      </TouchableOpacity>
                   </View>
                   
                   <ScrollView 
                     horizontal 
                     showsHorizontalScrollIndicator={false} 
                     className="-mx-6 px-6"
                     snapToInterval={220 + 16}
                     decelerationRate="fast"
                   >
                      {[
                        { title: 'UI Architect', company: 'SpaceX', loc: 'Remote', rate: '4.8', color: '#5B2EFF' },
                        { title: 'Fullstack Dev', company: 'Stripe', loc: 'Nairobi', rate: '5.0', color: '#8B5CF6' },
                        { title: 'AI Specialist', company: 'Anthropic', loc: 'Remote', rate: '4.9', color: '#C0C0C0' },
                        { title: 'Growth Lead', company: 'Revolut', loc: 'Lagos', rate: '4.7', color: '#5B2EFF' },
                      ].map((job, i) => (
                        <MaliCard 
                          key={i} 
                          variant="glass" 
                          className="w-[220px] mr-4 border-white/[0.05] p-5"
                        >
                           <View style={{ backgroundColor: `${job.color}15` }} className="w-10 h-10 rounded-xl items-center justify-center mb-4">
                              <Ionicons name="flash-outline" size={20} color={job.color} />
                           </View>
                           <Text className="text-white font-black text-[16px] mb-1">{job.title}</Text>
                           <Text className="text-obsidian-300 text-[13px] font-medium mb-4">{job.company}</Text>
                           
                           <View className="flex-row justify-between items-center mt-auto">
                              <View className="flex-row items-center">
                                 <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                                 <Text className="text-obsidian-300 text-[12px] font-bold ml-1">{job.loc}</Text>
                              </View>
                              <View className="flex-row items-center border border-white/10 px-2 py-0.5 rounded-lg">
                                 <Ionicons name="star" size={10} color="#5B2EFF" />
                                 <Text className="text-white text-[11px] font-bold ml-1">{job.rate}</Text>
                              </View>
                           </View>
                        </MaliCard>
                      ))}
                      <View className="w-6" />
                   </ScrollView>
                </View>

                {/* SMART SYNERGY CIRCLE */}
                <MaliCard variant="elevated" className="border-white/[0.05] p-8">
                   <View className="flex-row justify-between items-center mb-8">
                      <View>
                         <Text className="text-obsidian-300 text-[11px] font-black uppercase tracking-[3px] mb-2">Sync Circle Pool</Text>
                         <Text style={{ color: '#F9FAFB' }} className="text-white text-[32px] font-black tracking-tighter">KES 240,500</Text>
                      </View>
                      <View className="flex-row -space-x-3">
                         {[1, 2, 3].map(i => (
                           <View key={i} className="w-9 h-9 rounded-full border-2 border-obsidian-900 bg-obsidian-800 items-center justify-center shadow-lg">
                              <Ionicons name="person-outline" size={16} color="#B1B7C1" />
                           </View>
                         ))}
                         <View className="w-9 h-9 rounded-full border-2 border-obsidian-900 bg-primary-500 items-center justify-center shadow-lg">
                            <Text className="text-white text-[10px] font-black">+12</Text>
                         </View>
                      </View>
                   </View>
                   
                   <View className="gap-3">
                      <View className="flex-row justify-between items-center">
                         <Text className="text-obsidian-300 text-[12px] font-bold uppercase tracking-widest">Liquidity target</Text>
                         <Text className="text-white text-[14px] font-black">85%</Text>
                      </View>
                      <View className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/5">
                         <View className="h-full bg-primary-500 shadow-[0_0_20px_#5B2EFF]" style={{ width: '85%' }} />
                      </View>
                   </View>
                </MaliCard>

                {/* AI INSIGHT (FLOATING GLASS) */}
                <MaliCard variant="glass" className="border-primary-500/30 bg-primary-500/[0.05] p-8">
                   <View className="flex-row items-start gap-5">
                      <View className="w-14 h-14 bg-primary-500 rounded-2xl items-center justify-center shadow-xl shadow-primary-500/40">
                         <Ionicons name="sparkles" size={28} color="white" />
                      </View>
                      <View className="flex-1">
                         <Text className="text-white font-black text-[18px] mb-1 tracking-tight">Elite Insight</Text>
                         <Text className="text-obsidian-300 text-[15px] leading-relaxed font-medium">
                            Optimize your <Text className="text-success font-black">Synergy Circle</Text> yields by diversifying contributions this cycle.
                         </Text>
                      </View>
                      <TouchableOpacity className="w-10 h-10 items-center justify-center bg-white/5 rounded-xl border border-white/10">
                         <Ionicons name="chevron-forward" size={20} color="#F3F4F6" />
                      </TouchableOpacity>
                   </View>
                </MaliCard>

             </Animated.View>
           )}
        </View>
      </ScrollView>

      <AddTransactionModal 
        visible={txModalVisible} 
        defaultType={txType}
        onClose={() => setTxModalVisible(false)} 
      />
      <AddGoalModal 
        visible={goalModalVisible} 
        onClose={() => setGoalModalVisible(false)} 
      />
    </View>
  );
};
