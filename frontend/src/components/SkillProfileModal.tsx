import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaliButton } from './MaliButton';
import { useToast } from './ToastProvider';
import { apiClient } from '../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface SkillProfileModalProps {
  visible: boolean;
  onClose: () => void;
  initialData?: any;
}

export const SkillProfileModal: React.FC<SkillProfileModalProps> = ({ 
  visible, 
  onClose, 
  initialData 
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [skills, setSkills] = useState(initialData?.skills || '');
  const [hourlyRate, setHourlyRate] = useState(initialData?.hourlyRate?.toString() || '');
  const [location, setLocation] = useState(initialData?.location || '');
  
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSkills(initialData.skills || '');
      setHourlyRate(initialData.hourlyRate?.toString() || '');
      setLocation(initialData.location || '');
    }
  }, [initialData]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Professional title required');
      const rate = parseFloat(hourlyRate);
      const { data } = await apiClient.post('/profiles/my', {
        title,
        skills,
        hourlyRate: isNaN(rate) ? 0 : rate,
        location
      });
      return data;
    },
    onSuccess: () => {
      showToast('Skill Profile synchronized', 'success');
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'workers'] });
      onClose();
    },
    onError: (err: any) => {
      showToast(err.message || 'Update failed', 'error');
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
              <Text className="text-white text-[24px] font-black tracking-tight">Worker Identity</Text>
              <Text className="text-obsidian-300 text-[13px] font-medium mt-1">Configure your marketplace presence.</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              className="w-12 h-12 bg-white/[0.03] rounded-2xl items-center justify-center border border-white/[0.08]"
            >
              <Ionicons name="close" size={20} color="#F3F4F6" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-6 mb-12">
              <View>
                <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Professional Title</Text>
                <View className="flex-row items-center bg-white/[0.02] border border-white/[0.05] rounded-[22px] px-6 h-[68px]">
                  <Ionicons name="briefcase-outline" size={18} color="#4B5563" style={{ marginRight: 15 }} />
                  <TextInput
                    className="flex-1 text-white font-black text-[17px]"
                    placeholder="e.g. Senior Software Architect"
                    placeholderTextColor="#4B5563"
                    value={title}
                    onChangeText={setTitle}
                    style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                  />
                </View>
              </View>

              <View>
                <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Core Skills (Tags)</Text>
                <View className="flex-row items-center bg-white/[0.02] border border-white/[0.05] rounded-[22px] px-6 h-[68px]">
                  <Ionicons name="construct-outline" size={18} color="#4B5563" style={{ marginRight: 15 }} />
                  <TextInput
                    className="flex-1 text-white font-black text-[17px]"
                    placeholder="React, NestJS, AWS..."
                    placeholderTextColor="#4B5563"
                    value={skills}
                    onChangeText={setSkills}
                    style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                  />
                </View>
              </View>

              <View className="flex-row gap-4">
                 <View className="flex-1">
                    <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Hourly Rate (KES)</Text>
                    <View className="flex-row items-center bg-white/[0.02] border border-white/[0.05] rounded-[22px] px-6 h-[68px]">
                      <TextInput
                        className="flex-1 text-success font-black text-[17px]"
                        placeholder="2500"
                        placeholderTextColor="#4B5563"
                        value={hourlyRate}
                        onChangeText={setHourlyRate}
                        keyboardType="numeric"
                        style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                      />
                    </View>
                 </View>
                 <View className="flex-1">
                    <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Location</Text>
                    <View className="flex-row items-center bg-white/[0.02] border border-white/[0.05] rounded-[22px] px-6 h-[68px]">
                      <TextInput
                        className="flex-1 text-white font-black text-[17px]"
                        placeholder="Nairobi"
                        placeholderTextColor="#4B5563"
                        value={location}
                        onChangeText={setLocation}
                        style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                      />
                    </View>
                 </View>
              </View>
            </View>

            <MaliButton 
              title={isPending ? "Syncing Identity..." : "Authorize Worker Profile"}
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
