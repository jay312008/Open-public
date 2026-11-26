import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BrandAssets, CompanionId, getCompanionById } from '@/constants/assets';

interface CompanionAvatarProps {
  companionId: CompanionId;
  size?: number;
}

export function CompanionAvatar({ companionId, size = 72 }: CompanionAvatarProps) {
  const companion = getCompanionById(companionId);

  if (companion.usesOfficialMascot) {
    return (
      <Image
        source={BrandAssets.mascotTransparent}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }

  return (
    <View
      style={[
        styles.altContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: companion.bgTint,
          borderColor: companion.accentColor,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{companion.emojiFallback}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  altContainer: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
