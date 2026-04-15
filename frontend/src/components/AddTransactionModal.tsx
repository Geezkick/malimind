import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { MaliButton } from './MaliButton';
import { MaliPressable } from './MaliPressable';

interface AddTransactionModalProps {
  visible: boolean;
  defaultType?: 'income' | 'expense';
  onClose: () => void;
}

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Rent', 'Shopping', 'Health', 'Education', 'Entertainment', 'Other'];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  defaultType = 'expense',
  onClose,
}) => {
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const reset = () => {
    setAmount('');
    setCategory('');
    setNote('');
    setType(defaultType);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const parsed = parseFloat(amount.replace(/,/g, ''));
      if (!parsed || isNaN(parsed) || parsed <= 0) throw new Error('Enter a valid amount');
      if (!category) throw new Error('Select a category');
      const { data } = await apiClient.post('/transactions', {
        type,
        amount: parsed,
        category,
        note: note || undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      if (Platform.OS === 'web') alert(err.message || 'Failed to save transaction');
      else Alert.alert('Error', err.message || 'Failed to save transaction');
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
            <Text className="text-white text-[24px] font-black tracking-tight uppercase">Capital Flow</Text>
            <Text className="text-obsidian-300 text-[13px] font-medium tracking-wide">Sync a new transaction to the mainframe.</Text>
          </View>
          <MaliPressable
            onPress={() => { reset(); onClose(); }}
            className="w-10 h-10 border border-white/10 rounded-xl items-center justify-center bg-white/[0.03]"
          >
            <Ionicons name="close" size={20} color="#F3F4F6" />
          </MaliPressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 32 }} showsVerticalScrollIndicator={false}>
          {/* Type Toggle */}
          <View className="flex-row bg-white/[0.02] rounded-2xl p-1.5 mb-10 border border-white/[0.05]">
            {(['income', 'expense'] as const).map((t) => (
              <MaliPressable
                key={t}
                onPress={() => { setType(t); setCategory(''); }}
                className={`flex-1 h-12 rounded-xl items-center justify-center transition-all ${type === t ? (t === 'income' ? 'bg-success shadow-lg shadow-success/20' : 'bg-red-500 shadow-lg shadow-red-500/20') : ''}`}
              >
                <Text className={`text-[11px] font-black uppercase tracking-[1px] ${type === t ? 'text-black' : 'text-obsidian-300'}`}>
                  {t === 'income' ? 'Allocation In' : 'Allocation Out'}
                </Text>
              </MaliPressable>
            ))}
          </View>

          {/* Amount Section */}
          <View className="bg-white/[0.03] border border-white/[0.05] rounded-[32px] p-8 mb-10 items-center justify-center">
            <Text className="text-white/40 text-[10px] font-black uppercase tracking-[2px] mb-4">Value (KES)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#27272A"
              className={`text-[56px] font-black tracking-tighter text-center ${type === 'income' ? 'text-success' : 'text-red-500'}`}
              style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
            />
          </View>

          {/* Categories */}
          <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-6 ml-1">Contextual classification</Text>
          <View className="flex-row flex-wrap gap-2.5 mb-10">
            {categories.map((cat) => (
              <MaliPressable
                key={cat}
                onPress={() => setCategory(cat)}
                className={`px-6 py-3.5 rounded-2xl border transition-all ${category === cat ? 'bg-primary-500 border-primary-500 shadow-lg shadow-primary-500/20' : 'bg-white/[0.02] border-white/[0.05]'}`}
              >
                <Text className={`text-[12px] font-black uppercase tracking-[0.5px] ${category === cat ? 'text-white' : 'text-obsidian-300'}`}>{cat}</Text>
              </MaliPressable>
            ))}
          </View>

          {/* Note */}
          <View className="bg-white/[0.03] border border-white/[0.05] rounded-[24px] p-6 mb-12">
            <Text className="text-white/40 text-[10px] font-black uppercase tracking-[2px] mb-2">Meta identifier</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Asset Acquisition"
              placeholderTextColor="#27272A"
              className="text-white font-black text-[18px]"
              style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
            />
          </View>

          {/* Submit */}
          <View className="mb-20">
            <MaliButton
              title={isPending ? "Syncing..." : `Verify ${type === 'income' ? 'Allocation' : 'Debit'}`}
              onPress={() => mutate()}
              disabled={isPending}
              variant="glow"
              className={`h-[70px] ${type === 'expense' ? 'shadow-red-500/20' : ''}`}
              style={type === 'expense' ? { backgroundColor: '#EF4444' } : {}}
            />
            <MaliPressable
              onPress={onClose}
              className="mt-8 items-center"
            >
              <Text className="text-obsidian-300 font-bold uppercase tracking-[2px] text-[11px]">Abort Sync</Text>
            </MaliPressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
