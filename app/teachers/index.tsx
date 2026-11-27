import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useAITeachers } from '@/store/useAITeachers';

export default function MyAITeachersScreen() {
  const { colors } = useTheme();
  const { teachers } = useAITeachers();
  const router = useRouter();

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="My AI Teachers" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.introCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              Build Personal Subject Teachers
            </Text>
            <Text style={[styles.introSub, { color: colors.textSecondary }]}>
              Create custom AI teachers for your exact class, upload your own lecture notes or syllabus, and study with a dedicated teacher dashboard.
            </Text>
            <AnimatedPressable
              onPress={() => router.push('/teachers/create' as never)}
              style={[styles.createBtn, { backgroundColor: colors.coral }]}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.createBtnText}>Create New AI Teacher</Text>
            </AnimatedPressable>
          </View>

          <View style={{ gap: 12 }}>
            {teachers.map((t) => {
              const doneSteps = t.roadmapSteps.filter((s) => s.done).length;
              return (
                <AnimatedPressable
                  key={t.id}
                  onPress={() => router.push(`/teachers/${t.id}` as never)}
                  style={[
                    styles.teacherCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.avatarBox, { backgroundColor: `${t.accentColor}20` }]}>
                    <Text style={{ fontSize: 28 }}>{t.avatarEmoji}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.teacherName, { color: colors.text }]} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <Text style={[styles.teacherSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {t.subjectName} · {t.educationLevel}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.badge, { backgroundColor: colors.surfacePurpleSoft }]}>
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.purple }}>
                          {t.teachingStyle}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
                        {t.documents.length} docs · {doneSteps}/{t.roadmapSteps.length} steps
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </AnimatedPressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  introCard: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 8 },
  introTitle: { fontSize: 19, fontWeight: '900' },
  introSub: { fontSize: 13.5, lineHeight: 19 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
    marginTop: 6,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherName: { fontSize: 16, fontWeight: '800' },
  teacherSub: { fontSize: 12.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});
