import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';
import { DARK_COLORS, LIGHT_COLORS } from '@/theme/tokens';

interface AppBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function AppBackground({ children, style }: AppBackgroundProps) {
  const { themeProgress, isDark } = useTheme();

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [LIGHT_COLORS.background, DARK_COLORS.background]
    ),
  }));

  const lightOpacity = useAnimatedStyle(() => ({
    opacity: 1 - themeProgress.value,
  }));

  const darkOpacity = useAnimatedStyle(() => ({
    opacity: themeProgress.value,
  }));

  return (
    <Animated.View style={[styles.root, containerStyle, style]}>
      {/* Light mode soft pink-peach atmospheric waves */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, lightOpacity]}>
        <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <LinearGradient id="lightGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFF5F3" />
              <Stop offset="50%" stopColor="#FFF8F4" />
              <Stop offset="100%" stopColor="#FDEEEB" />
            </LinearGradient>
          </Defs>
          <Path d="M0 0 H390 V844 H0 Z" fill="url(#lightGrad)" />
          <Path
            d="M0 110 C95 60, 220 175, 390 95 L390 290 C250 340, 110 230, 0 300 Z"
            fill="#FFE3DC"
            opacity={0.55}
          />
          <Path
            d="M0 440 C130 390, 260 510, 390 430 L390 660 C250 710, 110 590, 0 650 Z"
            fill="#FDE3EC"
            opacity={0.5}
          />
          <Path
            d="M0 710 C120 670, 270 760, 390 700 L390 844 L0 844 Z"
            fill="#FCE8E2"
            opacity={0.65}
          />
        </Svg>
      </Animated.View>

      {/* Dark mode charcoal/forest-green with subtle pink atmospheric waves */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, darkOpacity]}>
        <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <LinearGradient id="darkGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#151B19" />
              <Stop offset="55%" stopColor="#19241F" />
              <Stop offset="100%" stopColor="#131917" />
            </LinearGradient>
          </Defs>
          <Path d="M0 0 H390 V844 H0 Z" fill="url(#darkGrad)" />
          <Path
            d="M0 90 C110 40, 230 170, 390 80 L390 280 C240 330, 110 220, 0 290 Z"
            fill="#FF7D8C"
            opacity={0.07}
          />
          <Path
            d="M0 420 C130 370, 260 490, 390 410 L390 650 C250 700, 110 580, 0 640 Z"
            fill="#2E5940"
            opacity={0.22}
          />
          <Path
            d="M0 700 C120 660, 270 750, 390 690 L390 844 L0 844 Z"
            fill="#FF7557"
            opacity={0.06}
          />
        </Svg>
      </Animated.View>

      <View style={styles.content} accessibilityRole="none" testID={isDark ? 'bg-dark' : 'bg-light'}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
