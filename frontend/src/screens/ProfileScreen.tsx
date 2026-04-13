import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Image, Animated } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../components/ToastProvider';
import { EditProfileModal } from '../components/EditProfileModal';
import { MaliHeader } from '../components/MaliHeader';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();
  const [editModalVisible, setEditModalVisible] = React.useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  const { data: profile, refetch, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/me');
      return data;
    },
  });

  useEffect(() => {
    if (!isLoading && profile) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
      ]).start();
    }
  }, [isLoading, profile]);

  const handleUpdateSuccess = () => {
    refetch();
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (confirm('Verify: Terminate current session?')) {
        logout();
      }
      return;
    }
    Alert.alert('Sign Out', 'Verify: Terminate current session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Terminate',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const menuItems = [
    { icon: 'settings-outline', label: 'Security & Meta', action: () => navigation.navigate('Settings') },
    { icon: 'shield-checkmark-outline', label: 'Access Control', action: () => navigation.navigate('Settings') },
    { icon: 'wallet-outline', label: 'Liquidity Rules', action: () => {} },
    { icon: 'notifications-outline', label: 'Pulse Alerts', action: () => {} },
  ];

  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title="Identity" showBack={true} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Animated.View 
          className="px-6 py-8 max-w-[800px] w-full mx-auto"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          
          {/* High-Fidelity Profile Card */}
          <MaliCard variant="glass" className="items-center py-12 mb-8 border-white/[0.05] relative overflow-hidden">
             <View className="absolute -top-10 -right-10 w-48 h-48 bg-primary-500/5 blur-[60px] rounded-full" />
             
             <View className="w-28 h-28 bg-obsidian-800 rounded-[32px] border border-white/10 items-center justify-center mb-6 shadow-2xl relative">
                {profile?.avatar || user?.avatar ? (
                  <Image source={{ uri: profile?.avatar || user?.avatar }} className="w-full h-full rounded-[32px]" />
                ) : (
                  <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>{initials}</Text>
                )}
                <TouchableOpacity 
                   onPress={() => setEditModalVisible(true)}
                   className="absolute -bottom-2 -right-2 w-11 h-11 bg-primary-500 rounded-2xl items-center justify-center border-4 border-obsidian-950 shadow-lg"
                >
                   <Ionicons name="create-outline" size={18} color="white" />
                </TouchableOpacity>
             </View>
             
             <Text className="text-white text-3xl font-black tracking-tight mb-2">{profile?.name || user?.name}</Text>
             <View className="flex-row items-center gap-2 mb-10">
                <Text className="text-obsidian-300 text-[13px] font-bold tracking-tight">{profile?.email || user?.email}</Text>
                <View className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_#39FF14]" />
             </View>
             
             <View className="w-full gap-4">
                <View className="flex-row gap-4">
                   <View className="flex-1 bg-white/[0.03] p-6 rounded-[24px] border border-white/[0.05]">
                      <Text className="text-obsidian-300 text-[10px] font-black uppercase tracking-[2px] mb-2">Network Reputation</Text>
                      <Text className="text-white text-xl font-black">Elite Level 4</Text>
                   </View>
                   <View className="flex-1 bg-white/[0.03] p-6 rounded-[24px] border border-white/[0.05]">
                      <Text className="text-obsidian-300 text-[10px] font-black uppercase tracking-[2px] mb-2">Total Yield</Text>
                      <Text className="text-success text-xl font-black">+KES 4.2k</Text>
                   </View>
                </View>
             </View>
          </MaliCard>

          {/* Menu Section */}
          <MaliCard variant="surface" className="p-2 mb-10 border-white/[0.05]">
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.action}
                className={`flex-row items-center p-6 active:bg-white/[0.03] ${idx < menuItems.length - 1 ? 'border-b border-white/[0.02]' : ''}`}
              >
                <View className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] items-center justify-center mr-5">
                   <Ionicons name={item.icon as any} size={20} color="#5B2EFF" />
                </View>
                <View className="flex-1">
                   <Text className="text-white font-black text-[15px] tracking-tight">{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#4B5563" />
              </TouchableOpacity>
            ))}
          </MaliCard>

          {/* Logout Section */}
          <MaliButton 
             title="Terminate Identity Session" 
             variant="glass" 
             className="border-red-500/20"
             textClassName="text-red-500 font-black"
             onPress={handleLogout}
          />

          <View className="items-center mt-12 mb-8 gap-1">
            <Text className="text-obsidian-300 text-[11px] font-black uppercase tracking-[4px] opacity-40">Mali Intelligence Layer</Text>
            <Text className="text-white/10 text-[10px] font-bold">Protocol v4.0.2 Stable</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <EditProfileModal 
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        initialData={{ name: profile?.name || user?.name || '', phone: profile?.phone, avatar: profile?.avatar || user?.avatar }}
        onSuccess={handleUpdateSuccess}
      />
    </View>
  );
};
