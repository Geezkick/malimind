import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaliCard } from './MaliCard';
import { MaliButton } from './MaliButton';

interface IntelligenceEmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const IntelligenceEmptyState: React.FC<IntelligenceEmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <MaliCard variant="glass" centered={true} className="py-12 px-6 border-white/[0.03]">
      <View className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/[0.05] items-center justify-center mb-6 shadow-xl">
        <Ionicons name={icon} size={32} color="#5B2EFF" />
      </View>
      
      <Text className="text-white font-black text-lg mb-2 text-center tracking-tight uppercase">
        {title}
      </Text>
      
      <Text className="text-obsidian-400 text-[13px] font-medium text-center leading-relaxed max-w-[280px] mb-8">
        {description}
      </Text>
      
      {actionLabel && (
        <MaliButton 
          title={actionLabel} 
          variant="glass" 
          onPress={onAction}
          className="px-8 h-12"
        />
      )}
    </MaliCard>
  );
};
