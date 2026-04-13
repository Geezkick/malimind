import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { MaliHeader } from '../components/MaliHeader';

export const WorkerProfileScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    title: '',
    skills: '',
    hourlyRate: '',
    location: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/profiles/my');
        if (data) {
          setForm({
            title: data.title || '',
            skills: data.skills || '',
            hourlyRate: data.hourlyRate?.toString() || '',
            location: data.location || '',
          });
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Failed to load profile:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!form.title || !form.hourlyRate) {
      if (Platform.OS === 'web') alert('Please fill in your primary title and hourly rate.');
      else Alert.alert('Error', 'Please fill in your primary title and hourly rate.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/profiles/my', {
        ...form,
        hourlyRate: parseFloat(form.hourlyRate),
      });
      if (Platform.OS === 'web') alert('Profile updated effectively!');
      else Alert.alert('Success', 'Profile updated effectively!');
    } catch (error) {
       console.error('Failed to update profile:', error);
       if (Platform.OS === 'web') alert('Failed to update profile.');
       else Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#2EC4B6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <MaliHeader title="Identity" showBack={true} />
      
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="max-w-[800px] w-full mx-auto">
          
        <MaliCard className="bg-navy-900 mb-8 border-0" variant="navy">
           <View className="flex-row items-center gap-4">
              <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center">
                 <Ionicons name="briefcase" size={28} color="#2EC4B6" />
              </View>
              <View className="flex-1">
                 <Text className="text-white font-black text-lg">Marketplace Setup</Text>
                 <Text className="text-navy-300 text-xs font-medium">Earn money by offering your skills.</Text>
              </View>
           </View>
        </MaliCard>

        <MaliCard className="bg-white border border-navy-50 mb-8" variant="premium">
           <View className="gap-6">
              <View>
                 <Text className="text-navy-900 font-black text-[14px] mb-2 uppercase tracking-widest">Job Title</Text>
                 <TextInput 
                   className="bg-navy-50/30 border border-navy-50 p-4 rounded-xl text-navy-900 font-bold"
                   placeholder="e.g. Senior Graphic Designer"
                   placeholderTextColor="#94A3B8"
                   value={form.title}
                   onChangeText={(v) => setForm({...form, title: v})}
                   style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                 />
              </View>

              <View>
                 <Text className="text-navy-900 font-black text-[14px] mb-2 uppercase tracking-widest">Skills</Text>
                 <TextInput 
                   className="bg-navy-50/30 border border-navy-50 p-4 rounded-xl text-navy-900 font-bold"
                   placeholder="e.g. Photoshop, Figma, Logo Design"
                   placeholderTextColor="#94A3B8"
                   value={form.skills}
                   onChangeText={(v) => setForm({...form, skills: v})}
                   style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                 />
              </View>

              <View className="flex-row gap-4">
                 <View className="flex-1">
                    <Text className="text-navy-900 font-black text-[14px] mb-2 uppercase tracking-widest">Rate (KES/hr)</Text>
                    <TextInput 
                      className="bg-navy-50/30 border border-navy-50 p-4 rounded-xl text-navy-900 font-bold"
                      placeholder="1500"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={form.hourlyRate}
                      onChangeText={(v) => setForm({...form, hourlyRate: v})}
                      style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                    />
                 </View>
                 <View className="flex-1">
                    <Text className="text-navy-900 font-black text-[14px] mb-2 uppercase tracking-widest">City</Text>
                    <TextInput 
                      className="bg-navy-50/30 border border-navy-50 p-4 rounded-xl text-navy-900 font-bold"
                      placeholder="Nairobi"
                      placeholderTextColor="#94A3B8"
                      value={form.location}
                      onChangeText={(v) => setForm({...form, location: v})}
                      style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                    />
                 </View>
              </View>
           </View>
        </MaliCard>

        <MaliButton 
          title={saving ? "Saving..." : "Save Identity"} 
          onPress={handleSave}
          disabled={saving}
          className="h-16 bg-primary-500 shadow-lg shadow-primary-500/30"
        />

        <View className="mt-8">
           <MaliCard className="bg-primary-50/30 border-dashed border-primary-200 items-center p-8">
              <Ionicons name="shield-checkmark" size={32} color="#2EC4B6" className="mb-2" />
              <Text className="text-navy-400 text-center text-sm font-medium leading-relaxed">
                 Verified Workers receive <Text className="text-primary-500 font-black">3x more hiring requests</Text>. Apply for verification after your first 5 reviews.
              </Text>
           </MaliCard>
        </View>
        </View>
      </ScrollView>
    </View>
  );
};
