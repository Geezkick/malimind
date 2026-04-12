import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';

export const ChatScreen = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'Hello! I am MaliMind, your financial copilot. Ask me anything about your spending, goals, or financial tips!' }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    const currentPrompt = prompt;
    setPrompt('');
    setLoading(true);

    try {
      const { data } = await apiClient.post('/ai/chat', { prompt: currentPrompt });
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-primary-900 pt-12 pb-4 px-4">
         <Text className="text-white text-xl font-bold text-center">AI Copilot</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {messages.map((msg, idx) => (
          <View 
            key={idx} 
            className={`max-w-[80%] rounded-2xl p-4 mb-4 ${
              msg.role === 'user' 
                ? 'bg-primary-500 self-end rounded-br-none' 
                : 'bg-white self-start rounded-bl-none shadow-sm'
            }`}
          >
            <Text className={msg.role === 'user' ? 'text-white' : 'text-gray-800'}>
              {msg.text}
            </Text>
          </View>
        ))}
        {loading && (
           <View className="bg-white self-start rounded-2xl rounded-bl-none p-4 mb-4 shadow-sm w-16 items-center">
              <ActivityIndicator color="#10b981" />
           </View>
        )}
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100 flex-row items-center">
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-2"
          placeholder="Ask about your budget..."
          value={prompt}
          onChangeText={setPrompt}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          className="bg-primary-600 rounded-full w-12 h-12 items-center justify-center"
          onPress={sendMessage}
          disabled={loading}
        >
          <Text className="text-white">🚀</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
