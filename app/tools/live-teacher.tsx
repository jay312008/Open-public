import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Svg, { Path } from 'react-native-svg';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { askMollyAI, generateLiveLessonSteps, isLiveAIGatewayConfigured } from '@/lib/aiGateway';
import { ChatVisualWidget, ChatWidgetSpec } from '@/components/chat/ChatVisualWidget';
import { LiveBoardElement, LiveLessonStep } from '@/types/models';

type BoardSurfaceId = 'white' | 'dark' | 'blue' | 'cream' | 'mint';
type DrawTool = 'pen' | 'highlighter' | 'eraser';
type SemanticRole = 'question' | 'explanation' | 'formula' | 'example' | 'tip' | 'solution';

interface CanvasStroke {
  id: string;
  d: string;
  color: string;
  width: number;
  opacity: number;
  author: 'student' | 'molly';
}

interface SemanticBoardCard {
  id: string;
  role: SemanticRole;
  label: string;
  content: string;
  explanation: string;
  widgets?: ChatWidgetSpec[];
}

const BOARD_SURFACES: {
  id: BoardSurfaceId;
  label: string;
  swatch: string;
  bg: string;
  border: string;
  grid: string;
  isDarkSurface: boolean;
}[] = [
  { id: 'white', label: 'White', swatch: '#FFFFFF', bg: '#FFFFFF', border: '#E2E8F0', grid: '#F1F5F9', isDarkSurface: false },
  { id: 'dark', label: 'Dark', swatch: '#16241E', bg: '#16241E', border: '#2E473B', grid: '#1F332B', isDarkSurface: true },
  { id: 'blue', label: 'Blue', swatch: '#132743', bg: '#132743', border: '#264975', grid: '#1B365C', isDarkSurface: true },
  { id: 'cream', label: 'Cream', swatch: '#FFF8EA', bg: '#FFF8EA', border: '#E8D7B9', grid: '#F5EAD4', isDarkSurface: false },
  { id: 'mint', label: 'Mint', swatch: '#EEFBF3', bg: '#EEFBF3', border: '#C7EBD5', grid: '#DCF5E6', isDarkSurface: false },
];

const PEN_COLORS = [
  { id: 'auto', label: 'Ink', light: '#1E2430', dark: '#F8FAFC' },
  { id: 'coral', label: 'Coral', light: '#EF4444', dark: '#FF7B6B' },
  { id: 'blue', label: 'Blue', light: '#2563EB', dark: '#60A5FA' },
  { id: 'green', label: 'Mint', light: '#16A34A', dark: '#4ADE80' },
  { id: 'purple', label: 'Purple', light: '#7C3AED', dark: '#C084FC' },
  { id: 'gold', label: 'Amber', light: '#D97706', dark: '#FBBF24' },
];

function mapElementTypeToRole(el: LiveBoardElement): SemanticRole {
  const lbl = el.label.toLowerCase();
  if (lbl.includes('question') || lbl.includes('check')) return 'question';
  if (el.type === 'equation' || lbl.includes('formula') || lbl.includes('form')) return 'formula';
  if (lbl.includes('example') || el.type === 'step') return 'example';
  if (lbl.includes('tip') || el.type === 'note') return 'tip';
  if (lbl.includes('root') || lbl.includes('answer') || lbl.includes('solution')) return 'solution';
  return 'explanation';
}

