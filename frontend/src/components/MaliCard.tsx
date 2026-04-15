import React from 'react';
import { View, ViewProps, Platform, StyleProp, ViewStyle, StyleSheet } from 'react-native';

interface MaliCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'glass' | 'surface' | 'elevated' | 'glow' | 'success' | 'premium' | 'navy' | 'intelligence' | 'glass-premium';
  className?: string;
  centered?: boolean;
  allowOverflow?: boolean;
  shimmer?: boolean;
  pressable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const MaliCard: React.FC<MaliCardProps> = ({ 
  children, 
  variant = 'surface', 
  className = '', 
  centered = false,
  allowOverflow = false,
  shimmer = false,
  pressable = false,
  style, 
  ...props 
}) => {
  const isWeb = Platform.OS === 'web';
  
  // Base classes for consistent padding and rounding
  const baseClasses = `rounded-[24px] p-6 ${centered ? 'items-center justify-center' : ''} ${allowOverflow ? '' : 'overflow-hidden'}`;
  
  // Variant mapping to tailwind classes
  const variantClasses = variant === 'glass' 
    ? "bg-white/[0.08] border border-white/10" 
    : variant === 'glass-premium'
    ? "bg-primary-500/10 border border-primary-500/20"
    : variant === 'intelligence'
    ? "bg-obsidian-950 border border-primary-500/30"
    : variant === 'surface'
    ? "bg-obsidian-800 border border-white/[0.05]"
    : variant === 'elevated'
    ? "bg-obsidian-950 border border-white/[0.08]"
    : variant === 'success'
    ? "bg-obsidian-800 border border-success/20"
    : variant === 'premium'
    ? "bg-white border border-navy-50 shadow-xl"
    : variant === 'navy'
    ? "bg-obsidian-900 border border-white/10 shadow-2xl"
    : "bg-obsidian-800 border border-primary-500/20"; // glow variant

  const inlineStyles: any = [style];

  if (isWeb) {
    inlineStyles.push({ 
      transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease',
      ...(variant === 'intelligence' && { 
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 20px rgba(91, 46, 255, 0.05)',
        borderColor: 'rgba(91, 46, 255, 0.2)'
      }),
      ...(variant === 'glass-premium' && { 
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(91, 46, 255, 0.08)',
        borderColor: 'rgba(91, 46, 255, 0.15)' 
      }),
      ...(pressable && { cursor: 'pointer' }),
      ...(variant === 'glow' && { boxShadow: '0 0 40px rgba(91, 46, 255, 0.2)' }),
      ...(variant === 'success' && { boxShadow: '0 0 40px rgba(57, 255, 20, 0.12)' }),
      ...(variant === 'premium' && { boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)' }),
      ...(shimmer && {
         position: 'relative',
         overflow: 'hidden'
      })
    } as any);
  } else {
    // Native shadow fallback
    inlineStyles.push({
      shadowColor: (variant === 'glow' || variant === 'intelligence') ? "#5B2EFF" : (variant === 'success' ? "#39FF14" : "#000"),
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: (variant === 'glow' || variant === 'intelligence') ? 0.35 : 0.5,
      shadowRadius: 24,
      elevation: 16,
    });
  }

  return (
    <View 
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={inlineStyles}
      {...props}
    >
      {/* Subtle Inner Glow Effect */}
       {variant === 'glass' && (
        <View 
          pointerEvents="none"
          style={[{ 
             ...StyleSheet.absoluteFillObject,
             borderWidth: 1, 
             borderColor: 'rgba(255,255,255,0.05)', 
             borderRadius: 24,
             backgroundColor: 'rgba(255,255,255,0.01)'
          }]} 
        />
      )}
      
      {/* Shimmer Effect (Native/Web Support Simulator) */}
      {shimmer && (
        <View 
           pointerEvents="none"
           style={{
             ...StyleSheet.absoluteFillObject,
             backgroundColor: 'rgba(255,255,255,0.03)',
             opacity: 0.5,
           }}
        />
      )}
      {children}
    </View>
  );
};
