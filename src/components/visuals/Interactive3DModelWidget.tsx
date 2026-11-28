import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';

export interface Model3DNode {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  r: number;
  color: string;
}

export interface Model3DEdge {
  from: string;
  to: string;
  color?: string;
}

export type Preset3DModel = 'water_h2o' | 'methane_ch4' | 'cube_3d' | 'pyramid_3d';

const PRESET_MODELS: Record<
  Preset3DModel,
  { title: string; subtitle: string; nodes: Model3DNode[]; edges: Model3DEdge[] }
> = {
  water_h2o: {
    title: '3D Water Molecule (H₂O — Bent 104.5°)',
    subtitle: 'Oxygen (red) forms two polar covalent bonds with Hydrogen (white/blue) at 104.5° due to two lone pairs.',
    nodes: [
      { id: 'O', label: 'O', x: 0, y: -18, z: 0, r: 22, color: '#EF4444' },
      { id: 'H1', label: 'H', x: -58, y: 28, z: 18, r: 14, color: '#38BDF8' },
      { id: 'H2', label: 'H', x: 58, y: 28, z: -18, r: 14, color: '#38BDF8' },
      { id: 'LP1', label: 'e⁻', x: -16, y: -56, z: -28, r: 6, color: '#A78BFA' },
      { id: 'LP2', label: 'e⁻', x: 16, y: -56, z: 28, r: 6, color: '#A78BFA' },
    ],
    edges: [
      { from: 'O', to: 'H1', color: '#94A3B8' },
      { from: 'O', to: 'H2', color: '#94A3B8' },
      { from: 'O', to: 'LP1', color: '#C4B5FD' },
      { from: 'O', to: 'LP2', color: '#C4B5FD' },
    ],
  },
  methane_ch4: {
    title: '3D Methane Molecule (CH₄ — Tetrahedral 109.5°)',
    subtitle: 'Carbon (dark) bonded symmetrically to 4 Hydrogen atoms in 3D tetrahedral geometry.',
    nodes: [
      { id: 'C', label: 'C', x: 0, y: 0, z: 0, r: 20, color: '#334155' },
      { id: 'H1', label: 'H', x: 0, y: -64, z: 0, r: 13, color: '#38BDF8' },
      { id: 'H2', label: 'H', x: 60, y: 26, z: 0, r: 13, color: '#38BDF8' },
      { id: 'H3', label: 'H', x: -30, y: 26, z: 52, r: 13, color: '#38BDF8' },
      { id: 'H4', label: 'H', x: -30, y: 26, z: -52, r: 13, color: '#38BDF8' },
    ],
    edges: [
      { from: 'C', to: 'H1', color: '#94A3B8' },
      { from: 'C', to: 'H2', color: '#94A3B8' },
      { from: 'C', to: 'H3', color: '#94A3B8' },
      { from: 'C', to: 'H4', color: '#94A3B8' },
    ],
  },
  cube_3d: {
    title: '3D Coordinate Cube (6 Faces, 12 Edges, 8 Vertices)',
    subtitle: 'Rotate to inspect vertices, edges, and spatial symmetry in 3D.',
    nodes: [
      { id: 'A', label: 'A', x: -45, y: -45, z: -45, r: 7, color: '#7C3AED' },
      { id: 'B', label: 'B', x: 45, y: -45, z: -45, r: 7, color: '#7C3AED' },
      { id: 'C', label: 'C', x: 45, y: 45, z: -45, r: 7, color: '#7C3AED' },
      { id: 'D', label: 'D', x: -45, y: 45, z: -45, r: 7, color: '#7C3AED' },
      { id: 'E', label: 'E', x: -45, y: -45, z: 45, r: 7, color: '#F97316' },
      { id: 'F', label: 'F', x: 45, y: -45, z: 45, r: 7, color: '#F97316' },
      { id: 'G', label: 'G', x: 45, y: 45, z: 45, r: 7, color: '#F97316' },
      { id: 'H', label: 'H', x: -45, y: 45, z: 45, r: 7, color: '#F97316' },
    ],
    edges: [
      { from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'D' }, { from: 'D', to: 'A' },
      { from: 'E', to: 'F' }, { from: 'F', to: 'G' }, { from: 'G', to: 'H' }, { from: 'H', to: 'E' },
      { from: 'A', to: 'E' }, { from: 'B', to: 'F' }, { from: 'C', to: 'G' }, { from: 'D', to: 'H' },
    ],
  },
  pyramid_3d: {
    title: '3D Square Pyramid (Apex, Base & Height)',
    subtitle: 'Volume V = (1/3) × Base Area × Height.',
    nodes: [
      { id: 'P', label: 'Apex', x: 0, y: -58, z: 0, r: 8, color: '#EF4444' },
      { id: 'A', label: 'A', x: -48, y: 42, z: -48, r: 6, color: '#7C3AED' },
      { id: 'B', label: 'B', x: 48, y: 42, z: -48, r: 6, color: '#7C3AED' },
      { id: 'C', label: 'C', x: 48, y: 42, z: 48, r: 6, color: '#7C3AED' },
      { id: 'D', label: 'D', x: -48, y: 42, z: 48, r: 6, color: '#7C3AED' },
    ],
    edges: [
      { from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'D' }, { from: 'D', to: 'A' },
      { from: 'P', to: 'A', color: '#F97316' }, { from: 'P', to: 'B', color: '#F97316' },
      { from: 'P', to: 'C', color: '#F97316' }, { from: 'P', to: 'D', color: '#F97316' },
    ],
  },
};

