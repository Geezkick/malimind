import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaliButton } from './MaliButton';
import { useToast } from './ToastProvider';
import { apiClient } from '../api/client';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    phone?: string;
    avatar?: string;
  };
  onSuccess: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  visible, 
  onClose, 
  initialData,
  onSuccess 
}) => {
  const [name, setName] = useState(initialData.name);
  const [phone, setPhone] = useState(initialData.phone || '');
  const [avatar, setAvatar] = useState(initialData.avatar || '');
  const [loading, setLoading] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const { showToast } = useToast();
  const updateUser = useAuthStore((state) => state.updateUser);

  useEffect(() => {
    setName(initialData.name);
    setPhone(initialData.phone || '');
    setAvatar(initialData.avatar || '');
  }, [initialData]);

  const pickImage = async () => {
    setPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedAsset = result.assets[0];
        // For development, we'll store as base64 data URI if possible, or just the URI
        const imageSource = selectedAsset.base64 ? `data:image/jpeg;base64,${selectedAsset.base64}` : selectedAsset.uri;
        setAvatar(imageSource);
        showToast('Photo selected', 'success');
      }
    } catch (error) {
      console.error('Image picking error:', error);
      showToast('Could not access gallery', 'error');
    } finally {
      setPickingImage(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Identity name required', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.patch('/users/profile', { name, phone, avatar });
      updateUser(data);
      showToast('Identity verified and updated', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Update profile error:', error);
      showToast('Validation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 justify-end bg-obsidian-900/60"
      >
        <View className="bg-obsidian-950 rounded-t-[48px] p-8 pb-12 border-t border-white/10 shadow-2xl">
          <View className="flex-row justify-between items-center mb-10">
            <View>
              <Text className="text-white text-[24px] font-black tracking-tight">Identity Update</Text>
              <Text className="text-obsidian-300 text-[13px] font-medium mt-1">Refine your operator profile context.</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              className="w-12 h-12 bg-white/[0.03] rounded-2xl items-center justify-center border border-white/[0.08]"
            >
              <Ionicons name="close" size={20} color="#F3F4F6" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* AVATAR PICKER SECTION */}
            <View className="items-center mb-10">
               <TouchableOpacity 
                 onPress={pickImage}
                 className="w-32 h-32 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-[40px] items-center justify-center overflow-hidden relative shadow-2xl"
               >
                  {avatar ? (
                    <Image source={{ uri: avatar }} className="w-full h-full" />
                  ) : (
                    <View className="items-center justify-center">
                       <Ionicons name="cloud-upload-outline" size={32} color="#5B2EFF" />
                       <Text className="text-obsidian-300 text-[10px] font-black uppercase tracking-widest mt-2 text-center px-4">Upload Fragment</Text>
                    </View>
                  )}
                  {pickingImage && (
                    <View className="absolute inset-0 bg-obsidian-950/60 items-center justify-center">
                       <ActivityIndicator color="#5B2EFF" />
                    </View>
                  )}
                  <View className="absolute bottom-0 right-0 left-0 bg-primary-500/90 py-1 items-center">
                     <Text className="text-white text-[9px] font-black uppercase tracking-widest">Change</Text>
                  </View>
               </TouchableOpacity>
               <Text className="text-white/20 text-[10px] font-bold mt-4 uppercase tracking-[2px]">Biometric Visual ID</Text>
            </View>

            <View className="gap-6 mb-12">
              <View>
                <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Legal Name</Text>
                <View className="flex-row items-center bg-white/[0.02] border border-white/[0.05] rounded-[22px] px-6 h-[68px]">
                  <Ionicons name="person-outline" size={18} color="#4B5563" style={{ marginRight: 15 }} />
                  <TextInput
                    className="flex-1 text-white font-black text-[17px]"
                    placeholder="Enter full name"
                    placeholderTextColor="#4B5563"
                    value={name}
                    onChangeText={setName}
                    style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                  />
                </View>
              </View>

              <View>
                <Text className="text-white/40 text-[11px] font-black uppercase tracking-[3px] mb-3 ml-1">Communication Channel</Text>
                <View className="flex-row items-center bg-white/[0.02] border border-white/[0.05] rounded-[22px] px-6 h-[68px]">
                  <Ionicons name="phone-portrait-outline" size={18} color="#4B5563" style={{ marginRight: 15 }} />
                  <TextInput
                    className="flex-1 text-white font-black text-[17px]"
                    placeholder="+254 XXX XXX XXX"
                    placeholderTextColor="#4B5563"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                  />
                </View>
              </View>
            </View>

            <MaliButton 
              title={loading ? "Authenticating..." : "Synchronize Identity"}
              onPress={handleSave}
              disabled={loading}
              className="h-[68px]"
            />
            
            <TouchableOpacity 
              onPress={onClose}
              className="mt-6 items-center"
            >
               <Text className="text-obsidian-300 font-bold uppercase tracking-[2px] text-[12px]">Cancel Update</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
