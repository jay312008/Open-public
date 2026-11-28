import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { evaluateMathExpression } from '@/lib/safeMath';
import {
  ChemistryMoleculeWidget,
  DynamicDataTableWidget,
  ElectronShellSpec,
  InteractivePeriodicTableWidget,
  MoleculeAtom,
  MoleculeBond,
} from './ChemistryAndTableWidgets';

export type ChatWidgetType =
  | 'function_plot'
  | 'canvas_diagram'
  | 'chart'
  | 'wave'
  | 'calculator'
  | 'table'
  | 'periodic_table'
  | 'molecule';

export interface DiagramPrimitive {
  kind: 'line' | 'circle' | 'rect' | 'path' | 'text';
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  d?: string;
  content?: string;
  color?: string;
  fill?: string;
  dashed?: boolean;
}

export interface CalcVariable {
  name: string;
  label: string;
  defaultValue: number;
}

export interface ChatWidgetSpec {
  type: ChatWidgetType;
  title?: string;
  caption?: string;
  // function_plot
  expression?: string;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  points?: { x: number; y: number; label?: string }[];
  // canvas_diagram
  primitives?: DiagramPrimitive[];
  // chart
  labels?: string[];
  values?: number[];
  unit?: string;
  // wave
  variant?: string;
  frequency?: number;
  amplitude?: number;
  // calculator
  formulaExpr?: string;
  resultLabel?: string;
  variables?: CalcVariable[];
  // table (Excel / spreadsheet style)
  headers?: string[];
  rows?: string[][];
  // molecule (Chemistry dot-and-cross shells OR organic structural formula)
  atoms?: MoleculeAtom[];
  bonds?: MoleculeBond[];
  shells?: ElectronShellSpec[];
}

export function ChatVisualWidget({ widget }: { widget: ChatWidgetSpec }) {
  switch (widget.type) {
    case 'function_plot':
      return <DynamicFunctionPlotWidget widget={widget} />;
    case 'canvas_diagram':
      return <DynamicCanvasDiagramWidget widget={widget} />;
    case 'chart':
      return <DynamicBarChartWidget widget={widget} />;
    case 'wave':
      return <DynamicWaveBoardWidget widget={widget} />;
    case 'calculator':
      return <DynamicCalculatorWidget widget={widget} />;
    case 'table':
      return (
        <DynamicDataTableWidget
          title={widget.title}
          headers={widget.headers ?? []}
          rows={widget.rows ?? []}
          caption={widget.caption}
        />
      );
    case 'periodic_table':
      return <InteractivePeriodicTableWidget title={widget.title} caption={widget.caption} />;
    case 'molecule':
      return (
        <ChemistryMoleculeWidget
          title={widget.title}
          atoms={widget.atoms}
          bonds={widget.bonds}
          shells={widget.shells}
          caption={widget.caption}
        />
      );
    default:
      return null;
  }
}

