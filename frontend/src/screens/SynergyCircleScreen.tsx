import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, Platform, Alert, Animated, RefreshControl } from 'react-native';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MaliHeader } from '../components/MaliHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { CreateChamaModal } from '../components/CreateChamaModal';
import { useToast } from '../components/ToastProvider';

export const SynergyCircleScreen = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  const { data: circles, isLoading, refetch } = useQuery({
    queryKey: ['chamas'],
    queryFn: async () => {
      const { data } = await apiClient.get('/chamas');
      return data;
    }
  });

  useEffect(() => {
    if (!isLoading && circles) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
      ]).start();
    }
  }, [isLoading, circles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const { mutate: joinCircle, isPending: joining } = useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data } = await apiClient.post('/chamas/join', { inviteCode });
      return data;
    },
    onSuccess: () => {
      showToast('Joined Synergy Circle successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['chamas'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Invalid invite code', 'error');
    }
  });

  const handleJoinPress = () => {
    if (Platform.OS === 'web') {
      const code = prompt('Enter Synergy Circle Invite Code:');
      if (code) joinCircle(code);
    } else {
      Alert.prompt(
        'Join Circle',
        'Enter the invite code from your partner:',
        (code) => joinCircle(code),
        'plain-text'
      );
    }
  };

  const totalCapital = circles?.reduce((acc: number, c: any) => acc + (c.targetAmount || 0), 0) || 0;

  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title="Synergy Circles" />
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B2EFF" />}
      >
        <View className="max-w-[1000px] w-full mx-auto px-6 pt-4">
          
        <Animated.View 
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <MaliCard variant="glass" className="mb-10 p-10 border-white/[0.05] relative overflow-hidden">
             <View className="absolute -top-20 -right-20 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full" />
             
             <View className="relative z-10">
                <Text className="text-obsidian-300 font-black text-[11px] uppercase tracking-[3px] mb-3">Managed Capital Assets</Text>
                <View className="flex-row items-baseline gap-2 mb-8">
                  <Text className="text-white text-[42px] font-black tracking-tight">KES {(totalCapital / 1000000).toFixed(2)}M</Text>
                  <View className="bg-success/10 px-2 py-0.5 rounded-lg border border-success/20">
                     <Text className="text-success text-[12px] font-black">+Elite</Text>
                  </View>
                </View>
                
                <View className="flex-row gap-6">
                   <View className="flex-1 bg-white/[0.03] p-5 rounded-[24px] border border-white/[0.05]">
                      <Text className="text-white font-black text-xl mb-1">{circles?.length || 0}</Text>
                      <Text className="text-obsidian-300 text-[10px] font-black uppercase tracking-widest">Active Pools</Text>
                   </View>
                   <View className="flex-1 bg-white/[0.03] p-5 rounded-[24px] border border-white/[0.05]">
                      <Text className="text-white font-black text-xl mb-1">PRO</Text>
                      <Text className="text-obsidian-300 text-[10px] font-black uppercase tracking-widest">Status Level</Text>
                   </View>
                </View>
             </View>
          </MaliCard>

          <View className="flex-row justify-between items-center mb-8 px-2">
             <Text className="text-white text-[20px] font-black tracking-tight">Your Synergy Pools</Text>
             <View className="flex-row gap-3">
               <TouchableOpacity 
                 onPress={handleJoinPress}
                 disabled={joining}
                 className="flex-row items-center gap-2 bg-white/[0.03] border border-white/10 px-4 py-2 rounded-xl"
               >
                  <Ionicons name="enter-outline" size={18} color="#9CA3AF" />
                  <Text className="text-obsidian-300 font-black text-[12px] uppercase">Join</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => setCreateModalVisible(true)}
                 className="flex-row items-center gap-2 bg-primary-500/10 px-4 py-2 rounded-xl border border-primary-500/20"
               >
                  <Ionicons name="add-circle" size={18} color="#5B2EFF" />
                  <Text className="text-primary-500 font-black text-[12px] uppercase">Initialize</Text>
               </TouchableOpacity>
             </View>
          </View>
          
          <View className="gap-6 mb-12">
            {isLoading ? (
               <View className="gap-6">
                  {[1, 2].map(i => <SkeletonLoader key={i} height={200} borderRadius={32} />)}
               </View>
            ) : circles?.length === 0 ? (
               <MaliCard variant="glass" className="items-center py-20 border-white/[0.05]">
                  <Ionicons name="people-outline" size={48} color="#27272A" />
                  <Text className="text-white font-black text-xl mt-6">No active pools detected</Text>
                  <Text className="text-obsidian-300 text-center mt-2 px-10">Start a new Synergy Circle or join an existing one to consolidate capital.</Text>
               </MaliCard>
            ) : circles?.map((circle: any) => (
              <MaliCard key={circle.id} variant="glass" className="p-0 border-white/[0.05] overflow-hidden">
                <View className="flex-row flex-wrap md:flex-nowrap">
                  <View className="w-full md:w-52 h-48 bg-obsidian-800 items-center justify-center">
                    <LinearGradient 
                        colors={['#5B2EFF22', '#39FF1411']}
                        className="w-full h-full items-center justify-center p-6"
                    >
                      <View className="w-20 h-20 bg-white/[0.03] rounded-[28px] border border-white/10 items-center justify-center shadow-2xl">
                        <Ionicons name="git-network-outline" size={32} color="#5B2EFF" />
                      </View>
                      <View className="mt-4 bg-primary-500/20 px-3 py-1 rounded-lg">
                        <Text className="text-primary-500 text-[10px] font-black uppercase tracking-widest">{circle.inviteCode}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <View className="flex-1 p-8 justify-between">
                    <View>
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-white font-black text-[22px] flex-1 mr-4">{circle.name}</Text>
                        <View className="bg-white/[0.05] border border-white/10 px-3 py-1.5 rounded-xl">
                          <Text className="text-white text-[10px] font-black uppercase tracking-widest">{circle.frequency}</Text>
                        </View>
                      </View>
                      <Text className="text-obsidian-300 text-[13px] leading-relaxed mb-4" numberOfLines={2}>
                        {circle.description || 'Global synergy and collective capital management protocol active.'}
                      </Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center mt-4">
                      <View>
                        <Text className="text-obsidian-300 text-[10px] uppercase font-black tracking-[2px] mb-1">Target Capital</Text>
                        <Text className="text-white font-black text-[20px] tracking-tight">KES {circle.targetAmount?.toLocaleString() || '---'}</Text>
                      </View>
                      <TouchableOpacity className="w-11 h-11 bg-white/[0.03] border border-white/10 rounded-2xl items-center justify-center active:bg-white/5">
                        <Ionicons name="analytics" size={20} color="#5B2EFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </MaliCard>
            ))}
          </View>

          <MaliButton 
            title="Explore Global Synergy Networks" 
            variant="glass" 
            className="h-[64px]"
            onPress={() => showToast('Global explorer offline', 'error')}
          />
        </Animated.View>
        </View>
      </ScrollView>

      <CreateChamaModal 
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => refetch()}
      />
    </View>
  );
};
