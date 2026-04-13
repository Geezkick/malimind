import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingStarsProps {
  rating: number;
  size?: number;
  showText?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  size = 16, 
  showText = false 
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <View className="flex-row items-center">
      {[...Array(5)].map((_, i) => (
        <Ionicons 
          key={i}
          name={i < fullStars ? 'star' : (i === fullStars && hasHalfStar ? 'star-half' : 'star-outline')}
          size={size}
          color={i < fullStars || (i === fullStars && hasHalfStar) ? '#FBBF24' : '#CBD5E1'}
        />
      ))}
      {showText && (
        <Text className="ml-2 text-[#0B1B2B] font-bold text-sm">{rating.toFixed(1)}</Text>
      )}
    </View>
  );
};
