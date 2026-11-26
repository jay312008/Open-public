import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function NotificationPrefsScreen() {
  const { colors } = useTheme();
  const { notificationPrefs, updateNotificationPrefs } = useApp();

  const items: {
    key: keyof typeof notificationPrefs;
    title: string;
    sub: string;
  }[] = [
    { key: 'studyReminders', title: 'Study Reminders', sub: 'Daily study and task alerts' },
    { key: 'examAlerts', title: 'Exam Alerts', sub: 'Exam dates and countdowns' },
    { key: 'achievements', title: 'Achievements', sub: 'Badges, levels and XP updates' },
    { key: 'communityUpdates', title: 'Community Updates', sub: 'Replies, likes and group activity' },
    { key: 'appUpdates', title: 'App Updates', sub: 'New features and important news' },
  ];

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Notifications" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {items.map((item, idx) => (
              <View
                key={item.key}
                style={[
                  styles.row,
                  idx > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSubtle },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.sub, { color: colors.textSecondary }]}>{item.sub}</Text>
                </View>
                <Switch
                  value={notificationPrefs[item.key]}
                  onValueChange={(val) => updateNotificationPrefs({ [item.key]: val })}
                  trackColor={{ false: colors.surfaceMuted, true: colors.mint }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },
  card: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
});
