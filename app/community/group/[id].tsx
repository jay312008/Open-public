import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { useAITeachers } from '@/store/useAITeachers';
import { askMollyAI } from '@/lib/aiGateway';

type GroupTab = 'Overview' | 'Discussion' | 'AI Teachers' | 'Quizzes' | 'Live' | 'Members' | 'Settings';
const GROUP_TABS: GroupTab[] = ['Overview', 'Discussion', 'AI Teachers', 'Quizzes', 'Live', 'Members', 'Settings'];

const DAILY_MCQ = {
  question: 'In y = 3x - 5, what is the gradient (slope) of the line?',
  options: ['Gradient is -5', 'Gradient is 3', 'Gradient is 5/3', 'Gradient is 0'],
  correctIndex: 1,
  explanation: 'In slope-intercept form y = mx + c, the coefficient of x (m = 3) is the gradient.',
};

interface GroupAIMsg {
  id: string;
  sender: string;
  role: 'student' | 'ai';
  text: string;
  time: string;
}

export default function StudyGroupWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { groups, profile, sendGroupMessage, consumeCredits } = useApp();
  const { teachers } = useAITeachers();

  const group = groups.find((g) => g.id === id);
  const [tab, setTab] = useState<GroupTab>('Overview');

  // Discussion state
  const [draft, setDraft] = useState('');

  // Group AI Teachers state (up to 5 for private groups)
  const [assignedTeacherIds, setAssignedTeacherIds] = useState<string[]>(
    group?.aiTeacherIds?.length ? group.aiTeacherIds : teachers.slice(0, 1).map((t) => t.id)
  );
  const [activeTeacherId, setActiveTeacherId] = useState<string>(teachers[0]?.id ?? 't-gce-math');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<GroupAIMsg[]>([
    {
      id: 'ai-welcome',
      sender: 'Group AI Teacher',
      role: 'ai',
      text: 'Welcome to the dedicated Group AI Teacher room! Ask questions, request graphs, or discuss tough exam topics here without cluttering peer chat.',
      time: 'Now',
    },
  ]);

  // Daily Quiz Scheduler & Taking state
  const [quizScheduleTime, setQuizScheduleTime] = useState('19:00');
  const [quizTopic, setQuizTopic] = useState(group?.subject ?? 'Physics Waves');
  const [quizDifficulty, setQuizDifficulty] = useState<'Easy' | 'Medium' | 'Exam'>('Exam');
  const [quizScheduled, setQuizScheduled] = useState(true);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);

  // Live Session Controls state
  const [liveActive, setLiveActive] = useState(false);
  const [allowStudentMic, setAllowStudentMic] = useState(true);
  const [turnTakingEnabled, setTurnTakingEnabled] = useState(true);

  // Members & Invites state
  const [inviteInput, setInviteInput] = useState('');
  const [members, setMembers] = useState([
    { id: 'me', name: profile.displayName, username: profile.username, role: 'Admin' as 'Admin' | 'Member' },
    { id: 'm2', name: 'Amaka N.', username: 'amaka_gce', role: 'Member' as 'Admin' | 'Member' },
    { id: 'm3', name: 'Kevin T.', username: 'kevin_sci', role: 'Member' as 'Admin' | 'Member' },
  ]);

  // Settings state
  const [aiEnabledLocal, setAiEnabledLocal] = useState(Boolean(group?.isPrivate && group?.aiEnabled));
  const [billingMode, setBillingMode] = useState<'personal' | 'group_pool' | 'sponsored'>(
    group?.billingMode ?? 'personal'
  );

  if (!group) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <BrandHeader showBack title="Study Group" />
        </SafeAreaView>
      </AppBackground>
    );
  }

  const aiAllowed = Boolean(group.isPrivate && aiEnabledLocal);
  const selectedTeachers = teachers.filter((t) => assignedTeacherIds.includes(t.id));
  const activeTeacher = selectedTeachers.find((t) => t.id === activeTeacherId) ?? selectedTeachers[0] ?? teachers[0];

  const toggleAssignTeacher = (tid: string) => {
    setAssignedTeacherIds((prev) => {
      if (prev.includes(tid)) return prev.filter((x) => x !== tid);
      if (prev.length >= 5) {
        Alert.alert('Limit Reached', 'Private study groups can host up to 5 AI Teachers.');
        return prev;
      }
      return [...prev, tid];
    });
  };

  const handleSendGroupAI = async () => {
    const clean = aiPrompt.trim();
    if (!clean || aiLoading || !aiAllowed) return;
    setAiPrompt('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAiMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: profile.displayName, role: 'student', text: clean, time: now },
    ]);
    setAiLoading(true);
    consumeCredits(1, `Group AI (${group.name})`, 'group');
    const res = await askMollyAI(
      `[Act as ${activeTeacher?.name ?? 'Group AI Teacher'} teaching ${group.subject} in a private study group] ${clean}`,
      group.subject
    );
    setAiMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        sender: activeTeacher?.name ?? 'Group AI Teacher',
        role: 'ai',
        text: res.data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setAiLoading(false);
  };

  const handleInviteMember = () => {
    const clean = inviteInput.trim();
    if (!clean) return;
    setMembers((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        name: clean.includes('@') ? clean.split('@')[0] : clean,
        username: clean.replace(/^@/, ''),
        role: 'Member',
      },
    ]);
    setInviteInput('');
    Alert.alert('Invitation Sent', `Invited ${clean} to ${group.name}.`);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BrandHeader showBack title={group.name} />

        {/* 7-Section Group Navigation Bar (Part 12.9) */}
        <View style={[styles.tabBarWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {GROUP_TABS.map((t) => {
              const active = tab === t;
              return (
                <AnimatedPressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[
                    styles.tabPill,
                    {
                      backgroundColor: active ? colors.mintDark : colors.surfaceMuted,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '800' }}>
                    {t}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </View>

        {/* TAB 1: OVERVIEW */}
        {tab === 'Overview' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.pillRow}>
                <View style={[styles.pill, { backgroundColor: group.isPrivate ? colors.surfacePurpleSoft : colors.surfaceMint }]}>
                  <Text style={{ color: group.isPrivate ? colors.purple : colors.mintDark, fontSize: 11, fontWeight: '800' }}>
                    {group.isPrivate ? '🔒 Private Group' : '🌍 Public Group'}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>{group.subject}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: 'rgba(255, 107, 74, 0.14)' }]}>
                  <Text style={{ color: colors.coral, fontSize: 11, fontWeight: '800' }}>
                    Credits: {billingMode.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.h2, { color: colors.text }]}>{group.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20 }}>
                {group.description}
              </Text>
              {group.inviteCode && (
                <View style={[styles.inviteBox, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                    Invite Code: <Text style={{ color: colors.text, fontWeight: '900' }}>{group.inviteCode}</Text>
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    Link: https://learny-nu.vercel.app/community/group/{group.id}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.mintDark }]}>{members.length}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '700' }}>Members</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.purple }]}>
                  {aiAllowed ? selectedTeachers.length : 0}/5
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '700' }}>AI Teachers</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.coral }]}>{quizScheduleTime}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '700' }}>Daily Quiz</Text>
              </View>
            </View>

            <View style={styles.quickGrid}>
              {(
                [
                  { label: 'Peer Discussion', icon: 'chatbubbles-outline', next: 'Discussion' },
                  { label: 'AI Teacher Room', icon: 'school-outline', next: 'AI Teachers' },
                  { label: 'Daily Group Quiz', icon: 'trophy-outline', next: 'Quizzes' },
                  { label: 'Live Teaching', icon: 'easel-outline', next: 'Live' },
                ] as const
              ).map((q) => (
                <AnimatedPressable
                  key={q.label}
                  onPress={() => setTab(q.next)}
                  style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name={q.icon} size={22} color={colors.coral} />
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{q.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* TAB 2: PEER DISCUSSION */}
        {tab === 'Discussion' && (
          <>
            <ScrollView contentContainerStyle={styles.scroll}>
              {group.messages.map((m) => (
                <View key={m.id} style={[styles.msg, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 20 }}>{m.senderAvatar}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sender, { color: colors.text }]}>
                      {m.senderName} · <Text style={{ color: colors.textMuted, fontWeight: '400' }}>{m.createdAt}</Text>
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13.5, marginTop: 2 }}>{m.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message classmates..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
              />
              <AnimatedPressable
                onPress={() => {
                  if (draft.trim()) {
                    sendGroupMessage(group.id, draft);
                    setDraft('');
                  }
                }}
                style={[styles.sendBtn, { backgroundColor: colors.coral }]}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </AnimatedPressable>
            </View>
          </>
        )}

        {/* TAB 3: GROUP AI TEACHERS (Up to 5 AI Teachers + Dedicated AI Chat) */}
        {tab === 'AI Teachers' && (
          <>
            <ScrollView contentContainerStyle={styles.scroll}>
              {!aiAllowed ? (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.h2, { color: colors.text }]}>Group AI Disabled</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                    {group.isPrivate
                      ? 'Turn on Group AI in the Settings tab to enable up to 5 AI Teachers for this private group.'
                      : 'Public groups are peer-to-peer by default to protect credit pools. Create a Private Group to host up to 5 AI Teachers.'}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.h3, { color: colors.text }]}>
                      Assigned AI Teachers ({selectedTeachers.length}/5)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {teachers.map((t) => {
                        const assigned = assignedTeacherIds.includes(t.id);
                        const active = activeTeacher?.id === t.id;
                        return (
                          <AnimatedPressable
                            key={t.id}
                            onPress={() => {
                              if (!assigned) toggleAssignTeacher(t.id);
                              setActiveTeacherId(t.id);
                            }}
                            onLongPress={() => toggleAssignTeacher(t.id)}
                            style={[
                              styles.teacherChip,
                              {
                                backgroundColor: active ? colors.purple : assigned ? colors.surfacePurpleSoft : colors.surfaceMuted,
                              },
                            ]}
                          >
                            <Text style={{ fontSize: 15 }}>{t.avatarEmoji}</Text>
                            <Text
                              style={{
                                color: active ? '#FFFFFF' : colors.text,
                                fontSize: 12,
                                fontWeight: '800',
                              }}
                            >
                              {t.name}
                            </Text>
                          </AnimatedPressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {aiMessages.map((m) => (
                    <View
                      key={m.id}
                      style={[
                        styles.msg,
                        {
                          backgroundColor: m.role === 'ai' ? colors.surface : colors.surfaceMint,
                          borderColor: m.role === 'ai' ? colors.purple : colors.mintDark,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 19 }}>{m.role === 'ai' ? '🤖' : '🧑🏾‍🎓'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sender, { color: colors.text }]}>
                          {m.sender} · <Text style={{ color: colors.textMuted, fontWeight: '400' }}>{m.time}</Text>
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 13.5, marginTop: 3, lineHeight: 20 }}>
                          {m.text}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            {aiAllowed && (
              <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TextInput
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  placeholder={`Ask ${activeTeacher?.name ?? 'AI Teacher'}...`}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                />
                <AnimatedPressable
                  onPress={handleSendGroupAI}
                  style={[styles.sendBtn, { backgroundColor: colors.purple }]}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  )}
                </AnimatedPressable>
              </View>
            )}
          </>
        )}

        {/* TAB 4: DAILY AI QUIZZES (Scheduler + Live Quiz + Rankings) */}
        {tab === 'Quizzes' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.h3, { color: colors.text }]}>Admin Daily Quiz Schedule</Text>
              <TextInput
                value={quizTopic}
                onChangeText={setQuizTopic}
                placeholder="Quiz topic (e.g. Physics Waves)"
                placeholderTextColor={colors.textMuted}
                style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={quizScheduleTime}
                  onChangeText={setQuizScheduleTime}
                  placeholder="19:00"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.formInput, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                />
                {(['Easy', 'Medium', 'Exam'] as const).map((d) => (
                  <AnimatedPressable
                    key={d}
                    onPress={() => setQuizDifficulty(d)}
                    style={[
                      styles.pill,
                      {
                        justifyContent: 'center',
                        backgroundColor: quizDifficulty === d ? colors.coral : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={{ color: quizDifficulty === d ? '#FFFFFF' : colors.text, fontSize: 11.5, fontWeight: '800' }}>
                      {d}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
              <AnimatedPressable
                onPress={() => {
                  setQuizScheduled(true);
                  Alert.alert('Daily Quiz Saved', `Daily ${quizDifficulty} quiz on "${quizTopic}" scheduled for ${quizScheduleTime}.`);
                }}
                style={[styles.primaryBtn, { backgroundColor: colors.mintDark }]}
              >
                <Text style={styles.primaryBtnText}>
                  {quizScheduled ? `Scheduled Daily at ${quizScheduleTime}` : 'Save Daily Schedule'}
                </Text>
              </AnimatedPressable>
            </View>

            {/* Active Quiz with Free Automatic MCQ Marking */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.mintDark }]}>
              <Text style={{ color: colors.mintDark, fontSize: 11, fontWeight: '800' }}>
                TODAY'S GROUP QUIZ · FREE MCQ MARKING · PRIVATE FEEDBACK
              </Text>
              <Text style={[styles.h3, { color: colors.text }]}>{DAILY_MCQ.question}</Text>
              <View style={{ gap: 6 }}>
                {DAILY_MCQ.options.map((opt, idx) => {
                  const picked = quizChoice === idx;
                  const isCorrect = idx === DAILY_MCQ.correctIndex;
                  const bg =
                    quizChoice === null
                      ? colors.surfaceMuted
                      : isCorrect
                        ? colors.surfaceMint
                        : picked
                          ? '#FFE4E6'
                          : colors.surfaceMuted;
                  return (
                    <AnimatedPressable
                      key={opt}
                      onPress={() => setQuizChoice(idx)}
                      style={[styles.optBtn, { backgroundColor: bg }]}
                    >
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{opt}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
              {quizChoice !== null && (
                <View style={{ gap: 8, marginTop: 6 }}>
                  <Text style={{ color: quizChoice === DAILY_MCQ.correctIndex ? colors.mintDark : colors.coral, fontSize: 13, fontWeight: '800' }}>
                    {quizChoice === DAILY_MCQ.correctIndex ? '✅ Correct! ' : '❌ Review: '}
                    {DAILY_MCQ.explanation}
                  </Text>
                  <AnimatedPressable
                    onPress={() =>
                      router.push({
                        pathname: '/tools/ask-molly',
                        params: { prompt: `Explain ${quizTopic} and give me 2 more practice questions` },
                      } as never)
                    }
                    style={[styles.primaryBtn, { backgroundColor: colors.purple }]}
                  >
                    <Text style={styles.primaryBtnText}>Continue Revision with Molly</Text>
                  </AnimatedPressable>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* TAB 5: GROUP LIVE TEACHING SESSIONS */}
        {tab === 'Live' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.h2, { color: colors.text }]}>Group Live AI Teaching</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                Host a live whiteboard session for {group.name}. Admin controls speaking permissions and student turn-taking.
              </Text>
              <View style={styles.switchRow}>
                <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '700' }}>Allow student voice questions</Text>
                <Switch value={allowStudentMic} onValueChange={setAllowStudentMic} trackColor={{ true: colors.mintDark }} />
              </View>
              <View style={styles.switchRow}>
                <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '700' }}>Enforce moderated turn-taking</Text>
                <Switch value={turnTakingEnabled} onValueChange={setTurnTakingEnabled} trackColor={{ true: colors.mintDark }} />
              </View>
              <AnimatedPressable
                onPress={() => {
                  setLiveActive((v) => !v);
                  if (!liveActive) {
                    router.push('/tools/live-teacher' as never);
                  }
                }}
                style={[styles.primaryBtn, { backgroundColor: liveActive ? colors.coral : colors.mintDark }]}
              >
                <Text style={styles.primaryBtnText}>
                  {liveActive ? 'End Live Session' : 'Start Live Group Whiteboard'}
                </Text>
              </AnimatedPressable>
            </View>
          </ScrollView>
        )}

        {/* TAB 6: MEMBERS & INVITES */}
        {tab === 'Members' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.h3, { color: colors.text }]}>Invite by Username or Email</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={inviteInput}
                  onChangeText={setInviteInput}
                  placeholder="@username or email@school.cm"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.formInput, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                />
                <AnimatedPressable onPress={handleInviteMember} style={[styles.inviteBtn, { backgroundColor: colors.coral }]}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Invite</Text>
                </AnimatedPressable>
              </View>
            </View>

            {members.map((m) => (
              <View key={m.id} style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{m.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>@{m.username} · {m.role}</Text>
                </View>
                {m.id !== 'me' && (
                  <AnimatedPressable
                    onPress={() =>
                      setMembers((prev) =>
                        prev.map((x) =>
                          x.id === m.id ? { ...x, role: x.role === 'Admin' ? 'Member' : 'Admin' } : x
                        )
                      )
                    }
                    style={[styles.pill, { backgroundColor: colors.surfaceMint }]}
                  >
                    <Text style={{ color: colors.mintDark, fontSize: 11, fontWeight: '800' }}>
                      {m.role === 'Admin' ? 'Demote' : 'Make Admin'}
                    </Text>
                  </AnimatedPressable>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {/* TAB 7: GROUP ADMINISTRATION & SETTINGS */}
        {tab === 'Settings' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.h3, { color: colors.text }]}>AI & Billing Governance</Text>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '700' }}>Enable Group AI Teachers</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
                    {group.isPrivate ? 'Private groups support up to 5 AI Teachers.' : 'Disabled by default for Public groups.'}
                  </Text>
                </View>
                <Switch
                  value={aiEnabledLocal}
                  disabled={!group.isPrivate}
                  onValueChange={setAiEnabledLocal}
                  trackColor={{ true: colors.mintDark }}
                />
              </View>

              <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontWeight: '700', marginTop: 6 }}>
                Credit Billing Policy
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(
                  [
                    { id: 'personal', label: 'Personal' },
                    { id: 'group_pool', label: 'Group Pool' },
                    { id: 'sponsored', label: 'Sponsored' },
                  ] as const
                ).map((b) => (
                  <AnimatedPressable
                    key={b.id}
                    onPress={() => setBillingMode(b.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: 999,
                      alignItems: 'center',
                      backgroundColor: billingMode === b.id ? colors.purple : colors.surfaceMuted,
                    }}
                  >
                    <Text style={{ color: billingMode === b.id ? '#FFFFFF' : colors.text, fontSize: 11.5, fontWeight: '800' }}>
                      {b.label}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabBarWrap: { borderBottomWidth: 1, paddingVertical: 8 },
  tabRow: { paddingHorizontal: 14, gap: 6 },
  tabPill: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999 },
  scroll: { padding: 16, gap: 12, paddingBottom: 36 },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 10 },
  h2: { fontSize: 18, fontWeight: '900' },
  h3: { fontSize: 15, fontWeight: '800' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  inviteBox: { borderRadius: 12, padding: 10, gap: 3 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 18, fontWeight: '900' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '48%', borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  teacherChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  msg: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1 },
  sender: { fontSize: 13.5, fontWeight: '800' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, fontSize: 14, paddingVertical: 6 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  formInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13.5 },
  primaryBtn: { paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13.5 },
  optBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  inviteBtn: { paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  memberRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 13, gap: 10 },
});
