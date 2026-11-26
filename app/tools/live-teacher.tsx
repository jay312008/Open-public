import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { generateLiveLessonSteps, isLiveAIGatewayConfigured } from '@/lib/aiGateway';
import { LiveBoardElement, LiveLessonStep } from '@/types/models';

export default function LiveTeacherScreen() {
  const { colors } = useTheme();
  const { profile, saveConversation } = useApp();

  const [topic, setTopic] = useState('Quadratic Equations');
  const [steps, setSteps] = useState<LiveLessonStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedElement, setSelectedElement] = useState<LiveBoardElement | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const speakStep = (stepList: LiveLessonStep[], idx: number) => {
    if (idx >= stepList.length) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }
    const step = stepList[idx];
    setCurrentStepIdx(idx);
    setTranscript((prev) => [...prev, step.speechText]);
    Speech.stop();
    Speech.speak(step.speechText, {
      rate: 0.98,
      onDone: () => {
        timerRef.current = setTimeout(() => {
          speakStep(stepList, idx + 1);
        }, 650);
      },
      onError: () => {
        timerRef.current = setTimeout(() => {
          speakStep(stepList, idx + 1);
        }, step.durationMs);
      },
    });
  };

  const handleStartLesson = async () => {
    Speech.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelectedElement(null);
    setTranscript([]);
    const res = await generateLiveLessonSteps(topic.trim() || 'Quadratic Equations');
    setSteps(res.data);
    setIsPlaying(true);
    setIsPaused(false);
    speakStep(res.data, 0);
  };

  const handlePauseOrInterrupt = () => {
    Speech.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    if (steps.length === 0) return;
    setIsPlaying(true);
    setIsPaused(false);
    const nextIdx = Math.min(Math.max(0, currentStepIdx + 1), steps.length - 1);
    speakStep(steps, nextIdx);
  };

  const handleTapBoardElement = (el: LiveBoardElement) => {
    // Pause active narration when student interrupts by tapping a board element
    handlePauseOrInterrupt();
    setSelectedElement(el);
    Speech.speak(el.explanation, { rate: 0.98 });
  };

  const handleSaveSession = () => {
    if (steps.length === 0) return;
    saveConversation({
      id: `live-${Date.now()}`,
      title: `Live Teacher: ${topic}`,
      tool: 'live-teacher',
      subject: topic,
      updatedAt: new Date().toLocaleDateString(),
      messages: transcript.map((t, i) => ({
        id: `m-${i}`,
        role: 'assistant',
        text: t,
        createdAt: `Step ${i + 1}`,
      })),
    });
    Alert.alert('Session Saved', 'You can review this teaching session in Saved Resources.');
  };

  const visibleSteps = currentStepIdx >= 0 ? steps.slice(0, currentStepIdx + 1) : [];

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Molly Live Teacher" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Honest Provider Mode Indicator */}
          <View style={[styles.modePill, { backgroundColor: colors.surfaceBlueSoft }]}>
            <Ionicons name="radio" size={14} color={colors.blue} />
            <Text style={[styles.modeText, { color: colors.blue }]}>
              {isLiveAIGatewayConfigured
                ? 'Live AI Voice Gateway Connected'
                : 'Interactive Prototype · Device Speech Engine (Replaceable AI Provider)'}
            </Text>
          </View>

          {/* Teacher Stage */}
          <View
            style={[
              styles.stageCard,
              { backgroundColor: colors.surfaceMint, borderColor: colors.border },
            ]}
          >
            <CompanionAvatar companionId={profile.companionId} size={86} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.stageTitle, { color: colors.text }]}>
                Interactive Voice & Board
              </Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="Enter a topic (e.g., Chemical Bonding)"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.topicInput,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <AnimatedPressable
              onPress={handleStartLesson}
              style={[styles.primaryBtn, { backgroundColor: colors.coral, flex: 1 }]}
            >
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>
                {steps.length > 0 ? 'Restart Lesson' : 'Start Live Lesson'}
              </Text>
            </AnimatedPressable>

            {isPlaying ? (
              <AnimatedPressable
                onPress={handlePauseOrInterrupt}
                style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="pause" size={18} color={colors.coral} />
                <Text style={[styles.secondaryText, { color: colors.text }]}>Interrupt</Text>
              </AnimatedPressable>
            ) : isPaused ? (
              <AnimatedPressable
                onPress={handleResume}
                style={[styles.secondaryBtn, { backgroundColor: colors.surfaceMint, borderColor: colors.mint }]}
              >
                <Ionicons name="play-forward" size={18} color={colors.mintDark} />
                <Text style={[styles.secondaryText, { color: colors.mintDark }]}>Resume</Text>
              </AnimatedPressable>
            ) : null}

            {steps.length > 0 && (
              <AnimatedPressable
                onPress={handleSaveSession}
                style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                accessibilityLabel="Save teaching session"
              >
                <Ionicons name="bookmark-outline" size={20} color={colors.text} />
              </AnimatedPressable>
            )}
          </View>

          {/* Interactive Teaching Board */}
          <View
            style={[
              styles.board,
              { backgroundColor: '#16241E', borderColor: '#2E473B' },
            ]}
          >
            <View style={styles.boardHeader}>
              <Text style={styles.boardLabel}>INTERACTIVE TEACHING BOARD</Text>
              <Text style={styles.boardHint}>Tap any element to re-explain</Text>
            </View>

            {visibleSteps.length === 0 ? (
              <View style={styles.boardEmpty}>
                <Ionicons name="easel-outline" size={34} color="#86E88A" />
                <Text style={styles.boardEmptyText}>
                  Tap “Start Live Lesson” to watch Molly write equations and explain step by step.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {visibleSteps.map((s) => {
                  const active = selectedElement?.id === s.boardElement.id;
                  return (
                    <AnimatedPressable
                      key={s.id}
                      onPress={() => handleTapBoardElement(s.boardElement)}
                      style={[
                        styles.boardItem,
                        active && { borderColor: '#FF7557', backgroundColor: '#22382E' },
                      ]}
                    >
                      <Text style={styles.boardItemLabel}>{s.boardElement.label}</Text>
                      <Text style={styles.boardItemContent}>{s.boardElement.content}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Selected Element Re-Explanation Box */}
          {selectedElement && (
            <View
              style={[
                styles.explainBox,
                { backgroundColor: colors.surface, borderColor: colors.coral },
              ]}
            >
              <Text style={[styles.explainTitle, { color: colors.coral }]}>
                Re-explaining: {selectedElement.label}
              </Text>
              <Text style={[styles.explainText, { color: colors.text }]}>
                {selectedElement.explanation}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  modeText: { fontSize: 11.5, fontWeight: '700', flex: 1 },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  stageTitle: { fontSize: 16, fontWeight: '800' },
  topicInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  controlsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryText: { fontSize: 13, fontWeight: '800' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    borderRadius: 22,
    borderWidth: 2,
    padding: 16,
    minHeight: 240,
    gap: 12,
  },
  boardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boardLabel: { color: '#86E88A', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  boardHint: { color: '#A3B8AD', fontSize: 11 },
  boardEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 44, gap: 10 },
  boardEmptyText: { color: '#C5D4CC', textAlign: 'center', fontSize: 13, lineHeight: 19 },
  boardItem: {
    backgroundColor: '#1E3028',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2E473B',
    padding: 12,
    gap: 4,
  },
  boardItemLabel: { color: '#86E88A', fontSize: 11, fontWeight: '700' },
  boardItemContent: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  explainBox: { borderRadius: 18, borderWidth: 1.5, padding: 14, gap: 6 },
  explainTitle: { fontSize: 13, fontWeight: '800' },
  explainText: { fontSize: 13.5, lineHeight: 20 },
});
