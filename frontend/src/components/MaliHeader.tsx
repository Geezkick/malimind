import React from 'react';
import { View, Text, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MalimindLogo } from './MalimindLogo';
import { MaliPressable } from './MaliPressable';

interface MaliHeaderProps {
  title?: string;
  showBack?: boolean;
  showProfile?: boolean;
  showSettings?: boolean;
}

export const MaliHeader: React.FC<MaliHeaderProps> = ({
  title,
  showBack,
  showProfile = true,
  showSettings = false // Default to false as per user request
}) => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const canGoBack = navigation.canGoBack();
  const shouldShowBack = showBack ?? canGoBack;

  return (
    <View
      style={Platform.OS === 'web' ? {
        zIndex: 100,
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(10, 10, 11, 0.75)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
      } : {
        zIndex: 100,
        backgroundColor: 'rgba(10, 10, 11, 0.95)'
      } as any}
    >
      <View
        className="flex-row justify-between items-center px-6 pb-4 w-full max-w-[1200px] mx-auto"
        style={Platform.OS === 'web' ? {
          paddingTop: 32,
        } : {
          paddingTop: insets.top + 10,
        } as any}
      >
      <View className="flex-row items-center flex-1">
        {shouldShowBack ? (
          <MaliPressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 border border-white/10 rounded-xl items-center justify-center mr-4"
          >
            <Ionicons name="chevron-back" size={20} color="#F3F4F6" />
          </MaliPressable>
        ) : (
          <MaliPressable onPress={() => navigation.navigate('Home')} className="flex-row items-center gap-2">
            <MalimindLogo width={130} variant="full" />
          </MaliPressable>
        )}

        {title && (
          <View className={shouldShowBack ? "" : "ml-4"}>
            <Text className="text-obsidian-50 text-[18px] font-black tracking-tight leading-none uppercase">{title}</Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-3">
        {showSettings && (
          <MaliPressable
            onPress={() => navigation.navigate('Settings')}
            className="w-10 h-10 border border-white/10 rounded-xl items-center justify-center bg-white/[0.03]"
          >
            <Ionicons name="settings-outline" size={18} color="#9CA3AF" />
          </MaliPressable>
        )}

        {showProfile && (
          <MaliPressable
            onPress={() => navigation.navigate('Profile')}
            className="w-10 h-10 border border-white/10 rounded-xl items-center justify-center overflow-hidden"
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} className="w-full h-full" />
            ) : (
              <View className="w-full h-full bg-primary-500 items-center justify-center">
                <Text className="text-white font-black text-xs">{(user?.name || 'U')[0]}</Text>
              </View>
            )}
          </MaliPressable>
        )}
      </View>
      </View>
    </View>
  );
};