function getSemanticStyle(role: SemanticRole, isDarkSurface: boolean) {
  const map: Record<
    SemanticRole,
    { tag: string; colorLight: string; colorDark: string; bgLight: string; bgDark: string; icon: keyof typeof Ionicons.glyphMap }
  > = {
    question: { tag: 'QUESTION', colorLight: '#2563EB', colorDark: '#60A5FA', bgLight: '#EFF6FF', bgDark: 'rgba(59,130,246,0.16)', icon: 'help-circle' },
    explanation: { tag: 'EXPLANATION', colorLight: '#1E293B', colorDark: '#E2E8F0', bgLight: '#F8FAFC', bgDark: 'rgba(255,255,255,0.08)', icon: 'book-outline' },
    formula: { tag: 'FORMULA', colorLight: '#7C3AED', colorDark: '#C4B5FD', bgLight: '#F5F3FF', bgDark: 'rgba(139,92,246,0.2)', icon: 'calculator-outline' },
    example: { tag: 'EXAMPLE', colorLight: '#B45309', colorDark: '#FCD34D', bgLight: '#FFFBEB', bgDark: 'rgba(245,158,11,0.18)', icon: 'bulb-outline' },
    tip: { tag: 'PRO TIP', colorLight: '#15803D', colorDark: '#86EFAC', bgLight: '#F0FDF4', bgDark: 'rgba(34,197,94,0.18)', icon: 'sparkles-outline' },
    solution: { tag: 'SOLUTION', colorLight: '#E11D48', colorDark: '#FDA4AF', bgLight: '#FFF1F2', bgDark: 'rgba(244,63,94,0.2)', icon: 'checkmark-circle-outline' },
  };
  const cfg = map[role];
  return {
    tag: cfg.tag,
    icon: cfg.icon,
    accent: isDarkSurface ? cfg.colorDark : cfg.colorLight,
    cardBg: isDarkSurface ? cfg.bgDark : cfg.bgLight,
    textColor: isDarkSurface ? '#F8FAFC' : '#1E2430',
  };
}