export function Interactive3DModelWidget({
  preset = 'water_h2o',
  title,
  caption,
}: {
  preset?: Preset3DModel;
  title?: string;
  caption?: string;
}) {
  const { colors, isDark } = useTheme();
  const model = PRESET_MODELS[preset] ?? PRESET_MODELS.water_h2o;

  const [rotY, setRotY] = useState(0.45);
  const [rotX, setRotX] = useState(0.28);
  const [zoom, setZoom] = useState(1);
  const [autoSpin, setAutoSpin] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    if (!autoSpin) return;
    const id = setInterval(() => {
      setRotY((r) => (r + 0.045) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(id);
  }, [autoSpin]);

  const W = 320;
  const H = 200;
  const cx = W / 2;
  const cy = H / 2;
  const fov = 260;

  const projected = useMemo(() => {
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    const map = new Map<
      string,
      { node: Model3DNode; sx: number; sy: number; depth: number; scale: number }
    >();

    for (const n of model.nodes) {
      // Rotate around Y then X
      const x1 = n.x * cosY - n.z * sinY;
      const z1 = n.x * sinY + n.z * cosY;
      const y2 = n.y * cosX - z1 * sinX;
      const z2 = n.y * sinX + z1 * cosX;

      const scale = (fov / (fov + z2 + 90)) * zoom;
      map.set(n.id, {
        node: n,
        sx: cx + x1 * scale,
        sy: cy + y2 * scale,
        depth: z2,
        scale,
      });
    }

    const sortedNodes = Array.from(map.values()).sort((a, b) => b.depth - a.depth);
    return { map, sortedNodes };
  }, [model.nodes, rotX, rotY, zoom]);

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: isDark ? '#16201C' : '#F8FBFF', borderColor: colors.border },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title ?? model.title}
        </Text>
        <View style={[styles.badge3d, { backgroundColor: colors.surfacePurpleSoft }]}>
          <Ionicons name="cube-outline" size={12} color={colors.purple} />
          <Text style={{ color: colors.purple, fontSize: 10.5, fontWeight: '800' }}>3D Interactive</Text>
        </View>
      </View>

      <Svg width="100%" height={206} viewBox={`0 0 ${W} ${H}`}>
        {/* Subtle 3D floor ellipse */}
        <Line x1={28} y1={174} x2={292} y2={174} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'} strokeWidth={1.2} strokeDasharray="4,4" />

        {/* Draw edges */}
        {model.edges.map((e, i) => {
          const a = projected.map.get(e.from);
          const b = projected.map.get(e.to);
          if (!a || !b) return null;
          return (
            <Line
              key={`e-${i}`}
              x1={a.sx}
              y1={a.sy}
              x2={b.sx}
              y2={b.sy}
              stroke={e.color ?? '#64748B'}
              strokeWidth={3.2 * ((a.scale + b.scale) / 2)}
              strokeLinecap="round"
            />
          );
        })}

        {/* Draw depth-sorted spheres */}
        {projected.sortedNodes.map((item) => {
          const r = Math.max(4, item.node.r * item.scale);
          return (
            <React.Fragment key={item.node.id}>
              <Circle
                cx={item.sx}
                cy={item.sy}
                r={r}
                fill={item.node.color}
                stroke="#FFFFFF"
                strokeWidth={1.6}
              />
              {/* Specular 3D highlight */}
              <Circle
                cx={item.sx - r * 0.28}
                cy={item.sy - r * 0.28}
                r={Math.max(1.8, r * 0.26)}
                fill="rgba(255,255,255,0.45)"
              />
              {showLabels && (
                <SvgText
                  x={item.sx}
                  y={item.sy + 4}
                  fontSize={Math.max(9, Math.round(11 * item.scale))}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#FFFFFF"
                >
                  {item.node.label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Camera Controls */}
      <View style={styles.controlsRow}>
        <AnimatedPressable
          onPress={() => setAutoSpin((s) => !s)}
          style={[styles.ctrlBtn, { backgroundColor: autoSpin ? colors.coral : colors.surfaceMuted }]}
        >
          <Ionicons name={autoSpin ? 'pause' : 'play'} size={13} color={autoSpin ? '#FFFFFF' : colors.text} />
          <Text style={{ color: autoSpin ? '#FFFFFF' : colors.text, fontSize: 11, fontWeight: '800' }}>
            {autoSpin ? 'Spinning' : 'Spin'}
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => {
            setAutoSpin(false);
            setRotY((r) => r - 0.35);
          }}
          style={[styles.ctrlBtn, { backgroundColor: colors.surfaceMuted }]}
        >
          <Ionicons name="refresh-outline" size={13} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>Left</Text>
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => {
            setAutoSpin(false);
            setRotX((r) => r + 0.3);
          }}
          style={[styles.ctrlBtn, { backgroundColor: colors.surfaceMuted }]}
        >
          <Ionicons name="swap-vertical-outline" size={13} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>Tilt</Text>
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => setZoom((z) => (z >= 1.3 ? 0.85 : Number((z + 0.15).toFixed(2))))}
          style={[styles.ctrlBtn, { backgroundColor: colors.surfaceMuted }]}
        >
          <Ionicons name="search-outline" size={13} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>Zoom</Text>
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => setShowLabels((l) => !l)}
          style={[styles.ctrlBtn, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
            {showLabels ? 'Hide Labels' : 'Labels'}
          </Text>
        </AnimatedPressable>
      </View>

      <Text style={[styles.caption, { color: colors.purple }]}>
        {caption ?? model.subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { flex: 1, fontSize: 13.5, fontWeight: '800' },
  badge3d: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  ctrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  caption: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
});
