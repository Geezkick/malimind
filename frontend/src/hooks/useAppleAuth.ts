import { Platform } from 'react-native';
import * as React from 'react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

export const useAppleAuth = () => {
    const login = useAuthStore((state) => state.login);
    const [loading, setLoading] = React.useState(false);

    const signIn = async () => {
        if (Platform.OS === 'web') {
            alert('Apple Sign-In is not supported on web.');
            return;
        }

        setLoading(true);
        try {
            // Dynamically import apple auth only on native
            const AppleAuthentication = await import('expo-apple-authentication');
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const { data } = await apiClient.post('/auth/apple', {
                    token: credential.identityToken,
                    name: credential.fullName
                        ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
                        : undefined,
                });
                login(data.token, data.user);
            }
        } catch (e: any) {
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                console.error('Apple login error:', e);
                throw e;
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        signIn,
        loading,
    };
};
