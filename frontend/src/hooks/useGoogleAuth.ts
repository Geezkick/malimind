import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
    const login = useAuthStore((state) => state.login);
    const [loading, setLoading] = React.useState(false);

    // You would typically get these from your environment config
    // For now, these are placeholders. The user will need to provide real IDs
    // for a production build.
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    });

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleLogin(id_token);
        }
    }, [response]);

    const handleGoogleLogin = async (idToken: string) => {
        setLoading(true);
        try {
            const { data } = await apiClient.post('/auth/google', { token: idToken });
            login(data.token, data.user);
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        signIn: () => promptAsync(),
        loading,
        disabled: !request,
    };
};
