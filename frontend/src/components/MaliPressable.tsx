import React, { useState } from 'react';
import { TouchableOpacity, TouchableOpacityProps, Platform, Animated, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface MaliPressableProps extends TouchableOpacityProps {
    children: React.ReactNode;
    haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'none';
    scaleTo?: number;
    style?: StyleProp<ViewStyle>;
}

export const MaliPressable: React.FC<MaliPressableProps> = ({
    children,
    haptic = 'light',
    scaleTo = 0.96,
    style,
    onPress,
    onPressIn,
    onPressOut,
    ...props
}) => {
    const [scale] = useState(new Animated.Value(1));

    const handlePressIn = (e: any) => {
        if (Platform.OS !== 'web' && haptic !== 'none') {
            if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            else if (haptic === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            else if (haptic === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        Animated.spring(scale, {
            toValue: scaleTo,
            useNativeDriver: true,
            speed: 50,
            bounciness: 0
        }).start();

        if (onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: any) => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 8
        }).start();

        if (onPressOut) onPressOut(e);
    };

    const handlePress = (e: any) => {
        if (Platform.OS !== 'web' && (haptic === 'success' || haptic === 'error')) {
            Haptics.notificationAsync(
                haptic === 'success'
                    ? Haptics.NotificationFeedbackType.Success
                    : Haptics.NotificationFeedbackType.Error
            );
        }
        if (onPress) onPress(e);
    };

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                {...props}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};
