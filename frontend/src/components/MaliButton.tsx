import React, { useState } from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, Platform, StyleProp, ViewStyle, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface MaliButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'glass' | 'outline' | 'glow';
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
}

export const MaliButton: React.FC<MaliButtonProps> = ({ 
  title, 
  variant = 'primary', 
  className = '', 
  textClassName = '',
  style,
  onPress,
  ...props 
}) => {
  const isWeb = Platform.OS === 'web';
  const [isHovered, setIsHovered] = useState(false);
  const [scale] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8
    }).start();
  };

  const handlePress = (e: any) => {
    if (Platform.OS !== 'web') {
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onPress) onPress(e);
  };

  const primaryGradient = isHovered 
    ? ['#6D43FF', '#A78BFA'] 
    : ['#5B2EFF', '#8B5CF6'];

  const baseClasses = "h-[60px] rounded-[18px] flex-row items-center justify-center transition-all duration-300";
  
  const animatedStyle = {
    transform: [{ scale }]
  };

  if (variant === 'primary' || variant === 'glow') {
    const isGlow = variant === 'glow';
    return (
      <Animated.View style={[{ height: 60 }, animatedStyle, style]}>
        <TouchableOpacity 
          activeOpacity={1}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          //@ts-ignore
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={[
            { flex: 1 },
             (isWeb ? { 
               boxShadow: isHovered 
                ? (isGlow ? '0 0 50px rgba(91, 46, 255, 0.4)' : '0 10px 40px rgba(91, 46, 255, 0.4)')
                : (isGlow ? '0 0 30px rgba(91, 46, 255, 0.2)' : '0 4px 12px rgba(91, 46, 255, 0.2)'),
               cursor: 'pointer'
             } : {
                shadowColor: '#5B2EFF',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isGlow ? 0.4 : 0.2,
                shadowRadius: 15,
                elevation: 10,
             }) as any
          ]}
          {...props}
        >
          <LinearGradient
            colors={primaryGradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
            className={className}
          >
            {/* Shimmer Effect (Web Only Simulator) */}
            {isWeb && isHovered && (
                <View 
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 0, left: '-100%', width: '100%', height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: [{ skewX: '-20deg' }],
                    //@ts-ignore
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
            )}
            <Text className={`text-white font-black text-[15px] uppercase tracking-[1px] ${textClassName}`}>
              {title}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity 
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        //@ts-ignore
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={[
            {
            backgroundColor: variant === 'glass' ? (isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)') : 'transparent',
            borderColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            },
            (isWeb ? { 
            backdropFilter: variant === 'glass' ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: variant === 'glass' ? 'blur(20px)' : 'none',
            cursor: 'pointer',
            } : {}) as any
        ]}
        className={`${baseClasses} px-8 ${className}`}
        {...props}
        >
        <Text className={`text-obsidian-50 font-black text-[13px] uppercase tracking-[1px] ${textClassName}`}>
            {title}
        </Text>
        </TouchableOpacity>
    </Animated.View>
  );
};
