import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, RadialGradient, Stop, G, TSpan, Text as SvgText } from 'react-native-svg';

interface MalimindLogoProps {
  /** Width of the entire logo */
  width?: number;
  /** Show just the icon mark, or icon + wordmark */
  variant?: 'icon' | 'full';
  /** Override accent color */
  color?: string;
}

/**
 * MalimindLogo — Elite Architectural "Silver-Violet Fusion".
 * A world-class signature mark with professional precision.
 */
export const MalimindLogo: React.FC<MalimindLogoProps> = ({
  width = 200,
  variant = 'full',
  color,
}) => {
  // vbW expanded to 260 to prevent clipping of the 'd'
  const vbW = 260;
  const vbH = variant === 'full' ? 84 : 60;
  const height = (width / vbW) * vbH;

  const primary = color || '#5B2EFF'; // Elite Violet
  const secondary = '#FFFFFF'; // Pure White

  // The "Architectural M" — Single M with Silver-Violet Blend
  const ArchitecturalMark = () => (
    <G>
      <Defs>
        {/* Fusion Gradient: Brushed Silver blending into Elite Violet */}
        <LinearGradient id="fusionGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F9FAFB" />
          <Stop offset="0.3" stopColor="#9CA3AF" />
          <Stop offset="0.6" stopColor="#E5E7EB" />
          <Stop offset="0.85" stopColor={primary} />
          <Stop offset="1" stopColor="#4318FF" />
        </LinearGradient>
        {/* Cinematic Violet Glow Core */}
        <RadialGradient id="violetGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={primary} />
          <Stop offset="0.7" stopColor={primary} stopOpacity="0.3" />
          <Stop offset="1" stopColor={primary} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* 1. Underlying Shadow Path */}
      <Path
        d="M2 36 L12 14 L22 36 L32 14 L42 36"
        fill="none"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(1.5, 2)"
      />
      
      {/* 2. Fusion Surface Stroke (Silver + Violet) */}
      <Path
        d="M2 36 L12 14 L22 36 L32 14 L42 36"
        fill="none"
        stroke="url(#fusionGrad)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── THE INTELLIGENCE CORE ── */}
      <G transform="translate(22, 36)">
         {/* Outer Ambient Glow */}
         <Circle r="14" fill="url(#violetGlow)" opacity="0.6" />
         {/* Inner Hot Node */}
         <Circle r="4" fill={primary} opacity="0.5" />
         <Circle r="2.8" fill="#FFFFFF" />
      </G>
    </G>
  );

  if (variant === 'icon') {
    return (
      <View style={{ width, height: width }}>
        <Svg width={width} height={width} viewBox="-2 10 48 32">
           <ArchitecturalMark />
        </Svg>
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${vbW} ${vbH}`}>
        {/* ── THE SIGNATURE MARK ── */}
        <G transform="translate(10, 20)">
           <ArchitecturalMark />
        </G>

        {/* ── THE WORDMARK ── */}
        <SvgText
          x="72"
          y="60"
          fontSize="48"
          fontWeight="900"
          letterSpacing="-4.2"
          fontFamily="System"
        >
          <TSpan fill={secondary}>mali</TSpan>
          <TSpan fill={primary}>mind</TSpan>
        </SvgText>
        
        {/* Structural Precision Line */}
        <Path d="M72 70h140" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" />
      </Svg>
    </View>
  );
};
