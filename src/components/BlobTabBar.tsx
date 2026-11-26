import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import type { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }
> = {
  index: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  subjects: { label: 'Subjects', icon: 'book-outline', activeIcon: 'book' },
  journey: { label: 'Journey', icon: 'git-network-outline', activeIcon: 'git-network' },
  community: { label: 'Community', icon: 'people-outline', activeIcon: 'people' },
  profile: { label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
};

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export function BlobTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { colors, reducedMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);

  const tabCount = state.routes.length;
  const tabWidth = barWidth > 0 ? barWidth / tabCount : 0;

  const blobX = useSharedValue(0);
  const blobScaleX = useSharedValue(1);
  const blobScaleY = useSharedValue(1);

  useEffect(() => {
    if (tabWidth <= 0) return;
    const targetX = state.index * tabWidth;
    if (reducedMotion) {
      blobX.value = targetX;
      return;
    }
    blobX.value = withSpring(targetX, { damping: 17, stiffness: 210, mass: 0.85 });
    blobScaleX.value = withSequence(
      withTiming(1.22, { duration: 110 }),
      withSpring(1, { damping: 14, stiffness: 220 })
    );
    blobScaleY.value = withSequence(
      withTiming(0.88, { duration: 110 }),
      withSpring(1, { damping: 14, stiffness: 220 })
    );
  }, [state.index, tabWidth, reducedMotion, blobX, blobScaleX, blobScaleY]);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: blobX.value },
      { scaleX: blobScaleX.value },
      { scaleY: blobScaleY.value },
    ],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View
        onLayout={onLayout}
        style={[
          styles.bar,
          {
            backgroundColor: colors.navBackground,
            borderColor: colors.border,
            shadowColor: colors.shadowColor,
          },
        ]}
      >
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.blobContainer,
              { width: tabWidth },
              blobStyle,
            ]}
          >
            <View style={[styles.blobShape, { backgroundColor: colors.navBlob }]} />
          </Animated.View>
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const cfg = TAB_CONFIG[route.name] ?? {
            label: route.name,
            icon: 'ellipse-outline' as const,
            activeIcon: 'ellipse' as const,
          };

          const onPress = () => {
            if (!isFocused) {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              navigateToTab(route.key);
            }
          };

          return (
            <AnimatedPressable
              key={route.key}
              haptic={false}
              scaleTo={0.94}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={cfg.label}
            >
              <Ionicons
                name={isFocused ? cfg.activeIcon : cfg.icon}
                size={22}
                color={isFocused ? colors.navIconActive : colors.navIconInactive}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? colors.navIconActive : colors.navIconInactive,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {cfg.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 66,
    borderRadius: 28,
    borderWidth: 1,
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  blobContainer: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  blobShape: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 26,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
  },
});
