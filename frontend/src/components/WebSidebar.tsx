import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

interface WebSidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export const WebSidebar: React.FC<WebSidebarProps> = ({ activeRoute, onNavigate }) => {
  const user = useAuthStore((state) => state.user);
  
  const menuItems = [
    { name: 'Home', icon: 'home', route: 'Home' },
    { name: 'Synergy Circles', icon: 'people', route: 'Synergy' },
    { name: 'Work', icon: 'briefcase', route: 'Work' },
    { name: 'Mali AI', icon: 'sparkles', route: 'Mali' },
    { name: 'Profile', icon: 'person', route: 'Profile' },
  ];

  if (Platform.OS !== 'web') return null;

  return (
    <View className="w-80 bg-obsidian-950 border-r border-white/[0.05] h-screen p-10 flex-col justify-between">
      <View>
        <TouchableOpacity 
          onPress={() => onNavigate('Home')}
          className="flex-row items-center gap-4 mb-14 active:opacity-80 transition-all"
        >
            <View className="w-12 h-12 bg-primary-500 rounded-2xl items-center justify-center shadow-xl shadow-primary-500/30">
               <Ionicons name="sparkles" size={24} color="white" />
            </View>
            <Text className="text-white text-[28px] font-black tracking-tighter">malimind</Text>
        </TouchableOpacity>
        
        <View className="gap-3">
          {menuItems.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => onNavigate(item.route)}
                className={`flex-row items-center px-6 py-4.5 rounded-[22px] gap-5 transition-all duration-300 ${isActive ? 'bg-primary-500/10 border border-primary-500/20' : 'hover:bg-white/[0.03]'}`}
              >
                <View className={`w-11 h-11 items-center justify-center rounded-xl ${isActive ? 'bg-primary-500 shadow-lg shadow-primary-500/20' : 'bg-white/[0.03] border border-white/[0.05]'}`}>
                   <Ionicons 
                     name={(isActive ? item.icon : `${item.icon}-outline`) as any} 
                     size={22} 
                     color={isActive ? 'white' : '#9CA3AF'} 
                   />
                </View>
                <Text className={`font-black text-[15px] tracking-[0.5px] uppercase ${isActive ? 'text-white' : 'text-obsidian-300'}`}>
                   {item.name}
                </Text>
                {isActive && (
                  <View className="ml-auto w-1.5 h-1.5 bg-primary-500 rounded-full shadow-[0_0_12px_#5B2EFF]" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => onNavigate('Profile')}
        className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-[28px] flex-row items-center gap-5 hover:bg-white/[0.05] transition-all"
      >
        <View className="w-14 h-14 bg-obsidian-800 border border-white/10 rounded-2xl items-center justify-center overflow-hidden">
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} className="w-full h-full" />
          ) : (
            <Text className="text-white font-black text-lg">
              {(user?.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white font-black text-[15px]" numberOfLines={1}>{user?.name}</Text>
          <Text className="text-success font-black text-[10px] uppercase tracking-[2px] opacity-70">Elite Resident</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#4B5563" />
      </TouchableOpacity>
    </View>
  );
};
