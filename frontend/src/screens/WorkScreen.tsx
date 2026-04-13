import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, RefreshControl, Platform } from 'react-native';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { MaliHeader } from '../components/MaliHeader';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ToastProvider';

export const WorkScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('Jobs');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  const fetchMarketplace = async () => {
    setLoading(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(10);
    try {
      let endpoint = '/jobs';
      if (activeTab === 'Workers') endpoint = '/profiles/workers';
      if (activeTab === 'Applied') endpoint = '/jobs/my-applications';
      
      const response = await apiClient.get(endpoint);
      setData(response.data);
      
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
      ]).start();
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMarketplace();
    setRefreshing(false);
  };

  const { mutate: applyToJob, isPending: applying } = useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await apiClient.post('/jobs/apply', { jobId });
      return data;
    },
    onSuccess: () => {
      showToast('Application sent successfully', 'success');
      if (activeTab === 'Applied') {
         fetchMarketplace();
      }
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to apply', 'error');
    }
  });

  const TABS = ['Jobs', 'Workers', 'Applied'];

  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title="Marketplace" />
      
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B2EFF" />}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-[1200px] w-full mx-auto px-6 pt-4">
          
        {/* TAB NAVIGATION */}
        <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.05]">
               {TABS.map((tab) => (
                 <TouchableOpacity 
                   key={tab}
                   onPress={() => setActiveTab(tab)}
                   className={`px-8 py-3 rounded-xl transition-all duration-300 ${activeTab === tab ? 'bg-primary-500 shadow-lg shadow-primary-500/20' : 'bg-transparent'}`}
                 >
                    <Text className={`text-[12px] uppercase tracking-[1px] ${activeTab === tab ? 'text-white font-black' : 'text-obsidian-300 font-bold'}`}>{tab}</Text>
                 </TouchableOpacity>
               ))}
            </View>
            
            <TouchableOpacity className="w-[50px] h-[50px] bg-white/[0.03] border border-white/[0.05] rounded-2xl items-center justify-center active:bg-white/5">
               <Ionicons name="options-outline" size={20} color="#F3F4F6" />
            </TouchableOpacity>
        </View>

        {/* FEED CONTENT */}
        <View>
           {loading ? (
             <View className="gap-6">
                {[1, 2, 3].map(i => (
                  <SkeletonLoader key={i} height={200} borderRadius={24} />
                ))}
             </View>
           ) : data.length === 0 ? (
             <MaliCard variant="glass" className="items-center py-20 border-white/[0.05]">
                <View className="w-20 h-20 bg-white/[0.03] rounded-3xl items-center justify-center mb-6 border border-white/10">
                   <Ionicons name={activeTab === 'Applied' ? 'folder-open-outline' : 'search-outline'} size={40} color="#9CA3AF" />
                </View>
                <Text className="text-white font-black text-2xl text-center">
                   {activeTab === 'Applied' ? 'No active applications' : 'No results detected'}
                </Text>
                <Text className="text-obsidian-300 text-center mt-3 font-medium px-8">
                   {activeTab === 'Applied' 
                     ? 'Browse the Jobs tab to find opportunities that match your skill profile.' 
                     : 'Try broadening your search or switching context filters.'}
                </Text>
             </MaliCard>
           ) : (
             <Animated.View 
                className="flex-row flex-wrap -mx-3"
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
             >
                {data.map((item) => {
                   const isAppliedTab = activeTab === 'Applied';
                   const jobData = isAppliedTab ? item.job : item;
                   
                   return (
                   <View key={item.id} className="w-full md:w-1/2 lg:w-1/3 px-3 mb-6">
                    <MaliCard variant="glass" className="h-[280px] border-white/[0.05] flex-col justify-between">
                       {activeTab === 'Jobs' || activeTab === 'Applied' ? (
                          <View className="flex-1">
                             <View className="flex-row justify-between mb-4">
                                <View className="w-12 h-12 bg-primary-500/10 rounded-2xl items-center justify-center border border-primary-500/20">
                                   <Ionicons name={isAppliedTab ? 'checkmark-circle' : 'layers-outline'} size={24} color={isAppliedTab ? '#39FF14' : '#5B2EFF'} />
                                </View>
                                <View className="bg-success/10 px-3 py-1 rounded-lg border border-success/20 h-8 items-center justify-center">
                                   <Text className="text-success font-black text-[13px]">KES {jobData?.budget?.toLocaleString() || '0'}</Text>
                                </View>
                             </View>
                             
                             <Text className="text-white font-black text-[19px] mb-2 leading-tight" numberOfLines={1}>{jobData?.title || 'Unknown Job'}</Text>
                             <View className="flex-row items-center mb-3">
                                <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                                <Text className="text-obsidian-300 font-bold text-[12px] ml-1 uppercase tracking-widest">{jobData?.category || 'General'} • {jobData?.location || 'Remote'}</Text>
                             </View>
                             
                             <Text className="text-obsidian-300 text-[13px] leading-relaxed mb-4 font-medium flex-1" numberOfLines={2}>
                                {jobData?.description || 'No description provided.'}
                             </Text>
                             
                             <View className="flex-row justify-between items-center pt-5 border-t border-white/[0.05]">
                                <View className="flex-row items-center flex-1 pr-2">
                                   <View className="w-8 h-8 bg-obsidian-800 rounded-full border border-white/10 items-center justify-center mr-2">
                                      <Ionicons name="person-outline" size={14} color="#F3F4F6" />
                                   </View>
                                   <Text className="text-obsidian-300 text-[11px] font-bold uppercase truncate" numberOfLines={1}>{jobData?.employer?.name || 'Company'}</Text>
                                </View>
                                
                                {isAppliedTab ? (
                                   <View className="bg-white/[0.03] border border-white/10 px-4 py-2 rounded-xl">
                                      <Text className="text-obsidian-300 font-black text-[11px] uppercase tracking-widest">Pending</Text>
                                   </View>
                                ) : (
                                   <TouchableOpacity 
                                     onPress={() => applyToJob(item.id)}
                                     disabled={applying}
                                     className="bg-primary-500 px-5 py-2.5 rounded-xl border border-primary-500/50 shadow-lg shadow-primary-500/20 active:opacity-80"
                                   >
                                      <Text className="text-white font-black text-[12px] uppercase">Apply</Text>
                                   </TouchableOpacity>
                                )}
                             </View>
                          </View>
                       ) : (
                          <View className="flex-1">
                             <View className="flex-row items-center mb-6 border-b border-white/[0.05] pb-6">
                                <View className="w-16 h-16 bg-obsidian-800 rounded-[24px] mr-4 items-center justify-center shadow-inner border border-white/10 overflow-hidden">
                                   <Ionicons name="finger-print" size={28} color="#5B2EFF" />
                                </View>
                                <View className="flex-1">
                                   <Text className="text-white font-black text-[18px] mb-1 truncate" numberOfLines={1}>{item.user?.name}</Text>
                                   <Text className="text-primary-500 font-bold text-[12px] uppercase tracking-wider mb-2 truncate" numberOfLines={1}>{item.title}</Text>
                                   <View className="flex-row items-center bg-white/[0.03] self-start px-2 py-1 rounded border border-white/[0.05]">
                                      <Ionicons name="star" size={12} color="#5B2EFF" />
                                      <Text className="text-white font-black text-[11px] ml-1">{item.rating?.toFixed(1) || '0.0'}</Text>
                                   </View>
                                </View>
                             </View>
                             
                             <Text className="text-obsidian-300 text-[12px] leading-relaxed mb-4 font-medium flex-1" numberOfLines={2}>
                                {item.skills || 'No skills listed'}
                             </Text>
                             
                             <View className="flex-row justify-between items-center pt-5">
                                <View>
                                  <Text className="text-obsidian-400 text-[10px] font-black uppercase tracking-widest mb-1">Premium Rate</Text>
                                  <Text className="text-white font-black text-[16px]">KES {item.hourlyRate}/hr</Text>
                                </View>
                                <TouchableOpacity className="bg-white text-black px-6 py-2.5 rounded-xl active:opacity-80">
                                  <Text className="text-black font-black text-[12px] uppercase">View</Text>
                                </TouchableOpacity>
                             </View>
                          </View>
                       )}
                    </MaliCard>
                   </View>
                   );
                })}
             </Animated.View>
           )}
        </View>

        {/* AI SMART MATCH PROMO */}
        <View className="mt-16">
           <MaliCard variant="glass" className="bg-primary-500/[0.03] border-primary-500/20 p-10 flex-col md:flex-row items-center gap-10">
              <View className="flex-[2]">
                <Text className="text-white font-black text-3xl mb-4 leading-tight">Mali AI Assistant</Text>
                <Text className="text-obsidian-300 font-bold text-[16px] leading-relaxed mb-8 max-w-[600px]">
                   Looking for something specific? Mali can match you with the perfect gig or talent in seconds using proximity intelligence and behavioral analysis.
                </Text>
                <MaliButton title="Initialize Smart Match" variant="glow" className="h-[54px] w-full md:w-64" />
              </View>
              <View className="flex-1 items-center justify-center">
                 <View className="w-32 h-32 bg-primary-500/10 rounded-full border border-primary-500/20 items-center justify-center relative shadow-[0_0_40px_#5B2EFF40]">
                    <Ionicons name="planet" size={54} color="#5B2EFF" />
                 </View>
              </View>
           </MaliCard>
        </View>

        </View>
      </ScrollView>
    </View>
  );
};
