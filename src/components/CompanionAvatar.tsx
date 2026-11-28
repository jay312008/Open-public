import React from 'react';
import { Image } from 'react-native';
import { CompanionAssets, CompanionId } from '@/constants/assets';

interface CompanionAvatarProps {
  companionId: CompanionId;
  size?: number;
}

export function CompanionAvatar({ companionId, size = 72 }: CompanionAvatarProps) {
  const source = CompanionAssets[companionId] ?? CompanionAssets.molly;
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
