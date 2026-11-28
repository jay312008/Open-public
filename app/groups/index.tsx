import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function DedicatedStudyGroupsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { groups, toggleJoinGroup, createStudyGroup } = useApp();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'All' | 'O-Level' | 'A-Level' | 'University'>('All');
  const [visFilter, setVisFilter] = useState<'All' | 'Public' | 'Private'>('All');
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [level, setLevel] = useState<'O-Level' | 'A-Level' | 'University'>('O-Level');
  const [desc, setDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [billingMode, setBillingMode] = useState<'personal' | 'group_pool' | 'sponsored'>('personal');

  const filtered = groups.filter((g) => {
    const q = search.trim().toLowerCase();
    const matchText =
      !q ||
      g.name.toLowerCase().includes(q) ||
      g.subject.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q);
    const matchVis =
      visFilter === 'All' || (visFilter === 'Private' ? g.isPrivate : !g.isPrivate);
    const matchLvl =
      levelFilter === 'All' ||
      `${g.name} ${g.description}`.toLowerCase().includes(levelFilter.toLowerCase());
    return matchText && matchVis && matchLvl;
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    const created = createStudyGroup({
      name: `${name.trim()} (${level})`,
      subject,
      description: desc.trim() || `${level} ${subject} collaborative AI study group.`,
      isPrivate,
      aiTeacherIds: isPrivate ? ['t-gce-math'] : [],
      billingMode,
    });
    setName('');
    setDesc('');
    setShowCreate(false);
    router.push(`/community/group/${created.id}`);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="AI Study Groups" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Create Button */}
          <AnimatedPressable
            onPress={() => setShowCreate((v) => !v)}
            style={[styles.createBtn, { backgroundColor: colors.mintDark }]}
          >
            <Ionicons name={showCreate ? 'close' : 'add-circle-outline'} size={20} color="#FFFFFF" />
            <Text style={styles.createBtnText}>
              {showCreate ? 'Cancel' : 'Create New Study Group'}
            </Text>
          </AnimatedPressable>

          {showCreate && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>New AI Study Group</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Group name (e.g. GCE Physics Squad)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject (e.g. Physics, Mathematics, Biology)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />
              <TextInput
                value={desc}
                onChangeText={setDesc}
                placeholder="Group goal & study focus..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Academic Level</Text>
              <View style={styles.row}>
                {(['O-Level', 'A-Level', 'University'] as const).map((lvl) => (
                  <AnimatedPressable
                    key={lvl}
                    onPress={() => setLevel(lvl)}
                    style={[styles.pill, { backgroundColor: level === lvl ? colors.coral : colors.surfaceMuted }]}
                  >
                    <Text style={{ color: level === lvl ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '800' }}>
                      {lvl}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Visibility</Text>
              <View style={styles.row}>
                {[
                  { label: '🔒 Private (Up to 5 AI Teachers)', val: true },
                  { label: '🌍 Public (Peer-Only)', val: false },
                ].map((opt) => (
                  <AnimatedPressable
                    key={opt.label}
                    onPress={() => setIsPrivate(opt.val)}
                    style={[styles.pill, { backgroundColor: isPrivate === opt.val ? colors.purple : colors.surfaceMuted }]}
                  >
                    <Text style={{ color: isPrivate === opt.val ? '#FFFFFF' : colors.text, fontSize: 11.5, fontWeight: '800' }}>
                      {opt.label}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              {isPrivate && (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Credit Billing Mode</Text>
                  <View style={styles.row}>
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
                        style={[styles.pill, { backgroundColor: billingMode === b.id ? colors.mintDark : colors.surfaceMuted }]}
                      >
                        <Text style={{ color: billingMode === b.id ? '#FFFFFF' : colors.text, fontSize: 11.5, fontWeight: '800' }}>
                          {b.label}
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                </>
              )}

              <AnimatedPressable
                onPress={handleCreate}
                style={[styles.createBtn, { backgroundColor: name.trim() ? colors.coral : colors.surfaceMuted }]}
              >
                <Text style={[styles.createBtnText, { color: name.trim() ? '#FFFFFF' : colors.textMuted }]}>
                  Create & Open Workspace
                </Text>
              </AnimatedPressable>
            </View>
          )}

          {/* Search & Separate Category / Visibility Filters */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.searchBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Ionicons name="search" size={17} color={colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search study groups by name or subject..."
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, color: colors.text, fontSize: 14 }}
              />
            </View>
            <View style={styles.row}>
              {(['All', 'O-Level', 'A-Level', 'University'] as const).map((lvl) => (
                <AnimatedPressable
                  key={lvl}
                  onPress={() => setLevelFilter(lvl)}
                  style={[styles.pill, { backgroundColor: levelFilter === lvl ? colors.coral : colors.surfaceMuted }]}
                >
                  <Text style={{ color: levelFilter === lvl ? '#FFFFFF' : colors.text, fontSize: 11.5, fontWeight: '800' }}>
                    {lvl}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
            <View style={styles.row}>
              {(['All', 'Public', 'Private'] as const).map((vis) => (
                <AnimatedPressable
                  key={vis}
                  onPress={() => setVisFilter(vis)}
                  style={[styles.pill, { backgroundColor: visFilter === vis ? colors.purple : colors.surfaceMuted }]}
                >
                  <Text style={{ color: visFilter === vis ? '#FFFFFF' : colors.text, fontSize: 11.5, fontWeight: '800' }}>
                    {vis}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>

          {/* Study Groups List */}
          {filtered.map((grp) => (
            <AnimatedPressable
              key={grp.id}
              onPress={() => router.push(`/community/group/${grp.id}`)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.grpHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{grp.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 2 }}>
                    {grp.subject} · {grp.memberCount} members · {grp.isPrivate ? '🔒 Private' : '🌍 Public'}
                    {grp.isPrivate && grp.aiEnabled ? ' · 🤖 AI Active' : ''}
                  </Text>
                </View>
                <AnimatedPressable
                  onPress={() => toggleJoinGroup(grp.id)}
                  style={[
                    styles.joinBtn,
                    { backgroundColor: grp.joined ? colors.surfaceMint : colors.coral },
                  ]}
                >
                  <Text style={{ color: grp.joined ? colors.mintDark : '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                    {grp.joined ? 'Open' : 'Join'}
                  </Text>
                </AnimatedPressable>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20 }}>
                {grp.description}
              </Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 12 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: { flexDirection: 'row', gap: 6 },
  pill: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center', paddingHorizontal: 6 },
  grpHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
});