export default function LiveTeacherScreen() {
  const { colors } = useTheme();
  const { profile, saveConversation } = useApp();

  const [topic, setTopic] = useState('Quadratic Equations');
  const [boardSurfaceId, setBoardSurfaceId] = useState<BoardSurfaceId>('white');
  const [writeMode, setWriteMode] = useState<'pen' | 'type'>('pen');
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');
  const [penColorId, setPenColorId] = useState<string>('blue');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [drawMode, setDrawMode] = useState<boolean>(true);
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasStroke[]>([]);
  const [activePath, setActivePath] = useState<string>('');
  const [typedBoardText, setTypedBoardText] = useState<string>('');
  const [typedBoardRole, setTypedBoardRole] = useState<SemanticRole>('formula');

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [steps, setSteps] = useState<LiveLessonStep[]>([]);
  const [boardCards, setBoardCards] = useState<SemanticBoardCard[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SemanticBoardCard | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);

  // Live conversation bar
  const [liveInput, setLiveInput] = useState('');
  const [answeringLive, setAnsweringLive] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPathRef = useRef<string>('');

  const surface = useMemo(
    () => BOARD_SURFACES.find((s) => s.id === boardSurfaceId) ?? BOARD_SURFACES[0],
    [boardSurfaceId]
  );

  const resolvedPenColor = useMemo(() => {
    const found = PEN_COLORS.find((c) => c.id === penColorId) ?? PEN_COLORS[0];
    return surface.isDarkSurface ? found.dark : found.light;
  }, [penColorId, surface.isDarkSurface]);

  // Keep latest drawing config in refs for PanResponder
  const drawCfgRef = useRef({
    drawMode,
    drawTool,
    resolvedPenColor,
    strokeWidth,
    surfaceBg: surface.bg,
  });
  drawCfgRef.current = {
    drawMode,
    drawTool,
    resolvedPenColor,
    strokeWidth,
    surfaceBg: surface.bg,
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => drawCfgRef.current.drawMode,
        onMoveShouldSetPanResponder: () => drawCfgRef.current.drawMode,
        onPanResponderGrant: (evt) => {
          if (!drawCfgRef.current.drawMode) return;
          const { locationX, locationY } = evt.nativeEvent;
          const start = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          currentPathRef.current = start;
          setActivePath(start);
        },
        onPanResponderMove: (evt) => {
          if (!drawCfgRef.current.drawMode) return;
          const { locationX, locationY } = evt.nativeEvent;
          const next = `${currentPathRef.current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          currentPathRef.current = next;
          setActivePath(next);
        },
        onPanResponderRelease: () => {
          if (!drawCfgRef.current.drawMode || !currentPathRef.current) return;
          const cfg = drawCfgRef.current;
          const isEraser = cfg.drawTool === 'eraser';
          const isHighlighter = cfg.drawTool === 'highlighter';
          const finished: CanvasStroke = {
            id: `stroke-${Date.now()}-${Math.random()}`,
            d: currentPathRef.current,
            color: isEraser ? cfg.surfaceBg : cfg.resolvedPenColor,
            width: isEraser ? 20 : isHighlighter ? 14 : cfg.strokeWidth,
            opacity: isHighlighter ? 0.34 : 1,
            author: 'student',
          };
          setStrokes((prev) => [...prev, finished]);
          currentPathRef.current = '';
          setActivePath('');
        },
      }),
    []
  );

  useEffect(() => {
    return () => {
      Speech.stop();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Keep the freehand board clean by default — dynamic graphs, rulers, and diagrams
  // are rendered from real AI widget specs instead of any hardcoded parabola!
  const addMollySketchForStep = (_stepIdx: number, _topicName: string) => {};

  const speakStep = (stepList: LiveLessonStep[], idx: number, topicName: string) => {
    if (idx >= stepList.length) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }
    const step = stepList[idx];
    setCurrentStepIdx(idx);
    setTranscript((prev) => [...prev, step.speechText]);
    const card: SemanticBoardCard = {
      id: step.boardElement.id,
      role: mapElementTypeToRole(step.boardElement),
      label: step.boardElement.label,
      content: step.boardElement.content,
      explanation: step.boardElement.explanation,
    };
    setBoardCards((prev) => {
      if (prev.some((c) => c.id === card.id)) return prev;
      return [...prev, card];
    });
    addMollySketchForStep(idx, topicName);

    Speech.stop();
    Speech.speak(step.speechText, {
      rate: 0.98,
      onDone: () => {
        timerRef.current = setTimeout(() => {
          speakStep(stepList, idx + 1, topicName);
        }, 700);
      },
      onError: () => {
        timerRef.current = setTimeout(() => {
          speakStep(stepList, idx + 1, topicName);
        }, step.durationMs);
      },
    });
  };

  const handleStartLesson = async () => {
    Speech.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelectedCard(null);
    setTranscript([]);
    setBoardCards([]);
    setStrokes((prev) => prev.filter((s) => s.author === 'student'));
    setLoadingPlan(true);
    const activeTopic = topic.trim() || 'Quadratic Equations';
    try {
      const res = await generateLiveLessonSteps(activeTopic);
      setSteps(res.data);
      setIsPlaying(true);
      setIsPaused(false);
      speakStep(res.data, 0, activeTopic);
    } finally {
      setLoadingPlan(false);
    }
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
    speakStep(steps, nextIdx, topic.trim() || 'Quadratic Equations');
  };

  const handleTapBoardCard = (card: SemanticBoardCard) => {
    handlePauseOrInterrupt();
    setSelectedCard(card);
    Speech.stop();
    Speech.speak(card.explanation, { rate: 0.98 });
  };

  // Live interruptible question to Molly while on the board
  const handleAskLiveQuestion = async (promptOverride?: string) => {
    const q = (promptOverride ?? liveInput).trim();
    if (!q || answeringLive) return;
    handlePauseOrInterrupt();
    setLiveInput('');
    setAnsweringLive(true);

    const qCard: SemanticBoardCard = {
      id: `q-${Date.now()}`,
      role: 'question',
      label: 'You Asked',
      content: q,
      explanation: `Student question: ${q}`,
    };
    setBoardCards((prev) => [...prev, qCard]);

    try {
      const res = await askMollyAI(q, topic);
      const formattedBody = [
        res.data.text,
        res.data.equation ? `Formula: ${res.data.equation}` : '',
        res.data.steps?.length
          ? res.data.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`).join('\n')
          : '',
        res.data.example ? `Example: ${res.data.example}` : '',
        res.data.tip ? `Tip: ${res.data.tip}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      const ansCard: SemanticBoardCard = {
        id: `ans-${Date.now()}`,
        role: res.data.equation ? 'formula' : 'solution',
        label: res.data.heading ?? (res.data.equation ? 'Molly · Formula & Answer' : 'Molly · Live Answer'),
        content: formattedBody,
        explanation: res.data.text,
        widgets: res.data.widgets,
      };
      setBoardCards((prev) => [...prev, ansCard]);
      setTranscript((prev) => [...prev, `You: ${q}`, `Molly: ${res.data.text}`]);
      Speech.stop();
      Speech.speak(res.data.text, { rate: 0.98 });
    } finally {
      setAnsweringLive(false);
    }
  };

  const handleVoiceMic = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SR =
        (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
          .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
      if (!SR) {
        Alert.alert(
          'Voice Input Unavailable',
          'Your browser does not support Web Speech Recognition. Type your question below to interrupt Molly live.'
        );
        return;
      }
      handlePauseOrInterrupt();
      const rec = new SR() as {
        lang: string;
        interimResults: boolean;
        onstart: () => void;
        onend: () => void;
        onerror: () => void;
        onresult: (ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
        start: () => void;
      };
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.onresult = (ev) => {
        const spoken = ev.results?.[0]?.[0]?.transcript;
        if (spoken) {
          handleAskLiveQuestion(spoken);
        }
      };
      rec.start();
      return;
    }
    Alert.alert(
      'Voice Input',
      'Type your question below to interrupt Molly live, or connect Google Gemini Live / OpenAI Realtime for native duplex voice.'
    );
  };

  const handleSaveSession = () => {
    if (boardCards.length === 0) return;
    saveConversation({
      id: `live-${Date.now()}`,
      title: `Live Board: ${topic}`,
      tool: 'live-teacher',
      subject: topic,
      updatedAt: new Date().toLocaleDateString(),
      messages: transcript.map((t, i) => ({
        id: `m-${i}`,
        role: t.startsWith('You:') ? 'user' : 'assistant',
        text: t,
        createdAt: `Step ${i + 1}`,
      })),
    });
    Alert.alert('Saved', 'Board lesson saved to Saved Resources.');
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BrandHeader showBack title="Molly Live Board" />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Honest AI Engine Status */}
          <View
            style={[
              styles.modePill,
              { backgroundColor: isLiveAIGatewayConfigured ? colors.surfaceMint : colors.surfaceBlueSoft },
            ]}
          >
            <Ionicons
              name="radio"
              size={14}
              color={isLiveAIGatewayConfigured ? colors.mintDark : colors.blue}
            />
            <Text
              style={[
                styles.modeText,
                { color: isLiveAIGatewayConfigured ? colors.mintDark : colors.blue },
              ]}
            >
              {isLiveAIGatewayConfigured
                ? 'Live NVIDIA AI Board · Tap Mic or Type to Interrupt Live'
                : 'Interactive Canvas & Speech Prototype (Connect Vercel / Gemini Live for real-time audio)'}
            </Text>
          </View>

          {/* Compact Topic + Companion Row */}
          <View style={[styles.topicRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CompanionAvatar companionId={profile.companionId} size={46} />
            <TextInput
              value={topic}
              onChangeText={setTopic}
              placeholder="Lesson topic (e.g. Quadratic Equations)"
              placeholderTextColor={colors.textMuted}
              style={[styles.topicInput, { color: colors.text }]}
            />
            <AnimatedPressable
              onPress={handleStartLesson}
              disabled={loadingPlan}
              style={[styles.startPill, { backgroundColor: colors.coral }]}
            >
              <Ionicons name="play" size={14} color="#FFFFFF" />
              <Text style={styles.startPillText}>{loadingPlan ? '...' : 'Teach'}</Text>
            </AnimatedPressable>
          </View>

          {/* 2 Writing Modes Switcher: Freehand Pen vs Typed Board Blocks */}
          <View style={[styles.toolbarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(
                [
                  { id: 'pen', label: 'Mode 1: Freehand Pen', icon: 'brush-outline' },
                  { id: 'type', label: 'Mode 2: Type on Board', icon: 'text-outline' },
                ] as const
              ).map((m) => {
                const active = writeMode === m.id;
                return (
                  <AnimatedPressable
                    key={m.id}
                    onPress={() => {
                      setWriteMode(m.id);
                      setDrawMode(m.id === 'pen');
                    }}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: active ? colors.coral : colors.surfaceMuted,
                    }}
                  >
                    <Ionicons name={m.icon} size={14} color={active ? '#FFFFFF' : colors.text} />
                    <Text style={{ fontSize: 11.5, fontWeight: '800', color: active ? '#FFFFFF' : colors.text }}>
                      {m.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <View style={styles.toolRow}>
              <Text style={[styles.toolSectionLbl, { color: colors.textSecondary }]}>Board:</Text>
              <View style={styles.swatchRow}>
                {BOARD_SURFACES.map((s) => {
                  const active = s.id === boardSurfaceId;
                  return (
                    <AnimatedPressable
                      key={s.id}
                      onPress={() => setBoardSurfaceId(s.id)}
                      style={[
                        styles.boardSwatch,
                        {
                          backgroundColor: s.swatch,
                          borderColor: active ? colors.coral : colors.border,
                          borderWidth: active ? 2.5 : 1,
                        },
                      ]}
                      accessibilityLabel={`${s.label} board`}
                    >
                      <View />
                    </AnimatedPressable>
                  );
                })}
              </View>

              {writeMode === 'pen' && (
                <AnimatedPressable
                  onPress={() => setDrawMode((v) => !v)}
                  style={[
                    styles.modeToggle,
                    {
                      backgroundColor: drawMode ? colors.brandGreen : colors.surfaceMuted,
                    },
                  ]}
                >
                  <Ionicons name={drawMode ? 'pencil' : 'hand-left-outline'} size={13} color={drawMode ? '#FFFFFF' : colors.text} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: drawMode ? '#FFFFFF' : colors.text }}>
                    {drawMode ? 'Draw' : 'Scroll'}
                  </Text>
                </AnimatedPressable>
              )}
            </View>

            {writeMode === 'pen' ? (
              <View style={styles.toolRow}>
                {(['pen', 'highlighter', 'eraser'] as DrawTool[]).map((t) => {
                  const active = drawTool === t;
                  const icon = t === 'pen' ? 'brush-outline' : t === 'highlighter' ? 'color-wand-outline' : 'backspace-outline';
                  return (
                    <AnimatedPressable
                      key={t}
                      onPress={() => {
                        setDrawTool(t);
                        setDrawMode(true);
                      }}
                      style={[
                        styles.toolIconBtn,
                        {
                          backgroundColor: active ? colors.surfaceCoralSoft : colors.surfaceMuted,
                          borderColor: active ? colors.coral : 'transparent',
                        },
                      ]}
                      accessibilityLabel={t}
                    >
                      <Ionicons name={icon} size={16} color={active ? colors.coral : colors.text} />
                    </AnimatedPressable>
                  );
                })}

                <View style={styles.swatchRow}>
                  {PEN_COLORS.map((c) => {
                    const swatchColor = surface.isDarkSurface ? c.dark : c.light;
                    const active = penColorId === c.id && drawTool !== 'eraser';
                    return (
                      <AnimatedPressable
                        key={c.id}
                        onPress={() => {
                          setPenColorId(c.id);
                          if (drawTool === 'eraser') setDrawTool('pen');
                          setDrawMode(true);
                        }}
                        style={[
                          styles.penSwatch,
                          {
                            backgroundColor: swatchColor,
                            borderColor: active ? colors.coral : 'transparent',
                            borderWidth: active ? 2.5 : 0,
                          },
                        ]}
                        accessibilityLabel={`${c.label} pen`}
                      >
                        <View />
                      </AnimatedPressable>
                    );
                  })}
                </View>

                <AnimatedPressable
                  onPress={() => setStrokeWidth((w) => (w === 3 ? 6 : w === 6 ? 1.8 : 3))}
                  style={[styles.toolIconBtn, { backgroundColor: colors.surfaceMuted }]}
                  accessibilityLabel="Stroke thickness"
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                    {strokeWidth < 2.5 ? 'S' : strokeWidth < 5 ? 'M' : 'L'}
                  </Text>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => {
                    setStrokes((prev) => {
                      if (prev.length === 0) return prev;
                      const last = prev[prev.length - 1];
                      setRedoStack((r) => [...r, last]);
                      return prev.slice(0, -1);
                    });
                  }}
                  style={[styles.toolIconBtn, { backgroundColor: colors.surfaceMuted }]}
                  accessibilityLabel="Undo stroke"
                >
                  <Ionicons name="arrow-undo" size={15} color={colors.text} />
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => {
                    setRedoStack((r) => {
                      if (r.length === 0) return r;
                      const restored = r[r.length - 1];
                      setStrokes((prev) => [...prev, restored]);
                      return r.slice(0, -1);
                    });
                  }}
                  style={[styles.toolIconBtn, { backgroundColor: colors.surfaceMuted }]}
                  accessibilityLabel="Redo stroke"
                >
                  <Ionicons name="arrow-redo" size={15} color={colors.text} />
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => {
                    setStrokes([]);
                    setRedoStack([]);
                  }}
                  style={[styles.toolIconBtn, { backgroundColor: colors.surfaceMuted }]}
                  accessibilityLabel="Clear drawings"
                >
                  <Ionicons name="trash-outline" size={15} color={colors.text} />
                </AnimatedPressable>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {(['formula', 'question', 'example', 'tip', 'solution'] as SemanticRole[]).map((r) => {
                    const active = typedBoardRole === r;
                    return (
                      <AnimatedPressable
                        key={r}
                        onPress={() => setTypedBoardRole(r)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 999,
                          backgroundColor: active ? colors.purple : colors.surfaceMuted,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#FFFFFF' : colors.text, textTransform: 'capitalize' }}>
                          {r}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    value={typedBoardText}
                    onChangeText={setTypedBoardText}
                    placeholder="Type an equation or note directly onto the board (e.g. 2x + 3 = 7)..."
                    placeholderTextColor={colors.textMuted}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 13.5,
                      color: colors.text,
                    }}
                  />
                  <AnimatedPressable
                    onPress={() => {
                      const clean = typedBoardText.trim();
                      if (!clean) return;
                      setBoardCards((prev) => [
                        ...prev,
                        {
                          id: `typed-${Date.now()}`,
                          role: typedBoardRole,
                          label: `Your ${typedBoardRole}`,
                          content: clean,
                          explanation: `You wrote on the board: ${clean}`,
                        },
                      ]);
                      setTypedBoardText('');
                    }}
                    style={[styles.startPill, { backgroundColor: colors.purple }]}
                  >
                    <Text style={styles.startPillText}>Add</Text>
                  </AnimatedPressable>
                </View>
              </View>
            )}
          </View>

          {/* REAL INTERACTIVE DRAWING CANVAS (Student + Molly Vector Strokes) */}
          <View
            style={[
              styles.canvasBox,
              { backgroundColor: surface.bg, borderColor: surface.border },
            ]}
          >
            <View style={styles.canvasHeaderRow}>
              <Text style={[styles.canvasBadge, { color: surface.isDarkSurface ? '#86EFAC' : '#16A34A' }]}>
                INTERACTIVE CANVAS · WRITE OR DRAW FREELY (E.G. 1 + 1 = 2)
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {isPlaying ? (
                  <AnimatedPressable onPress={handlePauseOrInterrupt} style={styles.miniControl}>
                    <Ionicons name="pause" size={13} color="#FFFFFF" />
                    <Text style={styles.miniControlText}>Pause</Text>
                  </AnimatedPressable>
                ) : isPaused ? (
                  <AnimatedPressable
                    onPress={handleResume}
                    style={[styles.miniControl, { backgroundColor: '#16A34A' }]}
                  >
                    <Ionicons name="play" size={13} color="#FFFFFF" />
                    <Text style={styles.miniControlText}>Resume</Text>
                  </AnimatedPressable>
                ) : null}
                {boardCards.length > 0 && (
                  <AnimatedPressable
                    onPress={handleSaveSession}
                    style={[styles.miniControl, { backgroundColor: '#6366F1' }]}
                  >
                    <Ionicons name="bookmark" size={12} color="#FFFFFF" />
                  </AnimatedPressable>
                )}
              </View>
            </View>

            {/* Freehand Touch/Mouse SVG Drawing Surface */}
            <View
              {...panResponder.panHandlers}
              style={[styles.drawingPad, { borderColor: surface.grid }]}
            >
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                {strokes.map((s) => (
                  <Path
                    key={s.id}
                    d={s.d}
                    stroke={s.color}
                    strokeWidth={s.width}
                    strokeOpacity={s.opacity}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {activePath ? (
                  <Path
                    d={activePath}
                    stroke={drawTool === 'eraser' ? surface.bg : resolvedPenColor}
                    strokeWidth={drawTool === 'eraser' ? 20 : drawTool === 'highlighter' ? 14 : strokeWidth}
                    strokeOpacity={drawTool === 'highlighter' ? 0.34 : 1}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
              </Svg>
              {strokes.length === 0 && !activePath && (
                <Text
                  pointerEvents="none"
                  style={[
                    styles.canvasPlaceholder,
                    { color: surface.isDarkSurface ? 'rgba(255,255,255,0.35)' : 'rgba(30,41,59,0.32)' },
                  ]}
                >
                  Draw equations, diagrams, or notes here with your finger or mouse
                </Text>
              )}
            </View>

            {/* Multi-Color Semantic AI Teaching Notes on the Board */}
            <View style={styles.semanticList}>
              {boardCards.length === 0 ? (
                <Text
                  style={[
                    styles.emptyNotes,
                    { color: surface.isDarkSurface ? 'rgba(255,255,255,0.55)' : '#64748B' },
                  ]}
                >
                  Tap “Teach” above or ask Molly below — her explanations, formulas, tips, examples & solutions appear here in color-coded blocks.
                </Text>
              ) : (
                boardCards.map((card) => {
                  const sem = getSemanticStyle(card.role, surface.isDarkSurface);
                  const active = selectedCard?.id === card.id;
                  return (
                    <AnimatedPressable
                      key={card.id}
                      onPress={() => handleTapBoardCard(card)}
                      style={[
                        styles.semanticCard,
                        {
                          backgroundColor: sem.cardBg,
                          borderLeftColor: sem.accent,
                          borderColor: active ? colors.coral : 'transparent',
                        },
                      ]}
                    >
                      <View style={styles.semanticTopRow}>
                        <Ionicons name={sem.icon} size={14} color={sem.accent} />
                        <Text style={[styles.semanticTag, { color: sem.accent }]}>
                          {sem.tag} · {card.label}
                        </Text>
                      </View>
                      <Text style={[styles.semanticContent, { color: sem.textColor }]}>
                        {card.content}
                      </Text>
                      {card.widgets && card.widgets.length > 0 && (
                        <View style={{ marginTop: 10, gap: 8 }}>
                          {card.widgets.map((w, wIdx) => (
                            <ChatVisualWidget key={`${card.id}-w-${wIdx}`} widget={w} />
                          ))}
                        </View>
                      )}
                    </AnimatedPressable>
                  );
                })
              )}
            </View>
          </View>

          {selectedCard && (
            <View style={[styles.reexplainBox, { backgroundColor: colors.surface, borderColor: colors.coral }]}>
              <Text style={[styles.reexplainTitle, { color: colors.coral }]}>
                Molly re-explaining: {selectedCard.label}
              </Text>
              <Text style={[styles.reexplainText, { color: colors.text }]}>
                {selectedCard.explanation}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Persistent Live Interrupt & Talk Bar */}
        <View style={[styles.liveComposer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <AnimatedPressable
            onPress={handleVoiceMic}
            style={[
              styles.micBtn,
              { backgroundColor: isListening ? colors.coral : colors.surfaceMint },
            ]}
            accessibilityLabel="Speak to interrupt Molly"
          >
            <Ionicons
              name={isListening ? 'radio' : 'mic'}
              size={19}
              color={isListening ? '#FFFFFF' : colors.mintDark}
            />
          </AnimatedPressable>
          <TextInput
            value={liveInput}
            onChangeText={setLiveInput}
            placeholder={isListening ? 'Listening...' : 'Interrupt or ask Molly live on the board...'}
            placeholderTextColor={colors.textMuted}
            style={[styles.liveInput, { color: colors.text }]}
            onSubmitEditing={() => handleAskLiveQuestion()}
          />
          <AnimatedPressable
            onPress={() => handleAskLiveQuestion()}
            disabled={answeringLive}
            style={[styles.sendBtn, { backgroundColor: colors.coral }]}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 14, paddingBottom: 18, gap: 10 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  modeText: { fontSize: 11.5, fontWeight: '700', flex: 1 },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicInput: { flex: 1, fontSize: 14.5, fontWeight: '700', paddingVertical: 4 },
  startPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  startPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  toolbarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  toolSectionLbl: { fontSize: 11.5, fontWeight: '700' },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  boardSwatch: { width: 24, height: 24, borderRadius: 12 },
  penSwatch: { width: 20, height: 20, borderRadius: 10 },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  toolIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasBox: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  canvasHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  canvasBadge: { fontSize: 10, fontWeight: '900', letterSpacing: 0.4, flex: 1 },
  miniControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B4A',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  miniControlText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  drawingPad: {
    height: 175,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  canvasPlaceholder: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  semanticList: { gap: 8 },
  emptyNotes: { fontSize: 12.5, lineHeight: 18, textAlign: 'center', paddingVertical: 8 },
  semanticCard: {
    borderRadius: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    padding: 11,
    gap: 4,
  },
  semanticTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  semanticTag: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase' },
  semanticContent: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  reexplainBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    gap: 4,
  },
  reexplainTitle: { fontSize: 12.5, fontWeight: '800' },
  reexplainText: { fontSize: 13.5, lineHeight: 19 },
  liveComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveInput: { flex: 1, fontSize: 14, paddingVertical: 6 },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
