import React from 'react';
import { View, Text } from 'react-native';
import { MaliHeader } from '../components/MaliHeader';
import { useTranslation } from 'react-i18next';

export const SessionManagementScreen = () => {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title={t('settings.sessionManagement')} showBack={true} />
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-white text-xl font-black text-center mb-4">Session Management</Text>
        <Text className="text-obsidian-400 text-center">Review connected devices, active web sessions, and manually rotate keys across your Sovereign ID network.</Text>
      </View>
    </View>
  );
};
