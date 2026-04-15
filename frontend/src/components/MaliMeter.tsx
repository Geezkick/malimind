import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MaliMeterProps {
  progress: number;
  label?: string;
  subLabel?: string;
  variant?: 'primary' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export const MaliMeter: React.FC<MaliMeterProps> = ({
  progress,
  label,
  subLabel,
  variant = 'primary',
  size = 'md'
}) => {
  const colors = (variant === 'primary' 
    ? ['#5B2EFF', '#A855F7'] 
    : variant === 'success' 
    ? ['#16C784', '#34D399'] 
    : ['#FF4D4D', '#F87171']) as [string, string, ...string[]];

  const height = size === 'sm' ? 4 : size === 'md' ? 8 : 12;

  return (
    <View className="win-full">
      {(label || subLabel) && (
        <View className="flex-row justify-between items-end mb-2 px-1">
          {label && <Text className="text-white font-black text-[11px] uppercase tracking-wider">{label}</Text>}
          {subLabel && <Text className="text-obsidian-400 font-bold text-[10px]">{subLabel}</Text>}
        </View>
      )}
      
      <View className="w-full bg-white/[0.05] rounded-full overflow-hidden" style={{ height }}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%`, height: '100%' }}
          className="rounded-full shadow-lg"
        />
      </View>
      
      {/* Subtle background glow for the active part */}
      <View 
        className="absolute -bottom-1 left-0 opacity-20 blur-md"
        style={{ 
          width: `${Math.min(100, progress)}%`, 
          height: 4, 
          backgroundColor: colors[0] 
        }}
      />
    </View>
  );
};
