import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Animated, Alert, InteractionManager } from 'react-native';
import { MaliHeader } from '../components/MaliHeader';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

export const SettingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { 
    language, setLanguage,
    aiBehaviorMode, setAIBehaviorMode,
    fraudShieldEnabled, setFraudShield,
    settingsDashboard, fetchSettingsDashboard,
    purgeSessionCache 
  } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchSettingsDashboard();
    const task = InteractionManager.runAfterInteractions(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true })
      ]).start();
    });
    return () => task.cancel();
  }, []);

  const isPremium = settingsDashboard?.subscription?.isPremium || false;

  const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-white/30 text-[11px] font-black uppercase tracking-[3px] mb-5 mt-8 ml-2">{title}</Text>
  );

  const PremiumLock = () => (
    <View className="bg-primary-500/10 border border-primary-500/30 px-2 py-1 rounded-md ml-2">
      <Text className="text-primary-400 text-[9px] font-black uppercase tracking-wider">{t('settings.labels.proOnly')}</Text>
    </View>
  );

  const handleLogout = () => {
    Alert.alert(
      "Secure Logout",
      "Terminate current session and clear local security tokens?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: purgeSessionCache }
      ]
    );
  };

  const sections = [
    {
      title: t('settings.sections.identity'),
      items: [
        { label: t('settings.labels.userId'), value: settingsDashboard?.identity?.userId?.slice(0, 12) + '...', type: 'text', icon: 'finger-print-outline' },
        { label: t('settings.labels.linkedPhone'), value: settingsDashboard?.identity?.phone || 'Not Linked', type: 'text', icon: 'call-outline' },
        { label: t('settings.labels.walletStatus'), value: `${settingsDashboard?.identity?.walletBalance} ${settingsDashboard?.identity?.walletCurrency}`, type: 'text', icon: 'wallet-outline' },
        { label: t('settings.labels.synergyOverview'), value: `${settingsDashboard?.identity?.activeSynergies} Active Pools`, type: 'text', icon: 'people-outline' },
      ]
    },
    {
      title: t('settings.sections.subscription'),
      items: [
        { label: t('settings.labels.currentPlan'), value: settingsDashboard?.subscription?.tier, type: 'badge', icon: 'star-outline' },
        { label: t('settings.labels.upgradePro'), type: 'link', icon: 'trending-up-outline', action: () => navigation.navigate('Upgrade'), hide: isPremium },
        { label: t('settings.labels.autoRenew'), type: 'switch', value: true, icon: 'refresh-outline' },
        { label: t('settings.labels.billingHistory'), type: 'link', icon: 'receipt-outline' },
      ].filter(i => !i.hide)
    },
    {
      title: t('settings.sections.localization'),
      items: [
        { label: t('settings.labels.language'), type: 'lang_switch', value: language, icon: 'language-outline' },
      ]
    },
    {
      title: t('settings.sections.aiBehavior'),
      items: [
        { label: t('settings.labels.aiMode'), type: 'mode_select', value: aiBehaviorMode, icon: 'sparkles-outline' },
      ]
    },
    {
      title: t('settings.sections.intelligence'),
      items: [
        { label: t('settings.labels.predictiveAI'), type: 'switch', value: isPremium, disabled: !isPremium, icon: 'analytics-outline', premium: true },
        { label: t('settings.labels.safeToSpendV3'), type: 'switch', value: isPremium, disabled: !isPremium, icon: 'shield-checkmark-outline', premium: true },
        { label: t('settings.labels.financialMemory'), type: 'switch', value: isPremium, disabled: !isPremium, icon: 'infinite-outline', premium: true },
        { label: t('settings.labels.fraudShield'), type: 'switch', value: fraudShieldEnabled, onValueChange: setFraudShield, icon: 'bug-outline' },
      ]
    },
    {
      title: t('settings.sections.security'),
      items: [
        { label: t('settings.labels.fraudStatus'), value: settingsDashboard?.fraud?.status, type: 'badge', icon: 'alert-circle-outline', 
          color: settingsDashboard?.fraud?.status === 'CRITICAL' ? '#EF4444' : '#10B981' },
        { label: t('settings.labels.activeSessions'), type: 'link', icon: 'hardware-chip-outline', action: () => navigation.navigate('SessionManagement') },
        { label: t('settings.labels.trustScore'), value: `Score: ${settingsDashboard?.fraud?.riskScore}`, type: 'text', icon: 'shield-outline' },
      ]
    },
    {
      title: t('settings.sections.privacy'),
      items: [
        { label: t('settings.labels.resetMemory'), type: 'button', labelColor: '#F59E0B', icon: 'refresh-circle-outline' },
        { label: t('settings.labels.downloadData'), type: 'link', icon: 'download-outline' },
        { label: t('settings.labels.deleteAccount'), type: 'button', labelColor: '#EF4444', icon: 'trash-outline' },
      ]
    }
  ];

  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title={t('settings.title')} showBack={true} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Animated.View 
          className="px-6 py-8 max-w-[600px] w-full mx-auto"
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          
          {/* Header Info */}
          <View className="mb-12 px-2 items-center justify-center">
             <Text className="text-white text-[32px] font-black tracking-tight mb-3 text-center uppercase">{t('settings.systemCore')}</Text>
             <Text className="text-obsidian-300 text-[15px] leading-relaxed font-medium text-center max-w-[400px]">{t('settings.systemDesc')}</Text>
          </View>

          {sections.map((section, sIdx) => (
            <View key={section.title} className="mb-4">
               <SectionHeader title={section.title} />
               <MaliCard variant="glass" className="p-2 border-white/[0.05]">
                  {section.items.map((item, iIdx) => {
                    const InteractionWrapper = (item as any).action ? TouchableOpacity : View;
                    return (
                      <InteractionWrapper 
                        key={item.label}
                        onPress={(item as any).action}
                        className={`flex-row items-center p-4 ${iIdx < section.items.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                      >
                         <View className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.05] items-center justify-center mr-4">
                            <Ionicons name={item.icon as any} size={18} color={(item as any).labelColor || "#5B2EFF"} />
                         </View>
                         
                         <View className="flex-1 flex-row items-center">
                            <Text 
                              className="text-white font-bold text-[14px] tracking-tight"
                              style={(item as any).labelColor ? { color: (item as any).labelColor } : {}}
                            >
                               {item.label}
                            </Text>
                            {(item as any).premium && !isPremium && <PremiumLock />}
                         </View>
  
                         {item.type === 'text' && (
                           <Text className="text-obsidian-400 font-bold text-[13px]">{(item as any).value}</Text>
                         )}

                         {item.type === 'badge' && (
                           <View className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                              <Text className="text-white font-black text-[10px] uppercase tracking-widest" style={(item as any).color ? { color: (item as any).color } : {}}>{(item as any).value}</Text>
                           </View>
                         )}

                         {item.type === 'switch' && (
                           <Switch 
                              value={(item as any).value as boolean} 
                              onValueChange={(item as any).onValueChange}
                              disabled={(item as any).disabled}
                              trackColor={{ false: '#18181B', true: '#5B2EFF' }}
                              thumbColor="#fff"
                           />
                         )}
  
                         {item.type === 'lang_switch' && (
                           <View className="flex-row bg-white/5 rounded-xl p-0.5 border border-white/5">
                             <TouchableOpacity onPress={() => setLanguage('en')} className={`px-3 py-1.5 rounded-lg ${language === 'en' ? 'bg-primary-500' : ''}`}>
                               <Text className="text-white font-black text-[10px]">EN</Text>
                             </TouchableOpacity>
                             <TouchableOpacity onPress={() => setLanguage('sw')} className={`px-3 py-1.5 rounded-lg ${language === 'sw' ? 'bg-primary-500' : ''}`}>
                               <Text className="text-white font-black text-[10px]">SW</Text>
                             </TouchableOpacity>
                           </View>
                         )}

                         {item.type === 'mode_select' && (
                           <View className="flex-row gap-1">
                             {['NORMAL', 'STRICT', 'ADVISORY'].map((m) => (
                               <TouchableOpacity 
                                 key={m}
                                 onPress={() => setAIBehaviorMode(m as any)}
                                 className={`px-2 py-1.5 rounded-lg border ${aiBehaviorMode === m ? 'bg-primary-500 border-primary-400' : 'bg-white/5 border-white/10'}`}
                               >
                                 <Text className="text-white font-black text-[9px] uppercase tracking-tight">{m.slice(0, 3)}</Text>
                               </TouchableOpacity>
                             ))}
                           </View>
                         )}
  
                         {item.type === 'link' && (
                           <Ionicons name="chevron-forward" size={16} color="#4B5563" />
                         )}
                      </InteractionWrapper>
                    );
                  })}
               </MaliCard>
            </View>
          ))}

          <MaliButton 
            title={t('profile.signOut')}
            variant="glass"
            className="mt-12 border-red-500/20"
            textClassName="text-red-500 font-black"
            onPress={handleLogout}
          />

          {/* Version Info */}
          <View className="items-center mt-8 space-y-2">
             <Text className="text-obsidian-300 text-[11px] font-black uppercase tracking-[4px] opacity-40">malimind protocol v4.0.2</Text>
             <Text className="text-white/10 text-[10px] font-bold">{t('settings.labels.proOnly') ? "SHA-256 Verified Binary" : "Verified"}</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
};
