import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform, Animated } from 'react-native';
import { MaliHeader } from '../components/MaliHeader';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

export const SettingsScreen = () => {
  const { activeMode, toggleMode } = useAuthStore();
  const [biometrics, setBiometrics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, []);

  const sections = [
    {
      title: 'Security & Meta',
      items: [
        { label: 'Biometric Pulse', type: 'switch', value: biometrics, onValueChange: setBiometrics, icon: 'finger-print-outline' },
        { label: 'Sovereign ID Verification', type: 'link', icon: 'shield-outline' },
        { label: 'Session Management', type: 'link', icon: 'key-outline' },
      ]
    },
    {
      title: 'Environment Preferences',
      items: [
        { label: 'Operating Mode', type: 'mode_switch', value: activeMode, icon: 'git-network-outline' },
        { label: 'Pulse Intelligence Alerts', type: 'switch', value: notifications, onValueChange: setNotifications, icon: 'notifications-outline' },
        { label: 'Network Integrity Graph', type: 'link', icon: 'globe-outline' },
      ]
    },
    {
        title: 'Memory & Data',
        items: [
          { label: 'Anonymized Intel Stream', type: 'switch', value: analytics, onValueChange: setAnalytics, icon: 'analytics-outline' },
          { label: 'Identity Export (.zip)', type: 'link', icon: 'download-outline' },
          { label: 'Purge Local Session Cache', type: 'button', labelColor: '#EF4444', icon: 'trash-outline' },
        ]
      }
  ];

  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title="Settings" showBack={true} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Animated.View 
          className="px-6 py-8 max-w-[800px] w-full mx-auto"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          
          {/* Header Info */}
          <View className="mb-12 px-2">
             <Text className="text-white text-[32px] font-black tracking-tight mb-3">System Core</Text>
             <Text className="text-obsidian-300 text-[16px] leading-relaxed font-medium">Customize your Elite Super App experience.</Text>
          </View>

          {sections.map((section, sIdx) => (
            <View key={section.title} className="mb-12">
               <Text className="text-white/30 text-[11px] font-black uppercase tracking-[3px] mb-5 ml-6">{section.title}</Text>
               <MaliCard variant="glass" className="p-3 border-white/[0.05]">
                  {section.items.map((item, iIdx) => (
                    <View 
                      key={item.label}
                      className={`flex-row items-center p-5 ${iIdx < section.items.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                    >
                       <View className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/[0.05] items-center justify-center mr-5">
                          <Ionicons name={item.icon as any} size={20} color={(item as any).labelColor || "#5B2EFF"} />
                       </View>
                       
                       <View className="flex-1">
                          <Text 
                            className="text-white font-black text-[15px] tracking-tight"
                            style={(item as any).labelColor ? { color: (item as any).labelColor } : {}}
                          >
                             {item.label}
                          </Text>
                       </View>

                       {item.type === 'switch' && (
                         <Switch 
                            value={item.value as boolean} 
                            onValueChange={item.onValueChange}
                            trackColor={{ false: '#18181B', true: '#5B2EFF' }}
                            thumbColor="#fff"
                         />
                       )}

                       {item.type === 'mode_switch' && (
                         <TouchableOpacity 
                           onPress={toggleMode}
                           className="bg-primary-500 px-4 py-2 rounded-xl"
                         >
                            <Text className="text-white font-black text-[11px] uppercase tracking-widest">{item.value}</Text>
                         </TouchableOpacity>
                       )}

                       {item.type === 'link' && (
                         <Ionicons name="chevron-forward" size={18} color="#4B5563" />
                       )}
                    </View>
                  ))}
               </MaliCard>
            </View>
          ))}

          {/* Version Info */}
          <View className="items-center mt-8 space-y-2">
             <Text className="text-obsidian-300 text-[11px] font-black uppercase tracking-[4px] opacity-40">malimind protocol v4.0.2</Text>
             <Text className="text-white/10 text-[10px] font-bold">SHA-256 Verified Binary</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
};
