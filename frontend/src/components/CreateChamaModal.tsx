import React, { useState } from 'react';
import { View, Text, Modal, TextInput, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaliButton } from './MaliButton';
import { MaliPressable } from './MaliPressable';
import { useToast } from './ToastProvider';
import { apiClient } from '../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateChamaModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateChamaModal: React.FC<CreateChamaModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const reset = () => {
    setName('');
    setDescription('');
    setTargetAmount('');
    setFrequency('monthly');
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Pool name required');
      const amount = parseFloat(targetAmount.replace(/,/g, ''));
      const response = await apiClient.post('/chamas', {
        name,
        description,
        targetAmount: isNaN(amount) ? undefined : amount,
        frequency
      });
      return response.data;
    },
    onSuccess: (data) => {
      showToast(`Synergy Circle Created! Code: ${data.inviteCode}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['chamas'] });
      reset();
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Creation failed';
      showToast(msg, 'error');
    }
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-obsidian-900/60"
      >
        <View className="bg-obsidian-950 rounded-t-[48px] p-8 pb-12 border-t border-white/10 shadow-2xl">
          <View className="flex-row justify-between items-center mb-10">
            <View>
              <Text className="text-white text-[24px] font-black tracking-tight">New Synergy Circle</Text>
              <Text className="text-obsidian-300 text-[13px] font-medium mt-1">Initialize a collective capital protocol.</Text>
            </View>
            <MaliPressable
              onPress={() => { reset(); onClose(); }}
              className="w-12 h-12 bg-white/[0.03] rounded-2xl items-center justify-center border border-white/[0.08]"
            >
              <Ionicons name="close" size={20} color="#F3F4F6" />
            </MaliPressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-6 mb-12">
              <View>
                <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Circle Name</Text>
                <View className="flex-row items-center bg-white/[0.02] border border-white/[0.05] rounded-[22px] px-6 h-[68px]">
                  <Ionicons name="people-outline" size={18} color="#4B5563" style={{ marginRight: 15 }} />
                  <TextInput
                    className="flex-1 text-white font-black text-[17px]"
                    placeholder="e.g. Alpha Investment Group"
                    placeholderTextColor="#4B5563"
                    value={name}
                    onChangeText={setName}
                    style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                  />
                </View>
              </View>

              <View>
                <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Target Capital (Optional)</Text>
                <View className="flex-row items-center bg-white/[0.02] border border-white/[0.05] rounded-[22px] px-6 h-[68px]">
                  <Text className="text-success font-black mr-3">KES</Text>
                  <TextInput
                    className="flex-1 text-white font-black text-[17px]"
                    placeholder="500,000"
                    placeholderTextColor="#4B5563"
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                    keyboardType="numeric"
                    style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                  />
                </View>
              </View>

              <View>
                <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Contribution Frequency</Text>
                <View className="flex-row gap-3">
                  {['daily', 'weekly', 'monthly'].map(f => (
                    <MaliPressable
                      key={f}
                      onPress={() => setFrequency(f)}
                      className={`flex-1 py-4 rounded-2xl items-center border ${frequency === f ? 'bg-primary-500 border-primary-500' : 'bg-white/[0.02] border-white/[0.05]'}`}
                    >
                      <Text className={`text-[10px] font-black uppercase tracking-widest ${frequency === f ? 'text-white' : 'text-obsidian-300'}`}>{f}</Text>
                    </MaliPressable>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Mission Context</Text>
                <TextInput
                  className="bg-white/[0.02] border border-white/[0.05] rounded-[22px] p-6 text-white font-medium text-[15px] min-h-[100px]"
                  placeholder="Describe the circle goals..."
                  placeholderTextColor="#4B5563"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                  style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                />
              </View>
            </View>

            <MaliButton
              title={isPending ? "Generating Protocol..." : "Activate Synergy Circle"}
              onPress={() => mutate()}
              disabled={isPending}
              variant="glow"
              className="h-[68px]"
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
