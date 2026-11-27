import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedPressable } from './AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';

interface LayeredFeatureCardProps {
  title: string;
  subtitle: string;
  accentColor: string;
  backgroundSource: ImageSourcePropType;
  foregroundSource?: ImageSourcePropType;
  onPress: () => void;
  minHeight?: number;
  badgeText?: string;
  progressPercent?: number;
  foregroundWidthPercent?: `${number}%`;
  children?: React.ReactNode;
}

/**
 * Composes an environmental background, an independent transparent foreground
 * illustration, readable typography, and a glossy glass circular CTA as
 * separate responsive layers.
 */
export function LayeredFeatureCard({
  title,
  subtitle,
  accentColor,
  backgroundSource,
  foregroundSource,
  onPress,
  minHeight = 166,
  badgeText,
  progressPercent,
  foregroundWidthPercent = '46%',
  children,
}: LayeredFeatureCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.975}
      style={[
        styles.cardOuter,
        {
          minHeight,
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.88)',
          shadowColor: colors.shadowColor,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      {/* Layer 1: Environmental Background */}
      <Image
        source={backgroundSource}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />

      {/* Layer 1b: Subtle left-side readability veil so foreground text stays crisp */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(21,27,25,0.86)', 'rgba(21,27,25,0.58)', 'rgba(21,27,25,0.18)']
            : ['rgba(255,255,255,0.84)', 'rgba(255,255,255,0.54)', 'rgba(255,255,255,0.06)']
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Layer 2: Independent Transparent Foreground Illustration (right-aligned, responsive) */}
      {foregroundSource && (
        <View
          pointerEvents="none"
          style={[styles.foregroundSlot, { width: foregroundWidthPercent }]}
        >
          <Image
            source={foregroundSource}
            resizeMode="contain"
            style={styles.foregroundImage}
          />
        </View>
      )}

      {/* Layer 3: Text & Interactive Controls (left-aligned safe area) */}
      <View style={[styles.contentCol, { maxWidth: foregroundSource ? '58%' : '76%' }]}>
        {badgeText && (
          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.14)'
                  : 'rgba(255,255,255,0.82)',
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: accentColor }]}>{badgeText}</Text>
          </View>
        )}

        <View style={styles.titleRow}>
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          <Text style={[styles.title, { color: isDark ? '#F5F7F5' : '#251D3A' }]}>
            {title}
          </Text>
        </View>

        <Text
          style={[
            styles.subtitle,
            { color: isDark ? 'rgba(235,243,237,0.86)' : '#4F4668' },
          ]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>

        {typeof progressPercent === 'number' && (
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(255,255,255,0.72)',
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(8, Math.min(100, progressPercent))}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
        )}

        {children}

        {/* Circular Soft-Glass Arrow CTA */}
        <View
          style={[
            styles.glassArrowBtn,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.18)'
                : 'rgba(255,255,255,0.82)',
              borderColor: isDark
                ? 'rgba(255,255,255,0.28)'
                : 'rgba(255,255,255,0.96)',
            },
          ]}
        >
          <Ionicons
            name="arrow-forward"
            size={17}
            color={isDark ? '#FFFFFF' : '#251D3A'}
          />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 26,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },
  foregroundSlot: {
    position: 'absolute',
    right: 4,
    bottom: 0,
    top: 6,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  foregroundImage: {
    width: '100%',
    height: '100%',
  },
  contentCol: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 7,
    zIndex: 2,
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
    width: '88%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  glassArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#1E1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
