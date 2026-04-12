import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

export const HomeScreen = () => {
  const user = useAuthStore((state) => state.user);
  
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/dashboard');
      return data;
    }
  });

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {/* Header */}
      <View className="bg-primary-900 px-6 pt-12 pb-8 rounded-b-3xl">
        <Text className="text-primary-100 text-lg">Hello, {user?.name}</Text>
        <Text className="text-white text-3xl font-bold mt-1">
          {dashboard?.currency || 'KES'} {dashboard?.balance?.toLocaleString() || '0'}
        </Text>
        <Text className="text-primary-100 mt-2">Total Balance</Text>
      </View>

      <View className="px-6 mt-6">
        {/* Safe to spend alert */}
        {dashboard && (
          <View className={`p-4 rounded-xl mb-6 ${dashboard.safeToSpend < 500 ? 'bg-red-100' : 'bg-green-100'}`}>
             <Text className="font-bold text-gray-800">Safe to Spend today</Text>
             <Text className={`text-2xl font-bold ${dashboard.safeToSpend < 500 ? 'text-red-600' : 'text-green-600'}`}>
                KES {dashboard.safeToSpend.toLocaleString()}
             </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View className="flex-row justify-between mb-8">
           <TouchableOpacity className="bg-white p-4 rounded-2xl w-[48%] items-center shadow-sm">
              <Text className="text-xl mb-1">⬇️</Text>
              <Text className="font-semibold text-gray-700">Income</Text>
           </TouchableOpacity>
           <TouchableOpacity className="bg-white p-4 rounded-2xl w-[48%] items-center shadow-sm">
              <Text className="text-xl mb-1">⬆️</Text>
              <Text className="font-semibold text-gray-700">Expense</Text>
           </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <Text className="text-xl font-bold text-gray-800 mb-4">Recent Transactions</Text>
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          {dashboard?.recentTransactions?.length === 0 ? (
             <Text className="text-gray-500 text-center py-4">No transactions yet.</Text>
          ) : (
            dashboard?.recentTransactions?.map((tx: any) => (
              <View key={tx.id} className="flex-row justify-between items-center py-3 border-b border-gray-100">
                 <View>
                    <Text className="font-semibold text-gray-800">{tx.category}</Text>
                    <Text className="text-gray-400 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</Text>
                 </View>
                 <Text className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}KES {tx.amount}
                 </Text>
              </View>
            ))
          )}
        </View>
        
        {/* Active Goals */}
        <Text className="text-xl font-bold text-gray-800 mb-4">Active Goals</Text>
        {dashboard?.goals?.map((goal: any) => (
           <View key={goal.id} className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <View className="flex-row justify-between items-end mb-2">
                 <Text className="font-semibold text-gray-800 text-lg">{goal.emoji} {goal.title}</Text>
                 <Text className="text-gray-500">KES {goal.currentAmount} / {goal.targetAmount}</Text>
              </View>
              <View className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                 <View 
                    className="h-full bg-primary-500" 
                    style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }} 
                 />
              </View>
           </View>
        ))}
      </View>
    </ScrollView>
  );
};