/* 1. DYNAMIC MATH FUNCTION PLOTTER — plots ANY equation (linear, quadratic, trig, cubic, exp, etc.) + live coordinate tracer! */
function DynamicFunctionPlotWidget({ widget }: { widget: ChatWidgetSpec }) {
  const { colors, isDark } = useTheme();
  const initialExpr = (widget.expression ?? '').trim();
  const [expr, setExpr] = useState(initialExpr);
  const [xRange, setXRange] = useState(Math.max(Math.abs(widget.xMin ?? -6), Math.abs(widget.xMax ?? 6), 5));
  const [traceX, setTraceX] = useState<number>(0);

  if (!initialExpr && !expr) return null;

  const W = 320;
  const H = 200;
  const pad = 28;

  const { segments, originX, originY, yMin, yMax, mappedPoints, tracePt, xTicks, yTicks } = useMemo(() => {
    const xMinVal = -xRange;
    const xMaxVal = xRange;
    const samples: { x: number; y: number }[] = [];
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const x = xMinVal + (i / steps) * (xMaxVal - xMinVal);
      const y = evaluateMathExpression(expr, { x });
      samples.push({ x, y });
    }

    const finiteYs = samples.map((s) => s.y).filter((y) => Number.isFinite(y) && Math.abs(y) < 1000);
    const computedMin = finiteYs.length ? Math.min(...finiteYs, -2) : -6;
    const computedMax = finiteYs.length ? Math.max(...finiteYs, 2) : 6;
    const yMinVal = typeof widget.yMin === 'number' ? widget.yMin : Math.max(-25, Math.floor(computedMin - 1));
    const yMaxVal = typeof widget.yMax === 'number' ? widget.yMax : Math.min(25, Math.ceil(computedMax + 1));

    const toPxX = (x: number) => pad + ((x - xMinVal) / (xMaxVal - xMinVal)) * (W - pad * 2);
    const toPxY = (y: number) => H - pad - ((y - yMinVal) / Math.max(0.001, yMaxVal - yMinVal)) * (H - pad * 2);

    const segs: string[] = [];
    let current = '';
    for (const pt of samples) {
      if (!Number.isFinite(pt.y) || pt.y < yMinVal - 5 || pt.y > yMaxVal + 5) {
        if (current) {
          segs.push(current);
          current = '';
        }
        continue;
      }
      const px = toPxX(pt.x);
      const py = toPxY(pt.y);
      current += `${current ? ' L ' : 'M '}${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    if (current) segs.push(current);

    const pts = (widget.points ?? [])
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      .map((p) => ({
        px: toPxX(p.x),
        py: toPxY(p.y),
        label: p.label ?? `(${p.x},${p.y})`,
      }));

    const clampedTraceX = Math.max(xMinVal, Math.min(xMaxVal, traceX));
    const ty = evaluateMathExpression(expr, { x: clampedTraceX });
    const tPt =
      Number.isFinite(ty) && ty >= yMinVal && ty <= yMaxVal
        ? { x: clampedTraceX, y: ty, px: toPxX(clampedTraceX), py: toPxY(ty) }
        : { x: clampedTraceX, y: ty, px: toPxX(clampedTraceX), py: toPxY(0) };

    const xTickStep = xRange <= 6 ? 2 : Math.ceil(xRange / 3);
    const xT: { val: number; px: number }[] = [];
    for (let v = -xRange; v <= xRange; v += xTickStep) {
      if (v !== 0) xT.push({ val: v, px: toPxX(v) });
    }
    const ySpan = yMaxVal - yMinVal;
    const yTickStep = Math.max(1, Math.round(ySpan / 4));
    const yT: { val: number; py: number }[] = [];
    for (let v = Math.ceil(yMinVal / yTickStep) * yTickStep; v <= yMaxVal; v += yTickStep) {
      if (v !== 0) yT.push({ val: v, py: toPxY(v) });
    }

    return {
      segments: segs,
      originX: Math.max(pad, Math.min(W - pad, toPxX(0))),
      originY: Math.max(pad, Math.min(H - pad, toPxY(0))),
      yMin: yMinVal,
      yMax: yMaxVal,
      mappedPoints: pts,
      tracePt: tPt,
      xTicks: xT,
      yTicks: yT,
    };
  }, [expr, xRange, traceX, widget.yMin, widget.yMax, widget.points]);

  return (
    <View
      style={[
        styles.boardWrap,
        { backgroundColor: isDark ? '#1A2420' : '#FAF9FF', borderColor: colors.border },
      ]}
    >
      <View style={styles.boardTop}>
        <Text style={[styles.boardTitle, { color: colors.text }]} numberOfLines={1}>
          {widget.title ?? `Graph of y = ${expr}`}
        </Text>
        <View style={styles.pillToggleRow}>
          <AnimatedPressable
            onPress={() => setXRange((r) => Math.max(2, r - 2))}
            style={[styles.miniPill, { backgroundColor: colors.surfaceMuted }]}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text }}>Zoom +</Text>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => setXRange((r) => Math.min(20, r + 2))}
            style={[styles.miniPill, { backgroundColor: colors.surfaceMuted }]}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text }}>Zoom -</Text>
          </AnimatedPressable>
        </View>
      </View>

      {/* Editable live equation bar so student can type ANY equation and watch it redraw */}
      <View
        style={[
          styles.eqInputRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.purple }}>y =</Text>
        <TextInput
          value={expr}
          onChangeText={setExpr}
          placeholder="e.g. sin(x), 2*x+3, x^3-2*x"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.eqInput, { color: colors.text }]}
        />
      </View>

      <Svg width="100%" height={200} viewBox={`0 0 ${W} ${H}`}>
        {/* Numbered grid lines */}
        {xTicks.map((t) => (
          <Line
            key={`gx-${t.val}`}
            x1={t.px}
            y1={pad}
            x2={t.px}
            y2={H - pad}
            stroke={colors.border}
            strokeWidth={0.8}
            strokeDasharray="3,3"
          />
        ))}
        {yTicks.map((t) => (
          <Line
            key={`gy-${t.val}`}
            x1={pad}
            y1={t.py}
            x2={W - pad}
            y2={t.py}
            stroke={colors.border}
            strokeWidth={0.8}
            strokeDasharray="3,3"
          />
        ))}

        {/* X & Y Axes */}
        <Line x1={pad} y1={originY} x2={W - pad} y2={originY} stroke={colors.textMuted} strokeWidth={1.6} />
        <Line x1={originX} y1={pad} x2={originX} y2={H - pad} stroke={colors.textMuted} strokeWidth={1.6} />
        <Polygon points={`${W - pad},${originY} ${W - pad - 6},${originY - 3.5} ${W - pad - 6},${originY + 3.5}`} fill={colors.textMuted} />
        <Polygon points={`${originX},${pad} ${originX - 3.5},${pad + 6} ${originX + 3.5},${pad + 6}`} fill={colors.textMuted} />

        {/* Numbered Axis Ticks */}
        {xTicks.map((t) => (
          <SvgText
            key={`tx-${t.val}`}
            x={t.px}
            y={Math.min(H - 8, originY + 13)}
            fontSize={9}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {t.val}
          </SvgText>
        ))}
        {yTicks.map((t) => (
          <SvgText
            key={`ty-${t.val}`}
            x={Math.max(12, originX - 6)}
            y={t.py + 3}
            fontSize={9}
            fill={colors.textMuted}
            textAnchor="end"
          >
            {t.val}
          </SvgText>
        ))}

        {/* Dynamic Function Curve */}
        {segments.map((d, idx) => (
          <Path
            key={idx}
            d={d}
            fill="none"
            stroke="#7C3AED"
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Key Highlighted Points */}
        {mappedPoints.map((pt, i) => (
          <React.Fragment key={i}>
            <Circle cx={pt.px} cy={pt.py} r={4} fill="#16A34A" />
            <SvgText x={pt.px + 5} y={pt.py - 5} fontSize={9} fontWeight="bold" fill="#16A34A">
              {pt.label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Live Interactive Tracer Dot */}
        {Number.isFinite(tracePt.y) && (
          <>
            <Line
              x1={tracePt.px}
              y1={originY}
              x2={tracePt.px}
              y2={tracePt.py}
              stroke="#FF6B4A"
              strokeWidth={1.2}
              strokeDasharray="3,3"
            />
            <Circle cx={tracePt.px} cy={tracePt.py} r={5.5} fill="#FF6B4A" stroke="#FFFFFF" strokeWidth={1.8} />
          </>
        )}

        <SvgText x={W - pad + 4} y={originY + 3} fontSize={10} fontWeight="bold" fill={colors.textSecondary}>
          x
        </SvgText>
        <SvgText x={originX + 5} y={pad + 4} fontSize={10} fontWeight="bold" fill={colors.textSecondary}>
          y
        </SvgText>
      </Svg>

      {/* Interactive Point Tracer Bar */}
      <View style={styles.boardTop}>
        <AnimatedPressable
          onPress={() => setTraceX((v) => Math.max(-xRange, Number((v - 0.5).toFixed(2))))}
          style={[styles.miniPill, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.text }}>← Trace</Text>
        </AnimatedPressable>
        <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.coral }}>
          x = {tracePt.x.toFixed(1)}, y = {Number.isFinite(tracePt.y) ? tracePt.y.toFixed(2) : 'undef'}
        </Text>
        <AnimatedPressable
          onPress={() => setTraceX((v) => Math.min(xRange, Number((v + 0.5).toFixed(2))))}
          style={[styles.miniPill, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.text }}>Trace →</Text>
        </AnimatedPressable>
      </View>

      <Text style={[styles.caption, { color: colors.purple }]}>
        {widget.caption ?? `Range x ∈ [-${xRange}, ${xRange}], y ∈ [${yMin}, ${yMax}]`}
      </Text>
    </View>
  );
}

/* 2. DYNAMIC VECTOR CANVAS DIAGRAM — AI draws custom shapes, arrows, molecules, forces, circuits, geometry! */
function DynamicCanvasDiagramWidget({ widget }: { widget: ChatWidgetSpec }) {
  const { colors, isDark } = useTheme();
  const primitives = widget.primitives ?? [];

  return (
    <View
      style={[
        styles.boardWrap,
        { backgroundColor: isDark ? '#1A2420' : '#F8FBFF', borderColor: colors.border },
      ]}
    >
      {widget.title && <Text style={[styles.boardTitle, { color: colors.text }]}>{widget.title}</Text>}
      <Svg width={264} height={150} viewBox="0 0 264 150">
        {primitives.map((p, idx) => {
          const stroke = p.color || '#7C3AED';
          if (p.kind === 'line') {
            return (
              <Line
                key={idx}
                x1={p.x1 ?? 0}
                y1={p.y1 ?? 0}
                x2={p.x2 ?? 100}
                y2={p.y2 ?? 100}
                stroke={stroke}
                strokeWidth={2.2}
                strokeDasharray={p.dashed ? '4,4' : undefined}
                strokeLinecap="round"
              />
            );
          }
          if (p.kind === 'circle') {
            return (
              <Circle
                key={idx}
                cx={p.cx ?? 132}
                cy={p.cy ?? 75}
                r={p.r ?? 20}
                stroke={stroke}
                strokeWidth={2.2}
                fill={p.fill ?? 'rgba(124,92,250,0.12)'}
              />
            );
          }
          if (p.kind === 'rect') {
            return (
              <Rect
                key={idx}
                x={p.x ?? 40}
                y={p.y ?? 40}
                width={p.w ?? 60}
                height={p.h ?? 36}
                rx={8}
                stroke={stroke}
                strokeWidth={2}
                fill={p.fill ?? 'rgba(59,130,246,0.12)'}
              />
            );
          }
          if (p.kind === 'path' && p.d) {
            return (
              <Path
                key={idx}
                d={p.d}
                stroke={stroke}
                strokeWidth={2.4}
                fill={p.fill ?? 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }
          if (p.kind === 'text' && p.content) {
            return (
              <SvgText
                key={idx}
                x={p.x ?? 20}
                y={p.y ?? 20}
                fontSize={10.5}
                fontWeight="bold"
                fill={p.color || colors.text}
              >
                {p.content}
              </SvgText>
            );
          }
          return null;
        })}
      </Svg>
      {widget.caption && <Text style={[styles.caption, { color: colors.purple }]}>{widget.caption}</Text>}
    </View>
  );
}

/* 3. DYNAMIC BAR CHART */
function DynamicBarChartWidget({ widget }: { widget: ChatWidgetSpec }) {
  const { colors, isDark } = useTheme();
  const labels = widget.labels ?? ['A', 'B', 'C', 'D'];
  const values = widget.values ?? [40, 75, 55, 90];
  const maxVal = Math.max(...values, 1);
  const barColors = ['#7C3AED', '#FF6B4A', '#16A34A', '#2563EB', '#F59E0B'];

  return (
    <View
      style={[
        styles.boardWrap,
        { backgroundColor: isDark ? '#1A2420' : '#FAF9FF', borderColor: colors.border },
      ]}
    >
      {widget.title && <Text style={[styles.boardTitle, { color: colors.text }]}>{widget.title}</Text>}
      <View style={styles.barChartArea}>
        {values.map((v, i) => {
          const pct = Math.max(8, Math.round((v / maxVal) * 100));
          return (
            <View key={i} style={styles.barCol}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text }}>
                {v}
                {widget.unit ? widget.unit : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${pct}%`, backgroundColor: barColors[i % barColors.length] },
                  ]}
                />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }} numberOfLines={1}>
                {labels[i] ?? `${i + 1}`}
              </Text>
            </View>
          );
        })}
      </View>
      {widget.caption && <Text style={[styles.caption, { color: colors.purple }]}>{widget.caption}</Text>}
    </View>
  );
}

