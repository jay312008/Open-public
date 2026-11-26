import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function NotificationsInboxScreen() {
  const { colors } = useTheme();
  const { notifications, markAllNotificationsRead } = useApp();

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Notifications" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <AnimatedPressable onPress={markAllNotificationsRead} style={{ alignSelf: 'flex-end' }}>
            <Text style={{ color: colors.coral, fontWeight: '700', fontSize: 13 }}>Mark all read</Text>
          </AnimatedPressable>
          {notifications.map((n) => (
            <View
              key={n.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: n.read ? colors.border : colors.coral,
                },
              ]}
            >
              <Ionicons name="notifications" size={20} color={colors.coral} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>{n.title}</Text>
                <Text style={[styles.body, { color: colors.textSecondary }]}>{n.body}</Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>{n.createdAt}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 10 },
  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1 },
  title: { fontSize: 14.5, fontWeight: '800' },
  body: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, marginTop: 4 },
});
