import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useApp();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [bio, setBio] = useState(profile.bio);

  const handleSave = () => {
    updateProfile({
      displayName: displayName.trim() || profile.displayName,
      username: username.trim().replace(/^@/, '') || profile.username,
      educationLevel: educationLevel.trim() || profile.educationLevel,
      bio: bio.trim(),
    });
    router.back();
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Edit Profile" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Display Name</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Username</Text>
            <TextInput value={username} onChangeText={setUsername} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Education Level</Text>
            <TextInput value={educationLevel} onChangeText={setEducationLevel} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Bio</Text>
            <TextInput value={bio} onChangeText={setBio} multiline style={[styles.input, { color: colors.text, borderColor: colors.border, minHeight: 72 }]} />
          </View>
          <AnimatedPressable onPress={handleSave} style={[styles.btn, { backgroundColor: colors.coral }]}>
            <Text style={styles.btnText}>Save Changes</Text>
          </AnimatedPressable>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  label: { fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, padding: 11, fontSize: 14 },
  btn: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
