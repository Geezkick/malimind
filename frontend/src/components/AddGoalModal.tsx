import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { MaliCard } from './MaliCard';
import { MaliButton } from './MaliButton';

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
}

const EMOJIS = ['💰', '📈', '🚀', '🏠', '🚗', '✈️', '🎓', '🏥', '💻', '🌱', '🏗️', '💼'];

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ visible, onClose }) => {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [emoji, setEmoji] = useState('💰');
  const [deadline, setDeadline] = useState('');
  const queryClient = useQueryClient();

  const reset = () => { setTitle(''); setTarget(''); setEmoji('💰'); setDeadline(''); };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Enter a goal name');
      const parsed = parseFloat(target.replace(/,/g, ''));
      if (!parsed || isNaN(parsed) || parsed <= 0) throw new Error('Enter a valid target amount');
      if (!deadline) throw new Error('Enter a deadline (YYYY-MM-DD)');
      const date = new Date(deadline);
      if (isNaN(date.getTime()) || date <= new Date()) throw new Error('Deadline must be a future date');
      const { data } = await apiClient.post('/goals', {
        title: title.trim(),
        targetAmount: parsed,
        emoji,
        deadline: date.toISOString(),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      if (Platform.OS === 'web') alert(err.message || 'Failed to create goal');
      else Alert.alert('Error', err.message || 'Failed to create goal');
    },
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1, backgroundColor: '#0A0A0B' }}
      >
        {/* Header */}
        <View className="px-8 pt-8 pb-6 border-b border-white/[0.05] flex-row justify-between items-center bg-obsidian-900">
           <View>
              <Text className="text-white text-[24px] font-black tracking-tight uppercase">Financial Target</Text>
              <Text className="text-obsidian-300 text-[13px] font-medium tracking-wide">Initialize a new secure savings protocol.</Text>
           </View>
           <TouchableOpacity 
             onPress={() => { reset(); onClose(); }} 
             className="w-10 h-10 border border-white/10 rounded-xl items-center justify-center bg-white/[0.03]"
           >
             <Ionicons name="close" size={20} color="#F3F4F6" />
           </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 32 }} showsVerticalScrollIndicator={false}>
          {/* Emoji Picker */}
          <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-6 ml-1">Symbol Selection</Text>
          <View className="flex-row flex-wrap gap-3 mb-10">
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => setEmoji(e)}
                className={`w-14 h-14 rounded-2xl items-center justify-center border-2 transition-all ${emoji === e ? 'bg-primary-500/10 border-primary-500 shadow-lg shadow-primary-500/20' : 'bg-white/[0.02] border-white/[0.05]'}`}
              >
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="gap-6 mb-12">
            {/* Goal Name */}
            <View className="bg-white/[0.03] border border-white/[0.05] rounded-[24px] p-6 focus-within:border-primary-500/50">
              <Text className="text-white/40 text-[10px] font-black uppercase tracking-[2px] mb-2">Protocol Designation</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Asset Acquisition"
                placeholderTextColor="#27272A"
                className="text-white font-black text-[18px]"
                style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
              />
            </View>

            {/* Target Amount */}
            <View className="bg-white/[0.03] border border-white/[0.05] rounded-[24px] p-6">
              <Text className="text-white/40 text-[10px] font-black uppercase tracking-[2px] mb-2">Capital Threshold (KES)</Text>
              <TextInput
                value={target}
                onChangeText={setTarget}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#27272A"
                className="text-success font-black text-[42px] tracking-tighter"
                style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
              />
            </View>

            {/* Deadline */}
            <View className="bg-white/[0.03] border border-white/[0.05] rounded-[24px] p-6">
              <Text className="text-white/40 text-[10px] font-black uppercase tracking-[2px] mb-2">Maturity Date</Text>
              <View className="flex-row items-center">
                 <Ionicons name="calendar-outline" size={18} color="#4B5563" style={{marginRight: 10}} />
                 <TextInput
                  value={deadline}
                  onChangeText={setDeadline}
                  placeholder="2026-12-31"
                  placeholderTextColor="#27272A"
                  className="text-white font-black text-[18px] flex-1"
                  style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                 />
              </View>
            </View>
          </View>

          {/* Submit */}
          <View className="mb-20">
             <MaliButton 
                title={isPending ? "Initializing..." : "Authorize Protocol"} 
                onPress={() => mutate()}
                disabled={isPending}
                variant="glow"
                className="h-[70px]"
             />
             <TouchableOpacity 
               onPress={onClose}
               className="mt-8 items-center"
             >
                <Text className="text-obsidian-300 font-bold uppercase tracking-[2px] text-[11px]">Abort Operation</Text>
             </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
