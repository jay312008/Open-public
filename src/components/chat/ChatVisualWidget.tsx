import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';

export type ChatWidgetType = 'wave' | 'parabola' | 'geometry' | 'calculator' | 'science_diagram';

export interface ChatWidgetSpec {
  type: ChatWidgetType;
  title?: string;
  caption?: string;
  variant?: string; // e.g., 'transverse' | 'longitudinal' | 'triangle' | 'circle' | 'bonding' | 'photosynthesis'
}

export function ChatVisualWidget({ widget }: { widget: ChatWidgetSpec }) {
  switch (widget.type) {
    case 'wave':
      return <WaveBoardWidget title={widget.title} caption={widget.caption} variant={widget.variant} />;
    case 'parabola':
      return <ParabolaBoardWidget title={widget.title} caption={widget.caption} />;
    case 'geometry':
      return <GeometryBoardWidget title={widget.title} caption={widget.caption} variant={widget.variant} />;
    case 'calculator':
      return <MiniCalculatorWidget title={widget.title} variant={widget.variant} />;
    case 'science_diagram':
      return <ScienceDiagramWidget title={widget.title} caption={widget.caption} variant={widget.variant} />;
    default:
      return null;
  }
}

/* 1. INTERACTIVE WAVE BOARD WITH RULER & FREQUENCY/AMPLITUDE CONTROLS */
function WaveBoardWidget({
  title,
  caption,
  variant,
}: {
  title?: string;
  caption?: string;
  variant?: string;
}) {
  const { colors, isDark } = useTheme();
  const [freq, setFreq] = useState(2); // cycles across board
  const [amp, setAmp] = useState(26); // pixel amplitude
  const [mode, setMode] = useState<'transverse' | 'longitudinal'>(
    variant === 'longitudinal' ? 'longitudinal' : 'transverse'
  );

  // Build smooth transverse sine wave SVG path
  const width = 260;
  const midY = 66;
  const startX = 20;
  const endX = 244;
  const span = endX - startX;
  const points: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const x = startX + t * span;
    const y = midY - Math.sin(t * Math.PI * 2 * freq) * amp;
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const wavePath = points.join(' ');
  const wavelengthPx = span / freq;

  // Longitudinal compression vertical bars
  const longBars: number[] = [];
  for (let i = 0; i < 28; i++) {
    const base = startX + (i / 27) * span;
    const shift = Math.sin((i / 27) * Math.PI * 2 * freq) * 6;
    longBars.push(base + shift);
  }

  return (
    <View
      style={[
        styles.boardWrap,
        { backgroundColor: isDark ? '#1A2420' : '#FAF9FF', borderColor: colors.border },
      ]}
    >
      <View style={styles.boardTop}>
        <Text style={[styles.boardTitle, { color: colors.text }]}>
          {title ?? (mode === 'transverse' ? 'Transverse Wave Board' : 'Longitudinal Wave Board')}
        </Text>
        <View style={styles.pillToggleRow}>
          {(['transverse', 'longitudinal'] as const).map((m) => (
            <AnimatedPressable
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.miniPill,
                { backgroundColor: mode === m ? colors.coral : colors.surfaceMuted },
              ]}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: mode === m ? '#FFFFFF' : colors.text }}>
                {m === 'transverse' ? 'Transverse' : 'Longitudinal'}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <Svg width={width} height={138} viewBox={`0 0 ${width} 138`}>
        {/* Ruler bar at top */}
        <Rect x={startX} y={6} width={span} height={14} rx={3} fill={isDark ? '#2A3832' : '#EFEAFD'} />
        {Array.from({ length: 11 }).map((_, idx) => {
          const rx = startX + (idx / 10) * span;
          return (
            <React.Fragment key={idx}>
              <Line
                x1={rx}
                y1={6}
                x2={rx}
                y2={idx % 2 === 0 ? 15 : 11}
                stroke={colors.purple}
                strokeWidth={1.1}
              />
              {idx % 2 === 0 && (
                <SvgText x={rx - 3} y={28} fontSize={8.5} fill={colors.textMuted}>
                  {idx}cm
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {/* Equilibrium center dashed line */}
        <Line
          x1={startX}
          y1={midY}
          x2={endX}
          y2={midY}
          stroke={colors.textMuted}
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {mode === 'transverse' ? (
          <>
            <Path d={wavePath} fill="none" stroke="#7C3AED" strokeWidth={2.8} strokeLinecap="round" />
            {/* Amplitude arrow */}
            <Line
              x1={startX + wavelengthPx * 0.25}
              y1={midY}
              x2={startX + wavelengthPx * 0.25}
              y2={midY - amp}
              stroke="#FF6B4A"
              strokeWidth={2}
            />
            <Circle cx={startX + wavelengthPx * 0.25} cy={midY - amp} r={3.5} fill="#FF6B4A" />
            <SvgText
              x={startX + wavelengthPx * 0.25 + 5}
              y={midY - amp / 2}
              fontSize={9.5}
              fontWeight="bold"
              fill="#FF6B4A"
            >
              A
            </SvgText>
            {/* Wavelength λ bracket */}
            <Line
              x1={startX}
              y1={114}
              x2={Math.min(endX, startX + wavelengthPx)}
              y2={114}
              stroke="#16A34A"
              strokeWidth={2}
            />
            <SvgText
              x={startX + Math.min(span, wavelengthPx) / 2 - 14}
              y={128}
              fontSize={10}
              fontWeight="bold"
              fill="#16A34A"
            >
              λ (wavelength)
            </SvgText>
          </>
        ) : (
          <>
            {longBars.map((bx, i) => (
              <Line
                key={i}
                x1={bx}
                y1={42}
                x2={bx}
                y2={94}
                stroke="#2563EB"
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}
            <SvgText x={startX + 10} y={118} fontSize={9.5} fontWeight="bold" fill="#2563EB">
              Compression (dense)  ↔  Rarefaction (spread)
            </SvgText>
          </>
        )}
      </Svg>

      {/* Interactive Local Controls */}
      <View style={styles.controlBar}>
        <Text style={[styles.ctrlText, { color: colors.textSecondary }]}>Freq: {freq} Hz</Text>
        <AnimatedPressable
          onPress={() => setFreq((f) => Math.max(1, f - 1))}
          style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={{ fontWeight: '900', color: colors.text }}>-</Text>
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => setFreq((f) => Math.min(4, f + 1))}
          style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={{ fontWeight: '900', color: colors.text }}>+</Text>
        </AnimatedPressable>

        {mode === 'transverse' && (
          <>
            <Text style={[styles.ctrlText, { color: colors.textSecondary, marginLeft: 8 }]}>
              Amp: {amp}
            </Text>
            <AnimatedPressable
              onPress={() => setAmp((a) => Math.max(12, a - 6))}
              style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}
            >
              <Text style={{ fontWeight: '900', color: colors.text }}>-</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setAmp((a) => Math.min(34, a + 6))}
              style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}
            >
              <Text style={{ fontWeight: '900', color: colors.text }}>+</Text>
            </AnimatedPressable>
          </>
        )}
      </View>

      {caption && <Text style={[styles.caption, { color: colors.purple }]}>{caption}</Text>}
    </View>
  );
}

/* 2. INTERACTIVE PARABOLA / FUNCTION GRAPH BOARD */
function ParabolaBoardWidget({ title, caption }: { title?: string; caption?: string }) {
  const { colors, isDark } = useTheme();
  const [aVal, setAVal] = useState<number>(1);

  // Build parabola y = a*(x^2) centered at (130, 82)
  const pts: string[] = [];
  for (let i = -30; i <= 30; i++) {
    const xNorm = i / 10; // -3..3
    const px = 130 + xNorm * 28;
    const py = 84 - aVal * (xNorm * xNorm) * 7.5;
    if (py >= 10 && py <= 118) {
      pts.push(`${pts.length === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
  }

  return (
    <View
      style={[
        styles.boardWrap,
        { backgroundColor: isDark ? '#1A2420' : '#FAF9FF', borderColor: colors.border },
      ]}
    >
      <View style={styles.boardTop}>
        <Text style={[styles.boardTitle, { color: colors.text }]}>
          {title ?? `Graph of y = ${aVal === 1 ? '' : aVal === -1 ? '-' : aVal}x²`}
        </Text>
        <View style={styles.pillToggleRow}>
          {([1, 2, -1] as const).map((val) => (
            <AnimatedPressable
              key={val}
              onPress={() => setAVal(val)}
              style={[
                styles.miniPill,
                { backgroundColor: aVal === val ? colors.purple : colors.surfaceMuted },
              ]}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: aVal === val ? '#FFFFFF' : colors.text }}>
                a={val}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <Svg width={260} height={124} viewBox="0 0 260 124">
        <Line x1={20} y1={84} x2={244} y2={84} stroke={colors.textMuted} strokeWidth={1.5} />
        <Line x1={130} y1={12} x2={130} y2={116} stroke={colors.textMuted} strokeWidth={1.5} />
        <Polygon points="244,84 237,80 237,88" fill={colors.textMuted} />
        <Polygon points="130,10 126,17 134,17" fill={colors.textMuted} />
        <Path d={pts.join(' ')} fill="none" stroke="#7C3AED" strokeWidth={2.8} strokeLinecap="round" />
        <Circle cx={130} cy={84} r={4} fill="#FF6B4A" />
        <SvgText x={246} y={87} fontSize={11} fontWeight="bold" fill={colors.textSecondary}>
          x
        </SvgText>
        <SvgText x={136} y={18} fontSize={11} fontWeight="bold" fill={colors.textSecondary}>
          y
        </SvgText>
      </Svg>

      <Text style={[styles.caption, { color: colors.purple }]}>
        {caption ?? (aVal > 0 ? 'a > 0: opens upward (minimum vertex)' : 'a < 0: opens downward (maximum vertex)')}
      </Text>
    </View>
  );
}

/* 3. GEOMETRY BOARD WITH RULER MEASUREMENTS */
function GeometryBoardWidget({
  title,
  caption,
  variant,
}: {
  title?: string;
  caption?: string;
  variant?: string;
}) {
  const { colors, isDark } = useTheme();
  const isCircle = variant === 'circle';
  return (
    <View
      style={[
        styles.boardWrap,
        { backgroundColor: isDark ? '#1A2420' : '#F8FBFF', borderColor: colors.border },
      ]}
    >
      <Text style={[styles.boardTitle, { color: colors.text }]}>
        {title ?? (isCircle ? 'Circle Geometry Board' : 'Right Triangle · Pythagoras Board')}
      </Text>
      <Svg width={250} height={122} viewBox="0 0 250 122">
        {isCircle ? (
          <>
            <Circle cx={125} cy={61} r={44} stroke="#2563EB" strokeWidth={2.6} fill="rgba(59,130,246,0.1)" />
            <Line x1={125} y1={61} x2={169} y2={61} stroke="#FF6B4A" strokeWidth={2.2} />
            <Circle cx={125} cy={61} r={3.5} fill="#FF6B4A" />
            <SvgText x={140} y={55} fontSize={11} fontWeight="bold" fill="#FF6B4A">
              r
            </SvgText>
            <SvgText x={60} y={117} fontSize={10.5} fontWeight="bold" fill={colors.textSecondary}>
              Area = πr²   |   C = 2πr
            </SvgText>
          </>
        ) : (
          <>
            <Polygon
              points="55,98 185,98 55,24"
              fill="rgba(124,92,250,0.12)"
              stroke="#7C3AED"
              strokeWidth={2.5}
            />
            <Rect x={55} y={84} width={14} height={14} fill="none" stroke="#FF6B4A" strokeWidth={1.8} />
            <SvgText x={36} y={64} fontSize={11} fontWeight="bold" fill="#2563EB">
              a = 3
            </SvgText>
            <SvgText x={112} y={114} fontSize={11} fontWeight="bold" fill="#16A34A">
              b = 4
            </SvgText>
            <SvgText x={128} y={54} fontSize={11} fontWeight="bold" fill="#FF6B4A">
              c = 5
            </SvgText>
          </>
        )}
      </Svg>
      <Text style={[styles.caption, { color: colors.purple }]}>
        {caption ?? (isCircle ? 'Radius connects center to circumference' : 'a² + b² = c²  ⇒  3² + 4² = 5²')}
      </Text>
    </View>
  );
}

/* 4. INTERACTIVE MINI FORMULA CALCULATOR */
function MiniCalculatorWidget({ title, variant }: { title?: string; variant?: string }) {
  const { colors, isDark } = useTheme();
  const isWave = variant === 'wave';
  const [valA, setValA] = useState(isWave ? '50' : '1');
  const [valB, setValB] = useState(isWave ? '2' : '-5');
  const [valC, setValC] = useState('6');

  let resultText = '';
  if (isWave) {
    const f = parseFloat(valA) || 0;
    const lam = parseFloat(valB) || 0;
    resultText = `Wave speed v = f × λ = ${(f * lam).toFixed(2)} m/s`;
  } else {
    const a = parseFloat(valA) || 0;
    const b = parseFloat(valB) || 0;
    const c = parseFloat(valC) || 0;
    const disc = b * b - 4 * a * c;
    if (a === 0) {
      resultText = 'Set a ≠ 0 for a quadratic equation';
    } else if (disc < 0) {
      resultText = `Δ = ${disc.toFixed(2)} (< 0 → No real roots)`;
    } else {
      const r1 = (-b + Math.sqrt(disc)) / (2 * a);
      const r2 = (-b - Math.sqrt(disc)) / (2 * a);
      resultText = `Δ = ${disc.toFixed(1)}  ⇒  x₁ = ${r1.toFixed(2)},  x₂ = ${r2.toFixed(2)}`;
    }
  }

  return (
    <View
      style={[
        styles.boardWrap,
        { backgroundColor: isDark ? '#1A2420' : '#F4FBF6', borderColor: colors.border },
      ]}
    >
      <View style={styles.boardTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calculator" size={15} color={colors.brandGreen} />
          <Text style={[styles.boardTitle, { color: colors.text }]}>
            {title ?? (isWave ? 'Wave Speed Calculator (v = f·λ)' : 'Quadratic Root Calculator')}
          </Text>
        </View>
      </View>

      <View style={styles.calcRow}>
        <View style={styles.calcField}>
          <Text style={[styles.calcLbl, { color: colors.textSecondary }]}>{isWave ? 'f (Hz)' : 'a'}</Text>
          <TextInput
            value={valA}
            onChangeText={setValA}
            keyboardType="numeric"
            style={[styles.calcInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          />
        </View>
        <View style={styles.calcField}>
          <Text style={[styles.calcLbl, { color: colors.textSecondary }]}>{isWave ? 'λ (m)' : 'b'}</Text>
          <TextInput
            value={valB}
            onChangeText={setValB}
            keyboardType="numeric"
            style={[styles.calcInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          />
        </View>
        {!isWave && (
          <View style={styles.calcField}>
            <Text style={[styles.calcLbl, { color: colors.textSecondary }]}>c</Text>
            <TextInput
              value={valC}
              onChangeText={setValC}
              keyboardType="numeric"
              style={[styles.calcInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            />
          </View>
        )}
      </View>

      <View style={[styles.calcResult, { backgroundColor: isDark ? 'rgba(34,197,94,0.18)' : '#DFF5E5' }]}>
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.mintDark }}>{resultText}</Text>
      </View>
    </View>
  );
}

/* 5. LABELED SCIENCE DIAGRAM (Bonding / Atom / Cell) */
function ScienceDiagramWidget({
  title,
  caption,
  variant,
}: {
  title?: string;
  caption?: string;
  variant?: string;
}) {
  const { colors, isDark } = useTheme();
  const isBond = variant !== 'photosynthesis';
  return (
    <View
      style={[
        styles.boardWrap,
        { backgroundColor: isDark ? '#1A2420' : '#FFFBF5', borderColor: colors.border },
      ]}
    >
      <Text style={[styles.boardTitle, { color: colors.text }]}>
        {title ?? (isBond ? 'Covalent Bonding Diagram (H₂O)' : 'Photosynthesis Energy Flow')}
      </Text>
      <Svg width={250} height={106} viewBox="0 0 250 106">
        {isBond ? (
          <>
            <Circle cx={125} cy={52} r={24} fill="#DBEAFE" stroke="#2563EB" strokeWidth={2.2} />
            <SvgText x={119} y={57} fontSize={14} fontWeight="bold" fill="#1D4ED8">
              O
            </SvgText>
            <Circle cx={62} cy={66} r={16} fill="#DCFCE7" stroke="#16A34A" strokeWidth={2} />
            <SvgText x={57} y={71} fontSize={12} fontWeight="bold" fill="#15803D">
              H
            </SvgText>
            <Circle cx={188} cy={66} r={16} fill="#DCFCE7" stroke="#16A34A" strokeWidth={2} />
            <SvgText x={183} y={71} fontSize={12} fontWeight="bold" fill="#15803D">
              H
            </SvgText>
            <Line x1={78} y1={62} x2={101} y2={56} stroke="#7C3AED" strokeWidth={2.5} />
            <Line x1={149} y1={56} x2={172} y2={62} stroke="#7C3AED" strokeWidth={2.5} />
          </>
        ) : (
          <>
            <Rect x={14} y={32} width={66} height={38} rx={10} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={1.8} />
            <SvgText x={24} y={55} fontSize={10} fontWeight="bold" fill="#B45309">
              Sunlight
            </SvgText>
            <Line x1={80} y1={51} x2={100} y2={51} stroke="#16A34A" strokeWidth={2} />
            <Rect x={100} y={24} width={60} height={54} rx={14} fill="#DCFCE7" stroke="#16A34A" strokeWidth={2} />
            <SvgText x={109} y={55} fontSize={10} fontWeight="bold" fill="#15803D">
              Leaf
            </SvgText>
            <Line x1={160} y1={51} x2={178} y2={51} stroke="#2563EB" strokeWidth={2} />
            <Rect x={178} y={30} width={64} height={42} rx={10} fill="#DBEAFE" stroke="#2563EB" strokeWidth={1.8} />
            <SvgText x={184} y={55} fontSize={9.5} fontWeight="bold" fill="#1D4ED8">
              Glucose+O₂
            </SvgText>
          </>
        )}
      </Svg>
      <Text style={[styles.caption, { color: colors.purple }]}>
        {caption ?? (isBond ? 'Shared electron pairs stabilize H₂O' : '6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  boardWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
    gap: 8,
    alignItems: 'center',
  },
  boardTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  boardTitle: { fontSize: 12.5, fontWeight: '800' },
  pillToggleRow: { flexDirection: 'row', gap: 5 },
  miniPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  ctrlText: { fontSize: 11.5, fontWeight: '700' },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  calcRow: { flexDirection: 'row', gap: 8, width: '100%' },
  calcField: { flex: 1, gap: 3 },
  calcLbl: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  calcInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 13.5,
    fontWeight: '700',
  },
  calcResult: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
