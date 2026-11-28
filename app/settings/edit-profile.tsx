import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

const AVATAR_GALLERY: { emoji: string; bg: string; label: string }[] = [
  { emoji: '🧑🏾‍🎓', bg: '#FFD7CF', label: 'Scholar' },
  { emoji: '👩🏾‍🎓', bg: '#FDE68A', label: 'Graduate' },
  { emoji: '🧑🏽‍🔬', bg: '#DCFCE7', label: 'Scientist' },
  { emoji: '👩🏽‍🔬', bg: '#CCFBF1', label: 'Chemist' },
  { emoji: '🧑🏾‍💻', bg: '#DBEAFE', label: 'Coder' },
  { emoji: '👩🏾‍💻', bg: '#E0E7FF', label: 'Engineer' },
  { emoji: '🧑🏾‍🎨', bg: '#FCE7F3', label: 'Artist' },
  { emoji: '👩🏾‍🏫', bg: '#F3E8FF', label: 'Mentor' },
  { emoji: '🧑🏾‍🚀', bg: '#CFFAFE', label: 'Explorer' },
  { emoji: '👩🏽‍⚕️', bg: '#FFE4E6', label: 'Medic' },
  { emoji: '🦁', bg: '#FEF3C7', label: 'Lion' },
  { emoji: '🦉', bg: '#E0F2FE', label: 'Owl' },
  { emoji: '🦊', bg: '#FFEDD5', label: 'Fox' },
  { emoji: '🐼', bg: '#F1F5F9', label: 'Panda' },
  { emoji: '🦋', bg: '#EDE9FE', label: 'Butterfly' },
  { emoji: '🚀', bg: '#DBEAFE', label: 'Rocket' },
  { emoji: '⚡', bg: '#FEF9C3', label: 'Spark' },
  { emoji: '🌍', bg: '#D1FAE5', label: 'Globe' },
  { emoji: '📚', bg: '#FCE7F3', label: 'Reader' },
  { emoji: '🏆', bg: '#FEF3C7', label: 'Champion' },
];

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useApp();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [bio, setBio] = useState(profile.bio);
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatarEmoji);
  const [avatarBg, setAvatarBg] = useState(profile.avatarBg);

  const handleSave = () => {
    updateProfile({
      displayName: displayName.trim() || profile.displayName,
      username: username.trim().replace(/^@/, '') || profile.username,
      educationLevel: educationLevel.trim() || profile.educationLevel,
      bio: bio.trim(),
      avatarEmoji,
      avatarBg,
    });
    router.back();
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Edit Profile" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 20 Curated Student Avatars (No photo upload needed) */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Choose Your Profile Avatar (20 Styles)
            </Text>
            <View style={styles.previewRow}>
              <View style={[styles.bigAvatar, { backgroundColor: avatarBg, borderColor: colors.coral }]}>
                <Text style={{ fontSize: 36 }}>{avatarEmoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{displayName || 'Student'}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>
                  Tap any of the 20 curated student avatars below.
                </Text>
              </View>
            </View>
            <View style={styles.avatarGrid}>
              {AVATAR_GALLERY.map((item) => {
                const selected = avatarEmoji === item.emoji && avatarBg === item.bg;
                return (
                  <AnimatedPressable
                    key={`${item.emoji}-${item.label}`}
                    onPress={() => {
                      setAvatarEmoji(item.emoji);
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
                    <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
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
