import React from 'react';
import { View, Text } from 'react-native';
import { MaliHeader } from '../components/MaliHeader';
import { useTranslation } from 'react-i18next';

export const LiquidityRulesScreen = () => {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-obsidian-950">
      <MaliHeader title={t('profile.liquidityRules')} showBack={true} />
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-white text-xl font-black text-center mb-4">Liquidity Rules</Text>
        <Text className="text-obsidian-400 text-center">Customize your global capital pooling logic and automated transaction routing workflows. This module is initializing in the background.</Text>
      </View>
    </View>
  );
};
