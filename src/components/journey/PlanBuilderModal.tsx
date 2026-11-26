import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExamType, JourneyPlan, KnowledgeLevel, LearningPace } from '@/types/models';
import { CreatePlanInput, useApp } from '@/store/AppContext';
import { useTheme } from '@/theme/ThemeContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';

interface PlanBuilderModalProps {
  visible: boolean;
  existingPlan: JourneyPlan | null;
  onClose: () => void;
  onCreated: () => void;
}

const EXAM_TYPES: ExamType[] = [
  'GCE O-Level',
  'GCE A-Level',
  'University Exam',
  'Class Exam',
  'Custom Exam',
  'Personal Learning Goal',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PACES: LearningPace[] = ['Relaxed', 'Balanced', 'Intensive'];
const LEVELS: KnowledgeLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

export function PlanBuilderModal({
  visible,
  existingPlan,
  onClose,
  onCreated,
}: PlanBuilderModalProps) {
  const { colors } = useTheme();
  const { subjects, generateJourneyPlan } = useApp();

  const [goalName, setGoalName] = useState(existingPlan?.goalName ?? 'Final Exam Prep');
  const [examType, setExamType] = useState<ExamType>(existingPlan?.examType ?? 'Class Exam');
  const [examDate, setExamDate] = useState(existingPlan?.examDate ?? '2026-12-20');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    existingPlan?.selectedSubjectIds ?? ['math', 'chem']
  );
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    existingPlan?.selectedTopicIds ?? []
  );
  const [knowledgeLevel, setKnowledgeLevel] = useState<KnowledgeLevel>(
    existingPlan?.knowledgeLevel ?? 'Intermediate'
  );
  const [availableDays, setAvailableDays] = useState<string[]>(
    existingPlan?.availableDays ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState(
    String(existingPlan?.dailyStudyMinutes ?? 45)
  );
  const [difficultAreas, setDifficultAreas] = useState(existingPlan?.difficultAreas ?? '');
  const [pace, setPace] = useState<LearningPace>(existingPlan?.pace ?? 'Balanced');

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleDay = (d: string) => {
    setAvailableDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const candidateTopics = subjects
    .filter((s) => selectedSubjectIds.includes(s.id))
    .flatMap((s) => s.topics.map((t) => ({ ...t, subjectName: s.name })));

  const handleGenerate = () => {
    if (!goalName.trim() || selectedSubjectIds.length === 0) return;
    const input: CreatePlanInput = {
      goalName: goalName.trim(),
      examType,
      examDate: examDate.trim() || '2026-12-20',
      selectedSubjectIds,
      selectedTopicIds,
      knowledgeLevel,
      availableDays: availableDays.length > 0 ? availableDays : ['Mon', 'Wed', 'Fri'],
      dailyStudyMinutes: Math.max(15, Number(dailyStudyMinutes) || 45),
      difficultAreas: difficultAreas.trim(),
      pace,
    };
    generateJourneyPlan(input);
    onCreated();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {existingPlan ? 'Edit Study Plan' : 'Generate Your Journey'}
          </Text>
          <AnimatedPressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </AnimatedPressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.label, { color: colors.text }]}>Examination or Learning Goal</Text>
          <TextInput
            value={goalName}
            onChangeText={setGoalName}
            placeholder="e.g., Term 2 Science Exam"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.text }]}>Exam Type</Text>
          <View style={styles.chipWrap}>
            {EXAM_TYPES.map((type) => {
              const active = examType === type;
              return (
                <AnimatedPressable
                  key={type}
                  onPress={() => setExamType(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.coral : colors.surface,
                      borderColor: active ? colors.coral : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 12.5, fontWeight: '700' }}>
                    {type}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Target Exam Date (YYYY-MM-DD)</Text>
          <TextInput
            value={examDate}
            onChangeText={setExamDate}
            placeholder="2026-12-20"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.text }]}>Select Subjects</Text>
          <View style={styles.chipWrap}>
            {subjects.map((sub) => {
              const active = selectedSubjectIds.includes(sub.id);
              return (
                <AnimatedPressable
                  key={sub.id}
                  onPress={() => toggleSubject(sub.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.mint : colors.surface,
                      borderColor: active ? colors.mint : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 12.5, fontWeight: '700' }}>
                    {sub.name}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {candidateTopics.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                Specific Topics (Optional — leave empty to include all)
              </Text>
              <View style={styles.chipWrap}>
                {candidateTopics.map((topic) => {
                  const active = selectedTopicIds.includes(topic.id);
                  return (
                    <AnimatedPressable
                      key={topic.id}
                      onPress={() => toggleTopic(topic.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.purple : colors.surface,
                          borderColor: active ? colors.purple : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '600' }}>
                        {topic.title}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Available Study Days</Text>
          <View style={styles.chipWrap}>
            {DAYS.map((d) => {
              const active = availableDays.includes(d);
              return (
                <AnimatedPressable
                  key={d}
                  onPress={() => toggleDay(d)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: active ? colors.coral : colors.surface,
                      borderColor: active ? colors.coral : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '700' }}>
                    {d}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Daily Study Time (minutes)</Text>
          <TextInput
            value={dailyStudyMinutes}
            onChangeText={setDailyStudyMinutes}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[styles.label, { color: colors.text }]}>Current Knowledge Level</Text>
          <View style={styles.chipWrap}>
            {LEVELS.map((lvl) => {
              const active = knowledgeLevel === lvl;
              return (
                <AnimatedPressable
                  key={lvl}
                  onPress={() => setKnowledgeLevel(lvl)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.blue : colors.surface,
                      borderColor: active ? colors.blue : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 12.5, fontWeight: '700' }}>
                    {lvl}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Preferred Pace</Text>
          <View style={styles.chipWrap}>
            {PACES.map((p) => {
              const active = pace === p;
              return (
                <AnimatedPressable
                  key={p}
                  onPress={() => setPace(p)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.mintDark : colors.surface,
                      borderColor: active ? colors.mintDark : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 12.5, fontWeight: '700' }}>
                    {p}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Areas of Difficulty (Optional)</Text>
          <TextInput
            value={difficultAreas}
            onChangeText={setDifficultAreas}
            placeholder="e.g., Word problems, Organic reactions"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          />

          <AnimatedPressable
            onPress={handleGenerate}
            style={[styles.submitBtn, { backgroundColor: colors.coral }]}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.submitText}>
              {existingPlan ? 'Save & Rebalance Journey' : 'Build My Learning Journey'}
            </Text>
          </AnimatedPressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 4 },
  scroll: { padding: 18, paddingBottom: 48, gap: 10 },
  label: { fontSize: 13.5, fontWeight: '700', marginTop: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayChip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 999,
    marginTop: 18,
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
