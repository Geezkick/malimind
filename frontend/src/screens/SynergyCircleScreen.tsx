import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ImageBackground, Platform, Alert, Animated, RefreshControl, FlatList, InteractionManager } from 'react-native';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { MaliPressable } from '../components/MaliPressable';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MaliHeader } from '../components/MaliHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { CreateChamaModal } from '../components/CreateChamaModal';
import { useToast } from '../components/ToastProvider';
import { useTranslation } from 'react-i18next';

export const SynergyCircleScreen = () => {
  const { t } = useTranslation();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [interactionsComplete, setInteractionsComplete] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  const { data: circles, isLoading, refetch } = useQuery({
    queryKey: ['chamas'],
    queryFn: async () => {
      const { data } = await apiClient.get('/synergy');
      return data;
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const { mutate: joinCircle, isPending: joining } = useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data } = await apiClient.post('/synergy/join', { inviteCode });
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

  const handleJoinPress = useCallback(() => {
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
  }, [joinCircle]);

  // Memoize heavy calculation to avoid unnecessary re-renders
  const totalCapital = useMemo(() => {
    if (!circles) return 0;
    return circles.reduce((acc: number, c: any) => acc + (c.targetAmount || 0), 0);
  }, [circles]);

  const renderHeader = useCallback(() => (
    <View className="mb-12 w-full max-w-[800px] mx-auto">
      <MaliCard variant="glass" centered={true} className="mb-10 p-10 border-white/[0.05] relative overflow-hidden">
        <View className="absolute -top-20 -right-20 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full" />

        <View className="relative z-10 flex flex-col items-center justify-center w-full">
          <Text className="text-obsidian-300 font-black text-[11px] uppercase tracking-[3px] mb-3 text-center">Managed Capital Assets</Text>
          <View className="flex-row items-center justify-center gap-2 mb-8">
            <Text className="text-white text-[42px] font-black tracking-tight text-center">KES {(totalCapital / 1000000).toFixed(2)}M</Text>
            <View className="bg-success/10 px-2 py-0.5 rounded-lg border border-success/20">
              <Text className="text-success text-[12px] font-black">+Elite</Text>
            </View>
          </View>

          <View className="flex-row gap-6 justify-center items-center w-full max-w-[400px]">
            <View className="flex-1 bg-white/[0.03] p-5 rounded-[24px] border border-white/[0.05] flex items-center justify-center">
              <Text className="text-white font-black text-xl mb-1 text-center">{circles?.length || 0}</Text>
              <Text className="text-obsidian-300 text-[10px] font-black uppercase tracking-widest text-center">{t('synergy.activePools')}</Text>
            </View>
            <View className="flex-1 bg-white/[0.03] p-5 rounded-[24px] border border-white/[0.05] flex items-center justify-center">
              <Text className="text-white font-black text-xl mb-1 text-center">PRO</Text>
              <Text className="text-obsidian-300 text-[10px] font-black uppercase tracking-widest text-center">Status Level</Text>
            </View>
          </View>
        </View>
      </MaliCard>

      <View className="flex flex-col items-center justify-center px-2 gap-5 mb-4">
        <Text className="text-white text-[22px] font-black tracking-tight text-center uppercase">{t('synergy.title')}</Text>
        <View className="flex-row items-center justify-center gap-3 flex-wrap">
          <MaliPressable
            onPress={handleJoinPress}
            disabled={joining}
            className="flex-row items-center justify-center gap-2 bg-white/[0.03] border border-white/10 px-8 py-4 rounded-2xl"
          >
            <Ionicons name="enter-outline" size={18} color="#9CA3AF" />
            <Text className="text-obsidian-300 font-black text-[12px] uppercase">Join Circle</Text>
          </MaliPressable>
          <MaliPressable
            onPress={() => setCreateModalVisible(true)}
            className="flex-row items-center justify-center gap-2 bg-primary-500/10 px-8 py-4 rounded-2xl border border-primary-500/20"
          >
            <Ionicons name="add-circle" size={18} color="#5B2EFF" />
            <Text className="text-primary-500 font-black text-[12px] uppercase">{t('synergy.createSynergy')}</Text>
          </MaliPressable>
        </View>
      </View>
    </View>
  ), [totalCapital, circles?.length, joining, handleJoinPress]);

  const renderEmptyState = useCallback(() => (
    isLoading ? (
      <View className="gap-6">
        {[1, 2].map(i => <SkeletonLoader key={i} height={200} borderRadius={32} />)}
      </View>
    ) : (
      <View className="w-full max-w-[800px] mx-auto items-center">
        <MaliCard variant="glass" centered={true} className="w-full py-20 border-white/[0.05]">
          <Ionicons name="people-outline" size={48} color="#27272A" />
          <Text className="text-white font-black text-xl mt-6 text-center tracking-tight uppercase">{t('home.noSynergies')}</Text>
          <Text className="text-obsidian-300 text-center mt-2 px-10 max-w-[400px]">{t('synergy.summary')}</Text>
        </MaliCard>
      </View>
    )
  ), [isLoading]);

  const renderCircle = useCallback(({ item: circle }: { item: any }) => (
    <View className="w-full max-w-[800px] mx-auto">
      <MaliCard variant="glass" className="p-0 border-white/[0.05] overflow-hidden mb-8">
        <View className="flex-row flex-wrap md:flex-nowrap">
          <View className="w-full md:w-52 h-full min-h-[160px] bg-obsidian-800 items-center justify-center border-r border-white/5">
            <LinearGradient
              colors={['#5B2EFF11', '#39FF1405']}
              className="w-full h-full items-center justify-center p-6"
            >
              <View className="w-16 h-16 bg-white/[0.03] rounded-[24px] border border-white/10 items-center justify-center shadow-lg">
                <Ionicons name="git-network-outline" size={28} color="#5B2EFF" />
              </View>
              <View className="mt-4 bg-primary-500/10 px-3 py-1.5 rounded-lg border border-primary-500/20">
                <Text className="text-primary-500 text-[9px] font-black uppercase tracking-widest">{circle.inviteCode}</Text>
              </View>
            </LinearGradient>
          </View>
          <View className="flex-1 p-8 justify-between">
            <View>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white font-black text-[22px] flex-1 mr-4 tracking-tight uppercase">{circle.name}</Text>
                <View className="bg-white/[0.05] border border-white/10 px-3 py-1.5 rounded-xl">
                  <Text className="text-white text-[9px] font-black uppercase tracking-widest">{circle.frequency}</Text>
                </View>
              </View>
              <Text className="text-obsidian-300 text-[13px] leading-relaxed mb-6" numberOfLines={2}>
                {circle.description || 'Global synergy and collective capital management protocol active.'}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mt-2">
              <View>
                <Text className="text-obsidian-400 text-[9px] uppercase font-black tracking-[2px] mb-1">{t('synergy.totalPool')}</Text>
                <Text className="text-white font-black text-[22px] tracking-tight">KES {circle.targetAmount?.toLocaleString() || '---'}</Text>
              </View>
              <MaliPressable
                onPress={() => showToast('Analytics module initializing...', 'info')}
                className="w-12 h-12 border border-white/10 rounded-2xl items-center justify-center bg-primary-500/5 border-primary-500/20"
              >
                <Ionicons name="analytics" size={20} color="#5B2EFF" />
              </MaliPressable>
            </View>
          </View>
        </View>
      </MaliCard>
    </View>
  ), [showToast]);

  const renderFooter = useCallback(() => (
    <MaliButton
      title={t('synergy.discoverSynergy')}
      variant="glass"
      className="h-[64px] mt-6"
      onPress={() => showToast('Global explorer initializing...', 'info')}
    />
  ), [showToast]);

  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title={t('synergy.title')} />

      <Animated.View
        className="flex-1 w-full max-w-[1000px] mx-auto pt-4"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <FlatList
          data={circles || []}
          keyExtractor={(item: any) => item.id}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={11}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          renderItem={renderCircle}
          ListFooterComponent={circles?.length > 0 ? renderFooter : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B2EFF" />}
        />
      </Animated.View>

      <CreateChamaModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => refetch()}
      />
    </View>
  );
};
