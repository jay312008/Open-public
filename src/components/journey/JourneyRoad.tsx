import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { JourneyLevelNode, JourneyLessonNode } from '@/types/models';
import { useTheme } from '@/theme/ThemeContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';

interface JourneyRoadProps {
  levels: JourneyLevelNode[];
  onSelectLevel: (level: JourneyLevelNode) => void;
  onSelectLessonStar: (level: JourneyLevelNode, lesson: JourneyLessonNode, locked: boolean) => void;
  onGenerateJourney: () => void;
}

interface Point {
  x: number;
  y: number;
}

function cubicBezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

export function JourneyRoad({
  levels,
  onSelectLevel,
  onSelectLessonStar,
  onGenerateJourney,
}: JourneyRoadProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const [measuredWidth, setMeasuredWidth] = React.useState(0);
  const canvasWidth =
    measuredWidth > 0 ? measuredWidth : Math.max(280, Math.min(screenWidth - 32, 358));

  const isEmpty = levels.length === 0;
  const displayCount = isEmpty ? 3 : levels.length;
  const segmentHeight = 165;
  const topPadding = 130;
  const bottomPadding = 120;
  const totalHeight = topPadding + displayCount * segmentHeight + bottomPadding;

  const geometry = useMemo(() => {
    const leftX = canvasWidth * 0.27;
    const rightX = canvasWidth * 0.73;
    const centerX = canvasWidth * 0.5;

    // Summit at top, Level 1 at bottom so students climb UP toward the mountain flag!
    const anchors: Point[] = [];
    for (let i = 0; i < displayCount; i++) {
      const y = totalHeight - bottomPadding - i * segmentHeight;
      const x = i % 2 === 0 ? leftX : rightX;
      anchors.push({ x, y });
    }
    const summit: Point = { x: centerX, y: 78 };

    // Build smooth S-curve segments from Level 1 -> Level N -> Summit
    const allNodes = [...anchors, summit];
    let fullPath = `M ${allNodes[0].x} ${allNodes[0].y}`;
    const segments: { p0: Point; p1: Point; p2: Point; p3: Point }[] = [];

    for (let i = 0; i < allNodes.length - 1; i++) {
      const p0 = allNodes[i];
      const p3 = allNodes[i + 1];
      const midY = (p0.y + p3.y) / 2;
      const p1 = { x: p0.x, y: midY };
      const p2 = { x: p3.x, y: midY };
      segments.push({ p0, p1, p2, p3 });
      fullPath += ` C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
    }

    return { anchors, summit, fullPath, segments, centerX };
  }, [canvasWidth, displayCount, totalHeight]);

  // Compute completed road progress path
  const completedLessonsFlat = levels.flatMap((l) => l.lessons);
  const completedRatio =
    completedLessonsFlat.length > 0
      ? completedLessonsFlat.filter((l) => l.completed).length / completedLessonsFlat.length
      : 0;

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - measuredWidth) > 1) setMeasuredWidth(w);
      }}
      style={[styles.container, { width: '100%', maxWidth: 460, height: totalHeight }]}
    >
      <Svg
        width="100%"
        height={totalHeight}
        viewBox={`0 0 ${canvasWidth} ${totalHeight}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.skyTop} />
            <Stop offset="100%" stopColor={colors.skyBottom} />
          </LinearGradient>
        </Defs>

        {/* Sky */}
        <Rect x={0} y={0} width={canvasWidth} height={190} fill="url(#skyGrad)" />

        {/* Day clouds or Night moon + stars */}
        {isDark ? (
          <>
            <Circle cx={canvasWidth - 52} cy={46} r={16} fill="#FEF3C7" />
            <Circle cx={canvasWidth - 45} cy={42} r={14} fill={colors.skyTop} />
            <Circle cx={48} cy={38} r={2} fill="#FFFFFF" opacity={0.8} />
            <Circle cx={112} cy={26} r={1.8} fill="#FFFFFF" opacity={0.7} />
            <Circle cx={185} cy={44} r={2.2} fill="#FEF3C7" opacity={0.85} />
            <Circle cx={255} cy={28} r={1.6} fill="#FFFFFF" opacity={0.65} />
          </>
        ) : (
          <>
            <Circle cx={58} cy={48} r={18} fill="#FFFFFF" opacity={0.85} />
            <Circle cx={76} cy={52} r={14} fill="#FFFFFF" opacity={0.85} />
            <Circle cx={canvasWidth - 68} cy={44} r={16} fill="#FFFFFF" opacity={0.8} />
            <Circle cx={canvasWidth - 50} cy={48} r={13} fill="#FFFFFF" opacity={0.8} />
          </>
        )}

        {/* Mountain Summit with Orange/Coral Flag */}
        <Polygon
          points={`${geometry.centerX - 88},175 ${geometry.centerX},48 ${geometry.centerX + 88},175`}
          fill={colors.hillBack}
        />
        <Polygon
          points={`${geometry.centerX - 24},82 ${geometry.centerX},48 ${geometry.centerX + 24},82 ${geometry.centerX + 8},75 ${geometry.centerX},84 ${geometry.centerX - 10},75`}
          fill="#FFFFFF"
          opacity={isDark ? 0.45 : 0.85}
        />
        <Line
          x1={geometry.centerX}
          y1={48}
          x2={geometry.centerX}
          y2={20}
          stroke="#5A4636"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Polygon
          points={`${geometry.centerX},20 ${geometry.centerX + 26},28 ${geometry.centerX},37`}
          fill="#FF6B4A"
        />

        {/* Rolling Green Hills */}
        <Path
          d={`M0 155 Q${canvasWidth * 0.25} 115 ${canvasWidth * 0.5} 152 T${canvasWidth} 148 L${canvasWidth} ${totalHeight} L0 ${totalHeight} Z`}
          fill={colors.hillMid}
        />
        <Path
          d={`M0 240 Q${canvasWidth * 0.35} 195 ${canvasWidth * 0.7} 235 T${canvasWidth} 225 L${canvasWidth} ${totalHeight} L0 ${totalHeight} Z`}
          fill={colors.hillFront}
          opacity={0.7}
        />

        {/* Road Outer Border */}
        <Path
          d={geometry.fullPath}
          stroke={colors.roadBorder}
          strokeWidth={34}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={isEmpty ? '14 10' : undefined}
        />
        {/* Road Cream Surface */}
        <Path
          d={geometry.fullPath}
          stroke={colors.roadFill}
          strokeWidth={26}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={isEmpty ? '14 10' : undefined}
        />
        {/* Completed Progress Highlight */}
        {!isEmpty && completedRatio > 0 && (
          <Path
            d={geometry.fullPath}
            stroke={colors.roadCompleted}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            opacity={0.75}
            strokeDasharray={`${Math.max(40, completedRatio * 900)} 2000`}
          />
        )}
      </Svg>

      {/* First-Time Empty State Overlay */}
      {isEmpty ? (
        <View style={styles.emptyOverlay}>
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.emptyBadge, { backgroundColor: colors.surfaceMint }]}>
              <Ionicons name="compass" size={26} color={colors.mintDark} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Your Study Adventure Awaits
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Build a personalized winding road with levels, lesson stars, and daily targets for
              your exam or learning goal.
            </Text>
            <AnimatedPressable
              onPress={onGenerateJourney}
              style={[styles.generateBtn, { backgroundColor: colors.coral }]}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>Generate Your Journey</Text>
            </AnimatedPressable>
          </View>
        </View>
      ) : (
        <>
          {/* Lesson Stars along each segment */}
          {levels.map((level, lvlIdx) => {
            const seg = geometry.segments[lvlIdx];
            if (!seg) return null;
            const prevLevelDone =
              lvlIdx === 0 ||
              levels[lvlIdx - 1].lessons.every((l) => l.completed);

            return level.lessons.map((lesson, starIdx) => {
              const t = (starIdx + 1) / (level.lessons.length + 1);
              const pt = cubicBezierPoint(seg.p0, seg.p1, seg.p2, seg.p3, t);
              const prevLessonDone =
                starIdx === 0 ? prevLevelDone : level.lessons[starIdx - 1].completed;
              const locked = !prevLessonDone && !lesson.completed;

              return (
                <AnimatedPressable
                  key={lesson.id}
                  onPress={() => onSelectLessonStar(level, lesson, locked)}
                  style={[
                    styles.starNode,
                    {
                      left: pt.x - 15,
                      top: pt.y - 15,
                      backgroundColor: lesson.completed
                        ? colors.starFilled
                        : locked
                        ? colors.surfaceMuted
                        : colors.surface,
                      borderColor: lesson.completed ? '#D97706' : colors.border,
                    },
                  ]}
                  accessibilityLabel={`${lesson.title} star`}
                >
                  <Ionicons
                    name={lesson.completed ? 'star' : locked ? 'lock-closed' : 'star-outline'}
                    size={14}
                    color={lesson.completed ? '#FFFFFF' : locked ? colors.textMuted : colors.coral}
                  />
                </AnimatedPressable>
              );
            });
          })}

          {/* Level Checkpoints & Floating Info Bubbles */}
          {levels.map((level, idx) => {
            const pt = geometry.anchors[idx];
            const doneCount = level.lessons.filter((l) => l.completed).length;
            const totalCount = level.lessons.length;
            const isCompleted = totalCount > 0 && doneCount === totalCount;
            const prevCompleted =
              idx === 0 || levels[idx - 1].lessons.every((l) => l.completed);
            const isCurrent = !isCompleted && prevCompleted;
            const isLocked = !isCompleted && !isCurrent;

            const bubbleOnRight = idx % 2 === 0;
            const bubbleLeft = bubbleOnRight ? pt.x + 34 : Math.max(12, pt.x - 196);

            return (
              <React.Fragment key={level.id}>
                {/* Numbered Level Checkpoint */}
                <AnimatedPressable
                  onPress={() => onSelectLevel(level)}
                  style={[
                    styles.levelCircle,
                    {
                      left: pt.x - 28,
                      top: pt.y - 28,
                      backgroundColor: isCompleted
                        ? colors.mint
                        : isCurrent
                        ? colors.coral
                        : colors.surfaceMuted,
                      borderColor: colors.surface,
                    },
                  ]}
                  accessibilityLabel={`Level ${level.levelNumber}: ${level.topicTitle}`}
                >
                  <Text
                    style={[
                      styles.levelNumber,
                      { color: isLocked ? colors.textMuted : '#FFFFFF' },
                    ]}
                  >
                    {level.levelNumber}
                  </Text>
                </AnimatedPressable>

                {/* Floating White Mission Info Bubble */}
                <AnimatedPressable
                  onPress={() => onSelectLevel(level)}
                  style={[
                    styles.infoBubble,
                    {
                      left: bubbleLeft,
                      top: pt.y - 36,
                      backgroundColor: colors.surface,
                      borderColor: isCurrent ? colors.coral : colors.border,
                      shadowColor: colors.shadowColor,
                    },
                  ]}
                >
                  <View style={styles.bubbleTopRow}>
                    <Text style={[styles.bubbleLevelTag, { color: colors.coral }]}>
                      LVL {level.levelNumber} · {level.subjectName}
                    </Text>
                    {isCompleted && (
                      <Ionicons name="checkmark-circle" size={14} color={colors.mint} />
                    )}
                  </View>
                  <Text style={[styles.bubbleTitle, { color: colors.text }]} numberOfLines={1}>
                    {level.topicTitle}
                  </Text>
                  <Text style={[styles.bubbleSub, { color: colors.textSecondary }]}>
                    {doneCount}/{totalCount} lessons · {isLocked ? 'Locked' : isCompleted ? 'Done' : 'Active'}
                  </Text>
                  <View style={[styles.miniTrack, { backgroundColor: colors.surfaceMuted }]}>
                    <View
                      style={[
                        styles.miniFill,
                        {
                          backgroundColor: isCompleted ? colors.mint : colors.coral,
                          width: `${totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%`,
                        },
                      ]}
                    />
                  </View>
                </AnimatedPressable>
              </React.Fragment>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 24,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  emptyBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
    marginTop: 6,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  levelCircle: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  starNode: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  infoBubble: {
    position: 'absolute',
    width: 166,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    gap: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bubbleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleLevelTag: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bubbleTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  bubbleSub: {
    fontSize: 11,
  },
  miniTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 3,
  },
  miniFill: {
    height: '100%',
    borderRadius: 3,
  },
});
