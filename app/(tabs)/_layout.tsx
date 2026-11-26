import React from 'react';
import { Tabs } from 'expo-router';
import { BlobTabBar } from '@/components/BlobTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BlobTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="subjects" options={{ title: 'Subjects' }} />
      <Tabs.Screen name="journey" options={{ title: 'Journey' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