/* 4. DYNAMIC INTERACTIVE WAVE BOARD WITH RULER */
function DynamicWaveBoardWidget({ widget }: { widget: ChatWidgetSpec }) {
  const { colors, isDark } = useTheme();
  const [freq, setFreq] = useState(widget.frequency ?? 2);
  const [amp, setAmp] = useState(widget.amplitude ?? 26);
  const [mode, setMode] = useState<'transverse' | 'longitudinal'>(
    widget.variant === 'longitudinal' ? 'longitudinal' : 'transverse'
  );

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
  const wavelengthPx = span / Math.max(0.5, freq);

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
          {widget.title ?? (mode === 'transverse' ? 'Transverse Wave Board' : 'Longitudinal Wave Board')}
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
            <Path d={points.join(' ')} fill="none" stroke="#7C3AED" strokeWidth={2.8} strokeLinecap="round" />
            <Line
              x1={startX + wavelengthPx * 0.25}
              y1={midY}
              x2={startX + wavelengthPx * 0.25}
              y2={midY - amp}
              stroke="#FF6B4A"
              strokeWidth={2}
            />
            <Circle cx={startX + wavelengthPx * 0.25} cy={midY - amp} r={3.5} fill="#FF6B4A" />
            <SvgText x={startX + wavelengthPx * 0.25 + 5} y={midY - amp / 2} fontSize={9.5} fontWeight="bold" fill="#FF6B4A">
              A
            </SvgText>
            <Line x1={startX} y1={114} x2={Math.min(endX, startX + wavelengthPx)} y2={114} stroke="#16A34A" strokeWidth={2} />
            <SvgText x={startX + Math.min(span, wavelengthPx) / 2 - 14} y={128} fontSize={10} fontWeight="bold" fill="#16A34A">
              λ (wavelength)
            </SvgText>
          </>
        ) : (
          <>
            {longBars.map((bx, i) => (
              <Line key={i} x1={bx} y1={42} x2={bx} y2={94} stroke="#2563EB" strokeWidth={2} strokeLinecap="round" />
            ))}
            <SvgText x={startX + 10} y={118} fontSize={9.5} fontWeight="bold" fill="#2563EB">
              Compression (dense) ↔ Rarefaction (spread)
            </SvgText>
          </>
        )}
      </Svg>

      <View style={styles.controlBar}>
        <Text style={[styles.ctrlText, { color: colors.textSecondary }]}>Freq: {freq} Hz</Text>
        <AnimatedPressable onPress={() => setFreq((f) => Math.max(1, f - 1))} style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={{ fontWeight: '900', color: colors.text }}>-</Text>
        </AnimatedPressable>
        <AnimatedPressable onPress={() => setFreq((f) => Math.min(5, f + 1))} style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={{ fontWeight: '900', color: colors.text }}>+</Text>
        </AnimatedPressable>
        {mode === 'transverse' && (
          <>
            <Text style={[styles.ctrlText, { color: colors.textSecondary, marginLeft: 8 }]}>Amp: {amp}</Text>
            <AnimatedPressable onPress={() => setAmp((a) => Math.max(10, a - 6))} style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={{ fontWeight: '900', color: colors.text }}>-</Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={() => setAmp((a) => Math.min(36, a + 6))} style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={{ fontWeight: '900', color: colors.text }}>+</Text>
            </AnimatedPressable>
          </>
        )}
      </View>

      {widget.caption && <Text style={[styles.caption, { color: colors.purple }]}>{widget.caption}</Text>}
    </View>
  );
}

