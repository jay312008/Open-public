import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BrandAssets } from '@/constants/assets';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { AnimatedPressable } from './AnimatedPressable';

interface BrandHeaderProps {
  showAvatar?: boolean;
  showSettings?: boolean;
  showBack?: boolean;
  title?: string;
}

export function BrandHeader({
  showAvatar = true,
  showSettings = false,
  showBack = false,
  title,
}: BrandHeaderProps) {
  const { colors } = useTheme();
  const { profile, notifications } = useApp();
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack ? (
          <AnimatedPressable
            onPress={handleBack}
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </AnimatedPressable>
        ) : showAvatar ? (
          <AnimatedPressable
            onPress={() => router.push('/(tabs)/profile')}
            style={[
              styles.avatarCircle,
              { backgroundColor: profile.avatarBg, borderColor: colors.surface },
            ]}
            accessibilityLabel="Open Profile"
          >
            <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
          </AnimatedPressable>
        ) : null}

        {title ? (
          <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.brandRow}>
            <Image
              source={BrandAssets.mascotTransparent}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <Text style={[styles.wordmark, { color: colors.text }]}>
              learny<Text style={{ color: colors.brandGreen }}>mol.</Text>
            </Text>
          </View>
        )}
      </View>

      <View style={styles.rightRow}>
        {!showBack && (
          <AnimatedPressable
            onPress={() => router.push('/notifications')}
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {unreadCount > 0 && <View style={[styles.badgeDot, { backgroundColor: colors.coral }]} />}
          </AnimatedPressable>
        )}

        {showSettings && (
          <AnimatedPressable
            onPress={() => router.push('/settings')}
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoImg: {
    width: 28,
    height: 28,
  },
  wordmark: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleText: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
