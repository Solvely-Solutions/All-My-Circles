import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GlassCard } from '../../components/ui/GlassCard';

export default function LinkedInDemoScreen() {
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-slate-950 to-blue-950">
      <StatusBar style="light" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-6 pt-12"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-white mb-2">
              LinkedIn Enrichment
            </Text>
            <Text className="text-gray-300 text-lg leading-relaxed">
              Demo our contact enrichment feature by entering an email address
            </Text>
          </View>

          {/* Demo Card */}
          <GlassCard className="p-6 mb-6">
            <View className="space-y-6">
              {/* Email Input */}
              <View>
                <Text className="text-white font-medium mb-3 text-lg">
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@company.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-4 text-white text-lg"
                  style={{
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  }}
                />
              </View>


              {/* Info */}
              <View className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                <Text className="text-blue-200 text-sm leading-relaxed">
                  💡 This demo uses real LinkedIn data enrichment via webhook. 
                  Enter any email address to see how we can automatically 
                  gather professional information about your contacts.
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Features */}
          <GlassCard className="p-6 mb-8">
            <Text className="text-white font-bold text-xl mb-4">
              What We Enrich
            </Text>
            
            <View className="space-y-3">
              {[
                { icon: '👤', text: 'Full name and professional title' },
                { icon: '🏢', text: 'Current company and position' },
                { icon: '📍', text: 'Location and timezone' },
                { icon: '🔗', text: 'LinkedIn profile URL' },
                { icon: '💼', text: 'Professional headline and summary' },
                { icon: '📸', text: 'Profile picture for better recognition' },
              ].map((item, index) => (
                <View key={index} className="flex-row items-center">
                  <Text className="text-2xl mr-3">{item.icon}</Text>
                  <Text className="text-gray-200 flex-1 leading-relaxed">
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Bottom spacing for safe area */}
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}