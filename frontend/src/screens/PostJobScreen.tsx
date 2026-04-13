import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaliCard } from '../components/MaliCard';
import { MaliButton } from '../components/MaliButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { MaliHeader } from '../components/MaliHeader';

export const PostJobScreen = () => {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState({
    title: '',
    category: 'Design',
    description: '',
    location: '',
    budget: '',
  });
  const [loading, setLoading] = useState(false);

  const CATEGORIES = ['Design', 'Development', 'Cleaning', 'Delivery', 'Construction', 'Other'];

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.budget) {
      if (Platform.OS === 'web') alert('Please fill in all required fields.');
      else Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/jobs', {
        ...form,
        budget: parseFloat(form.budget),
      });
      if (Platform.OS === 'web') {
        alert('Job posted successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Success', 'Job posted successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to post job:', error);
      if (Platform.OS === 'web') alert('Failed to post job. Please try again.');
      else Alert.alert('Error', 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <MaliHeader title="Create Job" showBack={true} />
      
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="max-w-[800px] w-full mx-auto">
          
        <MaliCard className="bg-white border border-navy-50 mb-8" variant="premium">
           <Text className="text-navy-300 font-black text-[11px] mb-6 uppercase tracking-[3px]">Project Brief</Text>
           
           <View className="gap-6">
              <View>
                 <Text className="text-navy-900 font-black text-[14px] mb-2 uppercase tracking-widest">Job Title*</Text>
                 <TextInput 
                   className="bg-navy-50/30 border border-navy-50 p-4 rounded-xl text-navy-900 font-bold"
                   placeholder="e.g. Logo Designer for Small Business"
                   placeholderTextColor="#94A3B8"
                   value={form.title}
                   onChangeText={(v) => setForm({...form, title: v})}
                   style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                 />
              </View>

              <View>
                 <Text className="text-navy-900 font-black text-[14px] mb-2 uppercase tracking-widest">Category</Text>
                 <View className="flex-row flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity 
                        key={cat}
                        onPress={() => setForm({...form, category: cat})}
                        className={`px-4 py-2 rounded-xl border-2 ${form.category === cat ? 'bg-primary-500 border-primary-500 shadow-sm' : 'bg-white border-navy-50'}`}
                      >
                         <Text className={`text-[13px] font-black ${form.category === cat ? 'text-white' : 'text-navy-300'}`}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                 </View>
              </View>

              <View className="flex-row gap-4">
                 <View className="flex-1">
                    <Text className="text-navy-900 font-black text-[14px] mb-2 uppercase tracking-widest">Budget (KES)*</Text>
                    <TextInput 
                      className="bg-navy-50/30 border border-navy-50 p-4 rounded-xl text-navy-900 font-bold"
                      placeholder="5000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={form.budget}
                      onChangeText={(v) => setForm({...form, budget: v})}
                      style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                    />
                 </View>
                 <View className="flex-1">
                    <Text className="text-navy-900 font-black text-[14px] mb-2 uppercase tracking-widest">Location</Text>
                    <TextInput 
                      className="bg-navy-50/30 border border-navy-50 p-4 rounded-xl text-navy-900 font-bold"
                      placeholder="e.g. Remote"
                      placeholderTextColor="#94A3B8"
                      value={form.location}
                      onChangeText={(v) => setForm({...form, location: v})}
                      style={Platform.OS === 'web' ? { outline: 'none' } as any : {}}
                    />
                 </View>
              </View>

              <View>
                 <Text className="text-navy-900 font-black text-[14px] mb-2 uppercase tracking-widest">Description*</Text>
                 <TextInput 
                   className="bg-navy-50/30 border border-navy-50 p-4 rounded-xl text-navy-900 font-bold min-h-[120px]"
                   placeholder="Describe what you need help with..."
                   placeholderTextColor="#94A3B8"
                   multiline
                   numberOfLines={4}
                   value={form.description}
                   onChangeText={(v) => setForm({...form, description: v})}
                   style={Platform.OS === 'web' ? { outline: 'none' } as any : { textAlignVertical: 'top' }}
                 />
              </View>
           </View>
        </MaliCard>

        <MaliButton 
          title={loading ? "Posting..." : "Review & Publish"} 
          onPress={handleSubmit}
          disabled={loading}
          className="h-16 bg-navy-900 shadow-xl shadow-navy-900/20"
        />
        </View>
      </ScrollView>
    </View>
  );
};