/* 5. DYNAMIC FORMULA CALCULATOR — works for ANY formula the AI provides! */
function DynamicCalculatorWidget({ widget }: { widget: ChatWidgetSpec }) {
  const { colors, isDark } = useTheme();
  const variables: CalcVariable[] = widget.variables?.length
    ? widget.variables
    : widget.variant === 'wave'
    ? [
        { name: 'f', label: 'Freq f (Hz)', defaultValue: 50 },
        { name: 'l', label: 'λ (m)', defaultValue: 2 },
      ]
    : [
        { name: 'a', label: 'a', defaultValue: 1 },
        { name: 'b', label: 'b', defaultValue: -5 },
        { name: 'c', label: 'c', defaultValue: 6 },
      ];

  const formulaExpr =
    widget.formulaExpr ?? (widget.variant === 'wave' ? 'f * l' : 'b^2 - 4*a*c');

  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((v) => [v.name, String(v.defaultValue)]))
  );

  const numericVars: Record<string, number> = {};
  for (const v of variables) {
    numericVars[v.name] = parseFloat(vals[v.name]) || 0;
  }
  const computed = evaluateMathExpression(formulaExpr, numericVars);

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
            {widget.title ?? 'Interactive Formula Calculator'}
          </Text>
        </View>
      </View>

      <View style={styles.calcRow}>
        {variables.map((v) => (
          <View key={v.name} style={styles.calcField}>
            <Text style={[styles.calcLbl, { color: colors.textSecondary }]}>{v.label}</Text>
            <TextInput
              value={vals[v.name] ?? ''}
              onChangeText={(txt) => setVals((prev) => ({ ...prev, [v.name]: txt }))}
              keyboardType="numeric"
              style={[
                styles.calcInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={[styles.calcResult, { backgroundColor: isDark ? 'rgba(34,197,94,0.18)' : '#DFF5E5' }]}>
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.mintDark }}>
          {widget.resultLabel ?? 'Result'}: {Number.isFinite(computed) ? computed.toFixed(2) : '—'}
        </Text>
      </View>
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
  boardTitle: { fontSize: 12.5, fontWeight: '800', flex: 1 },
  pillToggleRow: { flexDirection: 'row', gap: 5 },
  miniPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  eqInputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  eqInput: { flex: 1, fontSize: 13, fontWeight: '700' },
  barChartArea: {
    width: '100%',
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 8,
    paddingTop: 8,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barTrack: {
    width: '72%',
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(148,163,184,0.14)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8 },
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
