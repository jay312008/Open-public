import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { AppProvider } from '@/store/AppContext';

function RootNavigator() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="saved-resources" />
        <Stack.Screen name="tools/ask-molly" />
        <Stack.Screen name="tools/live-teacher" />
        <Stack.Screen name="tools/exam-predictor" />
        <Stack.Screen name="tools/quiz-generator" />
        <Stack.Screen name="tools/book-analyzer" />
        <Stack.Screen name="tools/image-analyzer" />
        <Stack.Screen name="tools/subject-generator" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/choose-molly" />
        <Stack.Screen name="settings/notifications" />
        <Stack.Screen name="settings/edit-profile" />
        <Stack.Screen name="profile/[username]" />
        <Stack.Screen name="community/group/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <RootNavigator />
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
