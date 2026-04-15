import React from 'react';
import { View, Text } from 'react-native';
import { MaliHeader } from '../components/MaliHeader';
import { useTranslation } from 'react-i18next';

export const PulseAlertsScreen = () => {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title={t('profile.pulseAlerts')} showBack={true} />
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-white text-xl font-black text-center mb-4">Pulse Alerts</Text>
        <Text className="text-obsidian-400 text-center">Manage your real-time intelligent notifications, threshold alerts, and push limits for on-chain events.</Text>
      </View>
    </View>
  );
};
