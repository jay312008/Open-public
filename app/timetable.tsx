import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { TimetableSlot } from '@/types/models';
import { generateAITimetableAPI } from '@/lib/aiGateway';

const DAYS: TimetableSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TimetableScreen() {
  const { colors } = useTheme();
  const {
    profile,
    subjects,
    learningMemory,
    activityLog,
    timetableSlots,
    addTimetableSlot,
    replaceTimetableSlots,
    toggleTimetableSlot,
    deleteTimetableSlot,
    journeyPlan,
  } = useApp();

  // AI Smart Timetable Generator state (exam date + multi-subject selection)
  const [examDate, setExamDate] = useState(journeyPlan?.examDate ?? '2026-12-01');
  const [selectedSubjectNames, setSelectedSubjectNames] = useState<string[]>(['Physics', 'Mathematics']);
  const [generatingAI, setGeneratingAI] = useState(false);

  const [selectedDay, setSelectedDay] = useState<TimetableSlot['day'] | 'All'>('All');
  const [showForm, setShowForm] = useState(false);
  const [day, setDay] = useState<TimetableSlot['day']>('Mon');
  const [timeRange, setTimeRange] = useState('90 min');
  const [subjectName, setSubjectName] = useState('Physics');
  const [topic, setTopic] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const uniqueSubjectNames = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const s of subjects) {
      if (!seen.has(s.name)) {
        seen.add(s.name);
        list.push(s.name);
      }
    }
    return list.slice(0, 18);
  }, [subjects]);

  const toggleSubjectPick = (name: string) => {
    setSelectedSubjectNames((prev) =>
      prev.includes(name) ? (prev.length > 1 ? prev.filter((x) => x !== name) : prev) : [...prev, name]
    );
  };

  const handleGenerateAITimetable = async () => {
    if (generatingAI || selectedSubjectNames.length === 0) return;
    setGeneratingAI(true);
    try {
      const res = await generateAITimetableAPI({
        examDate: examDate.trim() || '2026-12-01',
        subjects: selectedSubjectNames,
        educationLevel: profile.educationLevel,
        weakTopics: learningMemory.weakTopics,
        recentActivity: activityLog,
      });
      const built: TimetableSlot[] = res.data.map((slot, idx) => ({
        id: `ai-tt-${Date.now()}-${idx}`,
        day: DAYS.includes(slot.day) ? slot.day : DAYS[idx % DAYS.length],
        timeRange: slot.timeRange || '90 min',
        subjectName: slot.subjectName || selectedSubjectNames[0],
        topic: slot.topic,
        reminderEnabled: true,
        completed: false,
      }));
      replaceTimetableSlots(built);
      Alert.alert(
        'AI Study Timetable Ready!',
        `Generated ${built.length} personalized sessions targeting your ${profile.educationLevel} syllabus & weak points up to ${examDate}.`
      );
    } finally {
      setGeneratingAI(false);
    }
  };

  const visibleSlots = useMemo(() => {
    if (selectedDay === 'All') return timetableSlots;
    return timetableSlots.filter((s) => s.day === selectedDay);
  }, [timetableSlots, selectedDay]);

  const completedCount = timetableSlots.filter((s) => s.completed).length;

  const handleAdd = () => {
    if (!subjectName.trim() || !topic.trim()) return;
    addTimetableSlot({
      day,
      timeRange: timeRange.trim() || '90 min',
      subjectName: subjectName.trim(),
      topic: topic.trim(),
      reminderEnabled,
    });
    setTopic('');
    setShowForm(false);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="AI Study Timetable" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* AI Smart Timetable Generator Card */}
          <View style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: colors.purple }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="sparkles" size={20} color={colors.purple} />
              <Text style={[styles.bannerTitle, { color: colors.text }]}>AI Exam Timetable Generator</Text>
            </View>
            <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
              Molly uses your {profile.educationLevel} level, {learningMemory.weakTopics.length} weak topics, and{' '}
              {activityLog.length} tracked study activities to build a custom daily plan.
            </Text>

            <View style={{ gap: 6 }}>
              <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Exam Date</Text>
              <TextInput
                value={examDate}
                onChangeText={setExamDate}
                placeholder="e.g. 2026-12-01"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>
                Select Subjects ({selectedSubjectNames.length} chosen)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {uniqueSubjectNames.map((name) => {
                  const picked = selectedSubjectNames.includes(name);
                  return (
                    <AnimatedPressable
                      key={name}
                      onPress={() => toggleSubjectPick(name)}
                      style={[
                        styles.subChip,
                        {
                          backgroundColor: picked ? colors.purple : colors.surfaceMuted,
                        },
                      ]}
                    >
                      <Text style={{ color: picked ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '700' }}>
                        {name}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </ScrollView>
            </View>

            <AnimatedPressable
              onPress={handleGenerateAITimetable}
              style={[styles.addBtn, { backgroundColor: colors.purple }]}
            >
              {generatingAI ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>Generate AI Timetable</Text>
                </>
              )}
            </AnimatedPressable>
          </View>

          {/* Progress Summary */}
          <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>Today's Study Focus</Text>
              <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                Target Date: {examDate} · {timetableSlots.length} planned sessions
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.surfaceMint }]}>
              <Text style={[styles.countNum, { color: colors.mintDark }]}>
                {completedCount}/{timetableSlots.length}
              </Text>
              <Text style={[styles.countLabel, { color: colors.mintDark }]}>Done</Text>
            </View>
          </View>

          {/* Day filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
            {(['All', ...DAYS] as const).map((d) => {
              const active = selectedDay === d;
              return (
                <AnimatedPressable
                  key={d}
                  onPress={() => setSelectedDay(d)}
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: active ? colors.mintDark : colors.surface,
                      borderColor: active ? colors.mintDark : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12.5 }}>
                    {d}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          {/* Manual Add Slot Toggle */}
          <AnimatedPressable
            onPress={() => setShowForm((v) => !v)}
            style={[styles.addBtn, { backgroundColor: colors.coral }]}
          >
            <Ionicons name={showForm ? 'close' : 'add-circle-outline'} size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>{showForm ? 'Cancel' : 'Add Manual Slot'}</Text>
          </AnimatedPressable>

          {showForm && (
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>New Study Session</Text>
              <View style={styles.miniDayRow}>
                {DAYS.map((d) => (
                  <AnimatedPressable
                    key={d}
                    onPress={() => setDay(d)}
                    style={[
                      styles.miniDay,
                      {
                        backgroundColor: day === d ? colors.coral : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={{ color: day === d ? '#FFFFFF' : colors.text, fontWeight: '700', fontSize: 11.5 }}>
                      {d}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
              <TextInput
                value={timeRange}
                onChangeText={setTimeRange}
                placeholder="Duration or time (e.g. 90 min)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />
              <TextInput
                value={subjectName}
                onChangeText={setSubjectName}
                placeholder="Subject (e.g. Physics, Biology)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="Topic to study (e.g. Thermodynamics & Heat Transfer)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />
              <AnimatedPressable
                onPress={handleAdd}
                style={[
                  styles.saveBtn,
                  { backgroundColor: subjectName.trim() && topic.trim() ? colors.mintDark : colors.surfaceMuted },
                ]}
              >
                <Text
                  style={{
                    color: subjectName.trim() && topic.trim() ? '#FFFFFF' : colors.textMuted,
                    fontWeight: '800',
                    fontSize: 14,
                  }}
                >
                  Save to Timetable
                </Text>
              </AnimatedPressable>
            </View>
          )}

          {/* Slots List */}
          {visibleSlots.map((slot) => (
            <View
              key={slot.id}
              style={[
                styles.slotCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: slot.completed ? colors.mintDark : colors.border,
                },
              ]}
            >
              <AnimatedPressable onPress={() => toggleTimetableSlot(slot.id)} style={styles.checkBtn}>
                <Ionicons
                  name={slot.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={slot.completed ? colors.mintDark : colors.textMuted}
                />
              </AnimatedPressable>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.slotMeta}>
                  <View style={[styles.dayTag, { backgroundColor: colors.surfaceMint }]}>
                    <Text style={{ color: colors.mintDark, fontWeight: '800', fontSize: 11 }}>{slot.day}</Text>
                  </View>
                  <Text style={{ color: colors.purple, fontSize: 12, fontWeight: '800' }}>{slot.subjectName}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '700', marginLeft: 'auto' }}>
                    {slot.timeRange}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.slotTitle,
                    {
                      color: colors.text,
                      textDecorationLine: slot.completed ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {slot.topic}
                </Text>
              </View>
              <AnimatedPressable onPress={() => deleteTimetableSlot(slot.id)} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </AnimatedPressable>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 12 },
  aiCard: { borderRadius: 22, borderWidth: 1.5, padding: 16, gap: 10 },
  subChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  banner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerTitle: { fontSize: 16, fontWeight: '900' },
  bannerSub: { fontSize: 12.5, lineHeight: 18 },
  countBadge: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  countNum: { fontSize: 17, fontWeight: '900' },
  countLabel: { fontSize: 11, fontWeight: '700' },
  dayRow: { gap: 8, paddingVertical: 2 },
  dayPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14.5 },
  formCard: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 10 },
  formTitle: { fontSize: 15, fontWeight: '800' },
  miniDayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniDay: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  saveBtn: { paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  slotCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBtn: { padding: 2 },
  slotMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  slotTitle: { fontSize: 13.5, fontWeight: '700', marginTop: 2 },
});
