import React from 'react';
import { View, Text, Platform, ViewStyle, StyleProp } from 'react-native';
import { MaliCard } from './MaliCard';

interface PremiumBleedCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  accentColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const PremiumBleedCard: React.FC<PremiumBleedCardProps> = ({
  title,
  subtitle,
  description,
  icon = "🚀",
  accentColor = "#2EC4B6",
  className = "",
  children
}) => {
  return (
    <MaliCard 
      variant="premium" 
      allowOverflow={true} 
      className={`relative min-h-[160px] ${className}`}
    >
      {/* Bleeding background element */}
      <View 
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
        style={{ backgroundColor: accentColor }}
      />
      
      {/* Bleeding Floating Icon */}
      <View 
        className="absolute -top-6 -right-2 w-20 h-20 bg-white rounded-3xl items-center justify-center shadow-2xl"
        style={Platform.OS === 'web' ? { 
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
          transform: [{ rotate: '12deg' }]
        } as any : {
          transform: [{ rotate: '12deg' }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 15,
          elevation: 10
        }}
      >
        <Text className="text-4xl">{icon}</Text>
      </View>

      <View className="pr-16">
        {subtitle && (
          <Text className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>
            {subtitle}
          </Text>
        )}
        <Text className="text-navy-900 text-2xl font-black tracking-tight mb-2">
          {title}
        </Text>
        {description && (
          <Text className="text-navy-400 text-sm font-medium leading-relaxed">
            {description}
          </Text>
        )}
        {children && <View className="mt-4">{children}</View>}
      </View>
    </MaliCard>
  );
};
