import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CompanionAssets,
  CompanionId,
  CompanionMood,
  CompanionReactionAssets,
} from '@/constants/assets';

interface CompanionAvatarProps {
  companionId: CompanionId;
  mood?: CompanionMood;
  size?: number;
}

const MOOD_BADGE: Record<
  Exclude<CompanionMood, 'default'>,
  { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }
> = {
  celebrate: { icon: 'trophy', bg: '#F59E0B', color: '#FFFFFF' },
  happy: { icon: 'thumbs-up', bg: '#16A34A', color: '#FFFFFF' },
  thinking: { icon: 'bulb', bg: '#7C3AED', color: '#FFFFFF' },
  encourage: { icon: 'heart', bg: '#FF6B4A', color: '#FFFFFF' },
};

export function CompanionAvatar({
  companionId,
  mood = 'default',
  size = 72,
}: CompanionAvatarProps) {
  const moodMap = CompanionReactionAssets[companionId] ?? CompanionReactionAssets.molly;
  const hasDedicatedPose = mood === 'default' || Boolean(moodMap[mood]);
  const source =
    moodMap[mood] ??
    moodMap.default ??
    CompanionAssets[companionId] ??
    CompanionAssets.molly;

  const badge = mood !== 'default' && !hasDedicatedPose ? MOOD_BADGE[mood] : null;
  const badgeSize = Math.max(20, Math.round(size * 0.28));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {badge && (
        <View
          style={[
            styles.moodBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: badge.bg,
            },
          ]}
        >
          <Ionicons
            name={badge.icon}
            size={Math.round(badgeSize * 0.56)}
            color={badge.color}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  moodBadge: {
    position: 'absolute',
    right: 2,
    top: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
