import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { apiClient } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { MaliHeader } from '../components/MaliHeader';
import { useAuthStore } from '../store/authStore';
import { MaliCard } from '../components/MaliCard';

export const ChatScreen = () => {
  const { activeMode } = useAuthStore();
  const accentColor = '#5B2EFF'; 
  
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { 
      role: 'ai', 
      text: "Hello! I'm Mali, your intelligence layer. I can help you optimize your cash flow, find high-yield gigs, or manage your business team. How can I assist you today?" 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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
    }
  }, [loading]);

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    const currentPrompt = prompt;
    setPrompt('');
    setLoading(true);

    try {
      const { data } = await apiClient.post('/ai/chat', { 
        prompt: currentPrompt,
        context: activeMode 
      });
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const suggestions = [
    'Optimize my savings', 
    'Find high-pay dev gigs', 
    'Analyze my last transaction'
  ];

  return (
    <View className="flex-1 bg-obsidian-900">
      <MaliHeader title="Intelligence" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6 pt-4"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, idx) => (
            <Animated.View 
              key={idx} 
              className={`flex-row items-start max-w-[90%] mb-10 ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}
            >
              <View 
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${
                  msg.role === 'user' 
                    ? 'bg-obsidian-800 border-white/10 ml-4' 
                    : 'mr-4 shadow-primary-500/20'
                }`}
                style={msg.role === 'ai' ? { backgroundColor: accentColor, borderColor: 'transparent' } : {}}
              >
                {msg.role === 'user' ? (
                  <Ionicons name="person-outline" size={18} color="#9CA3AF" />
                ) : (
                  <Ionicons name="sparkles" size={20} color="white" />
                )}
              </View>

              <MaliCard 
                variant={msg.role === 'ai' ? 'glass' : 'surface'}
                className={`p-5 min-w-[60px] ${
                  msg.role === 'user' 
                    ? 'rounded-tr-none border-white/5' 
                    : 'rounded-tl-none border-primary-500/20'
                }`}
              >
                <Text className={`text-[15px] leading-relaxed font-semibold tracking-tight ${msg.role === 'user' ? 'text-white' : 'text-obsidian-50'}`}>
                  {msg.text}
                </Text>
              </MaliCard>
            </Animated.View>
          ))}
          
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
                       style={{ opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0,1], outputRange: [0, -4] }) }] }}
                       className="w-1.5 h-1.5 rounded-full bg-primary-500" 
                     />
                   ))}
                </MaliCard>
             </View>
          )}

          {!loading && (
            <View className="flex-row flex-wrap gap-2.5 mt-4 mb-8">
              {suggestions.map((suggestion, i) => (
                <TouchableOpacity 
                   key={i}
                   className="flex-row items-center bg-white/[0.03] border border-white/10 px-5 py-3 rounded-2xl active:bg-white/5"
                   onPress={() => setPrompt(suggestion)}
                >
                   <Text className="text-obsidian-300 text-[13px] font-bold tracking-tight">{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

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
            <TouchableOpacity 
              onPress={sendMessage}
              disabled={loading}
              className={`${loading ? 'opacity-30' : ''} w-10 h-10 bg-primary-500 rounded-xl items-center justify-center shadow-lg shadow-primary-500/20`}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
