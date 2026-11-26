import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { COMPANION_REGISTRY, CompanionId } from '@/constants/assets';

export default function ChooseMollyScreen() {
  const { colors } = useTheme();
  const { profile, setCompanion } = useApp();
  const router = useRouter();
  const [selected, setSelected] = useState<CompanionId>(profile.companionId);

  const handleApply = () => {
    setCompanion(selected);
    router.back();
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Choose Your Molly" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Pick a learning companion that fits your style. Changing your companion never resets
            your progress or conversations.
          </Text>

          <View style={styles.grid}>
            {COMPANION_REGISTRY.map((comp) => {
              const active = selected === comp.id;
              return (
                <AnimatedPressable
                  key={comp.id}
                  onPress={() => setSelected(comp.id)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: active ? colors.brandGreen : colors.border,
                      borderWidth: active ? 2.5 : 1,
                    },
                  ]}
                >
                  {active && (
                    <View style={[styles.check, { backgroundColor: colors.brandGreen }]}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                  <CompanionAvatar companionId={comp.id} size={74} />
                  <Text style={[styles.name, { color: colors.text }]}>{comp.name}</Text>
                  <Text style={[styles.role, { color: colors.textSecondary }]}>{comp.subtitle}</Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <AnimatedPressable
            onPress={handleApply}
            style={[styles.applyBtn, { backgroundColor: colors.brandGreen }]}
          >
            <Text style={styles.applyText}>Apply</Text>
          </AnimatedPressable>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 16 },
  sub: { fontSize: 13.5, lineHeight: 19 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '800' },
  role: { fontSize: 12 },
  applyBtn: { paddingVertical: 15, borderRadius: 999, alignItems: 'center', marginTop: 8 },
  applyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
