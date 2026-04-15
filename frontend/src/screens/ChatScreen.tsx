import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, Animated, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { apiClient } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { MaliHeader } from '../components/MaliHeader';
import { useAuthStore } from '../store/authStore';
import { MaliCard } from '../components/MaliCard';
import { MaliPressable } from '../components/MaliPressable';

export const ChatScreen = () => {
  const { activeMode } = useAuthStore();
  const accentColor = '#5B2EFF';

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    {
      role: 'ai',
      text: "Hello! I'm Mali, your intelligence layer. I can help you optimize your cash flow, analyze circle investments, and manage your wealth. How can I assist you today?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Typing animation dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      const animateDot = (dot: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          ])
        ).start();
      };
      animateDot(dot1, 0);
      animateDot(dot2, 200);
      animateDot(dot3, 400);
    } else {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
  }, [loading, dot1, dot2, dot3]);

  const sendMessage = useCallback(async () => {
    if (!prompt.trim() || loading) return;

    const currentPrompt = prompt;
    setMessages(prev => [...prev, { role: 'user', text: currentPrompt }]);
    setPrompt('');
    setLoading(true);

    try {
      const { data } = await apiClient.post('/ai/chat', {
        prompt: currentPrompt,
        context: activeMode
      });
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error communicating with the intelligence layer.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [prompt, loading, activeMode]);

  const [suggestions] = useState([
    'Optimize my capital allocation',
    'Summarize my active synergy circles',
    'Analyze my last transaction'
  ]);

  const renderBubble = useCallback(({ item }: { item: { role: 'user' | 'ai', text: string } }) => (
    <Animated.View
      className={`flex-row items-start max-w-[90%] mb-10 ${item.role === 'user' ? 'self-end flex-row-reverse' : ''}`}
    >
      <View
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${item.role === 'user'
          ? 'bg-obsidian-800 border-white/10 ml-4'
          : 'mr-4 shadow-primary-500/20'
          }`}
        style={item.role === 'ai' ? { backgroundColor: accentColor, borderColor: 'transparent' } : {}}
      >
        {item.role === 'user' ? (
          <Ionicons name="person-outline" size={18} color="#9CA3AF" />
        ) : (
          <Ionicons name="sparkles" size={20} color="white" />
        )}
      </View>

      <MaliCard
        variant={item.role === 'ai' ? 'glass' : 'surface'}
        className={`p-5 min-w-[60px] ${item.role === 'user'
          ? 'rounded-tr-none border-white/5'
          : 'rounded-tl-none border-primary-500/20'
          }`}
      >
        <Text className={`text-[15px] leading-relaxed font-semibold tracking-tight ${item.role === 'user' ? 'text-white' : 'text-obsidian-50'}`}>
          {item.text}
        </Text>
      </MaliCard>
    </Animated.View>
  ), []);

  const renderFooter = useCallback(() => (
    <View>
      {loading && (
        <View className="flex-row items-start max-w-[85%] mb-10">
          <View
            className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20 mr-4"
          >
            <Ionicons name="sparkles" size={20} color="white" />
          </View>
          <MaliCard variant="glass" className="p-5 rounded-tl-none flex-row items-center gap-1">
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View
                key={i}
                style={{ opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }}
                className="w-1.5 h-1.5 rounded-full bg-primary-500"
              />
            ))}
          </MaliCard>
        </View>
      )}

      {!loading && messages.length <= 2 && (
        <View className="flex-row flex-wrap justify-center gap-2.5 mt-4 mb-8">
          {suggestions.map((suggestion, i) => (
            <MaliPressable
              key={i}
              className="flex-row items-center justify-center bg-white/[0.03] border border-white/10 px-5 py-3 rounded-2xl"
              onPress={() => setPrompt(suggestion)}
            >
              <Text className="text-obsidian-300 text-[13px] font-bold tracking-tight text-center">{suggestion}</Text>
            </MaliPressable>
          ))}
        </View>
      )}
    </View>
  ), [loading, messages.length, suggestions, dot1, dot2, dot3]);

  return (
    <View className="flex-1 bg-obsidian-900">
      <MaliHeader title="Intelligence" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 w-full max-w-[800px] mx-auto"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={11}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 24, paddingTop: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={renderBubble}
          ListFooterComponent={renderFooter}
        />

        <View className="p-6 bg-obsidian-900 border-t border-white/[0.05] flex-row items-center">
          <View className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex-row items-center px-5 h-16">
            <TextInput
              className="flex-1 text-white font-semibold text-[15px] mr-2"
              placeholder="Ask anything..."
              placeholderTextColor="#4B5563"
              value={prompt}
              onChangeText={setPrompt}
              onSubmitEditing={sendMessage}
              style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
            />
            <MaliPressable
              onPress={sendMessage}
              disabled={loading}
              className={`${loading ? 'opacity-30' : ''} w-10 h-10 bg-primary-500 rounded-xl items-center justify-center shadow-lg shadow-primary-500/20`}
            >
              <Ionicons name="send" size={18} color="white" />
            </MaliPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
