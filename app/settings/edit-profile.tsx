import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { STUDENT_AVATARS, StudentAvatar, resolveStudentAvatar } from '@/components/StudentAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useApp();
  const router = useRouter();

  const initialAvatar = resolveStudentAvatar(profile.avatarEmoji);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [bio, setBio] = useState(profile.bio);
  const [avatarId, setAvatarId] = useState(initialAvatar.id);
  const [avatarBg, setAvatarBg] = useState(profile.avatarBg || initialAvatar.bg);

  const handleSave = () => {
    updateProfile({
      displayName: displayName.trim() || profile.displayName,
      username: username.trim().replace(/^@/, '') || profile.username,
      educationLevel: educationLevel.trim() || profile.educationLevel,
      bio: bio.trim(),
      avatarEmoji: avatarId,
      avatarBg,
    });
    router.back();
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Edit Profile" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 12 Illustrated Student Avatars (Zero Emojis) */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Choose Your Student Character
            </Text>
            <View style={styles.previewRow}>
              <View style={[styles.bigAvatar, { backgroundColor: avatarBg, borderColor: colors.coral }]}>
                <StudentAvatar avatarId={avatarId} bgColor={avatarBg} size={62} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{displayName || 'Student'}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>
                  Pick any illustrated student character below.
                </Text>
              </View>
            </View>
            <View style={styles.avatarGrid}>
              {STUDENT_AVATARS.map((item) => {
                const selected = avatarId === item.id;
                return (
                  <AnimatedPressable
                    key={item.id}
                    onPress={() => {
                      setAvatarId(item.id);
                      setAvatarBg(item.bg);
                    }}
                    style={[
                      styles.avatarChoice,
                      {
                        backgroundColor: item.bg,
                        borderColor: selected ? colors.coral : 'transparent',
                        borderWidth: selected ? 2.5 : 1,
                      },
                    ]}
                  >
                    <StudentAvatar avatarId={item.id} bgColor={item.bg} size={46} />
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Display Name</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Username</Text>
            <TextInput value={username} onChangeText={setUsername} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Education Level</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {['O-Level', 'A-Level', 'University'].map((lvl) => (
                <AnimatedPressable
                  key={lvl}
                  onPress={() => setEducationLevel(lvl)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 999,
                    alignItems: 'center',
                    backgroundColor: educationLevel.includes(lvl) ? colors.mintDark : colors.surfaceMuted,
                  }}
                >
                  <Text
                    style={{
                      color: educationLevel.includes(lvl) ? '#FFFFFF' : colors.text,
                      fontSize: 12,
                      fontWeight: '800',
                    }}
                  >
                    {lvl}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.textMuted }]}>Bio</Text>
            <TextInput value={bio} onChangeText={setBio} multiline style={[styles.input, { color: colors.text, borderColor: colors.border, minHeight: 72 }]} />
          </View>

          <AnimatedPressable onPress={handleSave} style={[styles.btn, { backgroundColor: colors.coral }]}>
            <Text style={styles.btnText}>Save Profile Changes</Text>
          </AnimatedPressable>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15.5, fontWeight: '900' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigAvatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  avatarChoice: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, padding: 11, fontSize: 14 },
  btn: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
