import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { TimetableSlot } from '@/types/models';

const DAYS: TimetableSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TimetableScreen() {
  const { colors } = useTheme();
  const { timetableSlots, addTimetableSlot, toggleTimetableSlot, deleteTimetableSlot, journeyPlan } =
    useApp();

  const [selectedDay, setSelectedDay] = useState<TimetableSlot['day'] | 'All'>('All');
  const [showForm, setShowForm] = useState(false);
  const [day, setDay] = useState<TimetableSlot['day']>('Mon');
  const [timeRange, setTimeRange] = useState('16:00 – 17:00');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [topic, setTopic] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const visibleSlots = useMemo(() => {
    if (selectedDay === 'All') return timetableSlots;
    return timetableSlots.filter((s) => s.day === selectedDay);
  }, [timetableSlots, selectedDay]);

  const completedCount = timetableSlots.filter((s) => s.completed).length;

  const handleAdd = () => {
    if (!subjectName.trim() || !topic.trim()) return;
    addTimetableSlot({
      day,
      timeRange: timeRange.trim() || '16:00 – 17:00',
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
        <BrandHeader showBack title="Study Timetable" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Exam Countdown & Summary Banner */}
          <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>
                {journeyPlan ? `${journeyPlan.examType} Exam Target` : 'Weekly Study Schedule'}
              </Text>
              <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                {journeyPlan
                  ? `Goal: ${journeyPlan.goalName} · Target Date: ${journeyPlan.examDate}`
                  : 'Plan recurring weekly sessions and check off completed blocks.'}
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

          {/* Add Slot Toggle */}
          <AnimatedPressable
            onPress={() => setShowForm((v) => !v)}
            style={[styles.addBtn, { backgroundColor: colors.coral }]}
          >
            <Ionicons name={showForm ? 'close' : 'add-circle-outline'} size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>
              {showForm ? 'Cancel' : 'Add Study Slot'}
            </Text>
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
                placeholder="Time (e.g. 16:00 – 17:00)"
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
                placeholder="Topic to study (e.g. Organic Chemistry)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />
              <AnimatedPressable
                onPress={() => setReminderEnabled((r) => !r)}
                style={styles.remRow}
              >
                <Ionicons
                  name={reminderEnabled ? 'notifications' : 'notifications-off-outline'}
                  size={18}
                  color={reminderEnabled ? colors.mintDark : colors.textMuted}
                />
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
                  Study reminder: {reminderEnabled ? 'On' : 'Off'}
                </Text>
              </AnimatedPressable>
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
          {visibleSlots.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={30} color={colors.textMuted} />
              <Text style={[styles.slotTitle, { color: colors.text }]}>No sessions scheduled</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5, textAlign: 'center' }}>
                Tap "Add Study Slot" above to plan your revision for this day.
              </Text>
            </View>
          ) : (
            visibleSlots.map((slot) => (
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
                    <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{slot.timeRange}</Text>
                    {slot.reminderEnabled && (
                      <Ionicons name="notifications-outline" size={13} color={colors.coral} />
                    )}
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
                    {slot.subjectName} — {slot.topic}
                  </Text>
                </View>
                <AnimatedPressable onPress={() => deleteTimetableSlot(slot.id)} style={{ padding: 6 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </AnimatedPressable>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 12 },
  banner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
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
  remRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  saveBtn: { paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  empty: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 6 },
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
  slotTitle: { fontSize: 14, fontWeight: '800' },
});
