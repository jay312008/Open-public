import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';

/* ============================================================
 * 1. EXCEL / SPREADSHEET-STYLE DATA TABLE WIDGET
 * ============================================================ */
export interface TableWidgetProps {
  title?: string;
  headers: string[];
  rows: string[][];
  caption?: string;
}

export function DynamicDataTableWidget({ title, headers, rows, caption }: TableWidgetProps) {
  const { colors, isDark } = useTheme();
  if (!headers?.length && !rows?.length) return null;

  const colCount = Math.max(headers.length, ...rows.map((r) => r.length));
  const minColWidth = colCount <= 3 ? 96 : 112;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: isDark ? '#17221E' : '#FFFFFF', borderColor: colors.border },
      ]}
    >
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.tableBorder, { borderColor: colors.border }]}>
          {headers.length > 0 && (
            <View style={[styles.tr, { backgroundColor: colors.mintDark }]}>
              {headers.map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    { minWidth: minColWidth, borderRightColor: 'rgba(255,255,255,0.2)' },
                    i < headers.length - 1 && styles.cellRightBorder,
                  ]}
                >
                  <Text style={styles.thText}>{h}</Text>
                </View>
              ))}
            </View>
          )}
          {rows.map((row, rIdx) => (
            <View
              key={rIdx}
              style={[
                styles.tr,
                {
                  backgroundColor:
                    rIdx % 2 === 0
                      ? isDark
                        ? '#1B2823'
                        : '#FFFFFF'
                      : isDark
                        ? '#21302A'
                        : '#F6FBF8',
                  borderTopWidth: 1,
                  borderTopColor: colors.borderSubtle,
                },
              ]}
            >
              {row.map((val, cIdx) => (
                <View
                  key={cIdx}
                  style={[
                    styles.cell,
                    { minWidth: minColWidth, borderRightColor: colors.borderSubtle },
                    cIdx < row.length - 1 && styles.cellRightBorder,
                  ]}
                >
                  <Text style={[styles.tdText, { color: colors.text }]}>{String(val ?? '')}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      {caption && <Text style={[styles.caption, { color: colors.textSecondary }]}>{caption}</Text>}
    </View>
  );
}

/* ============================================================
 * 2. INTERACTIVE PERIODIC TABLE WIDGET (Tap any element!)
 * ============================================================ */
interface ElementInfo {
  z: number;
  sym: string;
  name: string;
  mass: string;
  config: string;
  group: number;
  period: number;
  family: 'alkali' | 'alkaline' | 'transition' | 'nonmetal' | 'halogen' | 'noble' | 'metalloid';
}

const ELEMENTS: ElementInfo[] = [
  { z: 1, sym: 'H', name: 'Hydrogen', mass: '1.008', config: '1', group: 1, period: 1, family: 'nonmetal' },
  { z: 2, sym: 'He', name: 'Helium', mass: '4.003', config: '2', group: 18, period: 1, family: 'noble' },
  { z: 3, sym: 'Li', name: 'Lithium', mass: '6.94', config: '2,1', group: 1, period: 2, family: 'alkali' },
  { z: 4, sym: 'Be', name: 'Beryllium', mass: '9.012', config: '2,2', group: 2, period: 2, family: 'alkaline' },
  { z: 5, sym: 'B', name: 'Boron', mass: '10.81', config: '2,3', group: 13, period: 2, family: 'metalloid' },
  { z: 6, sym: 'C', name: 'Carbon', mass: '12.01', config: '2,4', group: 14, period: 2, family: 'nonmetal' },
  { z: 7, sym: 'N', name: 'Nitrogen', mass: '14.01', config: '2,5', group: 15, period: 2, family: 'nonmetal' },
  { z: 8, sym: 'O', name: 'Oxygen', mass: '16.00', config: '2,6', group: 16, period: 2, family: 'nonmetal' },
  { z: 9, sym: 'F', name: 'Fluorine', mass: '19.00', config: '2,7', group: 17, period: 2, family: 'halogen' },
  { z: 10, sym: 'Ne', name: 'Neon', mass: '20.18', config: '2,8', group: 18, period: 2, family: 'noble' },
  { z: 11, sym: 'Na', name: 'Sodium', mass: '22.99', config: '2,8,1', group: 1, period: 3, family: 'alkali' },
  { z: 12, sym: 'Mg', name: 'Magnesium', mass: '24.31', config: '2,8,2', group: 2, period: 3, family: 'alkaline' },
  { z: 13, sym: 'Al', name: 'Aluminium', mass: '26.98', config: '2,8,3', group: 13, period: 3, family: 'metalloid' },
  { z: 14, sym: 'Si', name: 'Silicon', mass: '28.09', config: '2,8,4', group: 14, period: 3, family: 'metalloid' },
  { z: 15, sym: 'P', name: 'Phosphorus', mass: '30.97', config: '2,8,5', group: 15, period: 3, family: 'nonmetal' },
  { z: 16, sym: 'S', name: 'Sulfur', mass: '32.06', config: '2,8,6', group: 16, period: 3, family: 'nonmetal' },
  { z: 17, sym: 'Cl', name: 'Chlorine', mass: '35.45', config: '2,8,7', group: 17, period: 3, family: 'halogen' },
  { z: 18, sym: 'Ar', name: 'Argon', mass: '39.95', config: '2,8,8', group: 18, period: 3, family: 'noble' },
  { z: 19, sym: 'K', name: 'Potassium', mass: '39.10', config: '2,8,8,1', group: 1, period: 4, family: 'alkali' },
  { z: 20, sym: 'Ca', name: 'Calcium', mass: '40.08', config: '2,8,8,2', group: 2, period: 4, family: 'alkaline' },
  { z: 26, sym: 'Fe', name: 'Iron', mass: '55.85', config: '2,8,14,2', group: 8, period: 4, family: 'transition' },
  { z: 29, sym: 'Cu', name: 'Copper', mass: '63.55', config: '2,8,18,1', group: 11, period: 4, family: 'transition' },
  { z: 30, sym: 'Zn', name: 'Zinc', mass: '65.38', config: '2,8,18,2', group: 12, period: 4, family: 'transition' },
  { z: 35, sym: 'Br', name: 'Bromine', mass: '79.90', config: '2,8,18,7', group: 17, period: 4, family: 'halogen' },
  { z: 36, sym: 'Kr', name: 'Krypton', mass: '83.80', config: '2,8,18,8', group: 18, period: 4, family: 'noble' },
];

const FAMILY_COLORS: Record<ElementInfo['family'], { bg: string; fg: string; label: string }> = {
  alkali: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Alkali Metal' },
  alkaline: { bg: '#FFEDD5', fg: '#C2410C', label: 'Alkaline Earth' },
  transition: { bg: '#FEF3C7', fg: '#B45309', label: 'Transition Metal' },
  metalloid: { bg: '#E0E7FF', fg: '#4338CA', label: 'Metalloid / Metal' },
  nonmetal: { bg: '#DCFCE7', fg: '#15803D', label: 'Non-Metal' },
  halogen: { bg: '#F3E8FF', fg: '#7E22CE', label: 'Halogen (Group 17)' },
  noble: { bg: '#DBEAFE', fg: '#1D4ED8', label: 'Noble Gas (Group 18)' },
};

export function InteractivePeriodicTableWidget({ title, caption }: { title?: string; caption?: string }) {
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState<ElementInfo>(ELEMENTS[10]); // Na default

  const cols = [1, 2, 8, 11, 12, 13, 14, 15, 16, 17, 18];
  const periods = [1, 2, 3, 4];

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: isDark ? '#17221E' : '#FFFFFF', borderColor: colors.border },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        {title ?? 'Interactive Periodic Table (Tap any Element)'}
      </Text>

      {/* Selected Element Detail Card */}
      <View
        style={[
          styles.elDetail,
          { backgroundColor: FAMILY_COLORS[selected.family].bg },
        ]}
      >
        <View style={styles.elSymbolBox}>
          <Text style={{ color: FAMILY_COLORS[selected.family].fg, fontSize: 10, fontWeight: '800' }}>
            {selected.z}
          </Text>
          <Text style={{ color: FAMILY_COLORS[selected.family].fg, fontSize: 22, fontWeight: '900' }}>
            {selected.sym}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#111827', fontSize: 15, fontWeight: '900' }}>
            {selected.name} ({FAMILY_COLORS[selected.family].label})
          </Text>
          <Text style={{ color: '#374151', fontSize: 12.5, fontWeight: '700' }}>
            Mass: {selected.mass} · Electron Shell: {selected.config} · Group {selected.group}, Period {selected.period}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ gap: 4 }}>
          {/* Group Headers */}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {cols.map((g) => (
              <View key={`gh-${g}`} style={{ width: 42, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>G{g}</Text>
              </View>
            ))}
          </View>
          {periods.map((p) => (
            <View key={`p-${p}`} style={{ flexDirection: 'row', gap: 4 }}>
              {cols.map((g) => {
                const el = ELEMENTS.find((e) => e.period === p && e.group === g);
                if (!el) return <View key={`e-${p}-${g}`} style={{ width: 42, height: 42 }} />;
                const fam = FAMILY_COLORS[el.family];
                const isSel = selected.z === el.z;
                return (
                  <AnimatedPressable
                    key={el.sym}
                    onPress={() => setSelected(el)}
                    style={[
                      styles.elCell,
                      {
                        backgroundColor: fam.bg,
                        borderColor: isSel ? '#111827' : 'transparent',
                        borderWidth: isSel ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: fam.fg, fontSize: 8.5, fontWeight: '800' }}>{el.z}</Text>
                    <Text style={{ color: fam.fg, fontSize: 13.5, fontWeight: '900' }}>{el.sym}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <Text style={[styles.caption, { color: colors.textSecondary }]}>
        {caption ?? 'Tap any element tile to inspect atomic number, mass, and electron configuration.'}
      </Text>
    </View>
  );
}

/* ============================================================
 * 3. CHEMISTRY BONDING & ORGANIC MOLECULE WIDGET
 * ============================================================ */
export interface MoleculeAtom {
  id: string;
  symbol: string;
  x: number;
  y: number;
  color?: string;
  charge?: string;
}

export interface MoleculeBond {
  from: string;
  to: string;
  order?: 1 | 2 | 3;
}

export interface ElectronShellSpec {
  symbol: string;
  charge?: string;
  rings: number[]; // e.g. [2, 8, 1]
  style?: 'dot' | 'cross';
}

export function ChemistryMoleculeWidget({
  title,
  atoms,
  bonds,
  shells,
  caption,
}: {
  title?: string;
  atoms?: MoleculeAtom[];
  bonds?: MoleculeBond[];
  shells?: ElectronShellSpec[];
  caption?: string;
}) {
  const { colors, isDark } = useTheme();
  const atomMap = new Map((atoms ?? []).map((a) => [a.id, a]));

  const hasShells = Boolean(shells && shells.length > 0);
  const W = 320;
  const H = 190;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: isDark ? '#17221E' : '#FAF9FF', borderColor: colors.border },
      ]}
    >
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}

      <Svg width="100%" height={190} viewBox={`0 0 ${W} ${H}`}>
        {hasShells
          ? shells!.slice(0, 2).map((sh, sIdx) => {
              const cx = shells!.length === 1 ? W / 2 : sIdx === 0 ? 95 : 225;
              const cy = H / 2;
              const strokeCol = sIdx === 0 ? '#7C3AED' : '#16A34A';
              return (
                <React.Fragment key={`${sh.symbol}-${sIdx}`}>
                  <Circle cx={cx} cy={cy} r={18} fill={strokeCol} opacity={0.16} />
                  <SvgText
                    x={cx}
                    y={cy + 5}
                    fontSize={13}
                    fontWeight="bold"
                    fill={colors.text}
                    textAnchor="middle"
                  >
                    {sh.symbol}
                    {sh.charge ?? ''}
                  </SvgText>
                  {sh.rings.slice(0, 3).map((eCount, rIdx) => {
                    const radius = 32 + rIdx * 20;
                    const electrons = Array.from({ length: Math.min(8, eCount) }, (_, eIdx) => {
                      const angle = (eIdx / Math.max(1, Math.min(8, eCount))) * Math.PI * 2 - Math.PI / 2;
                      return {
                        ex: cx + radius * Math.cos(angle),
                        ey: cy + radius * Math.sin(angle),
                      };
                    });
                    return (
                      <React.Fragment key={`r-${rIdx}`}>
                        <Circle
                          cx={cx}
                          cy={cy}
                          r={radius}
                          fill="none"
                          stroke={colors.border}
                          strokeWidth={1.3}
                        />
                        {electrons.map((pt, eIdx) =>
                          sh.style === 'cross' ? (
                            <SvgText
                              key={`e-${eIdx}`}
                              x={pt.ex}
                              y={pt.ey + 4}
                              fontSize={12}
                              fontWeight="bold"
                              fill={strokeCol}
                              textAnchor="middle"
                            >
                              ×
                            </SvgText>
                          ) : (
                            <Circle key={`e-${eIdx}`} cx={pt.ex} cy={pt.ey} r={3.5} fill={strokeCol} />
                          )
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })
          : (
            <>
              {/* Structural Bonds (Single / Double / Triple) */}
              {(bonds ?? []).map((b, idx) => {
                const a1 = atomMap.get(b.from);
                const a2 = atomMap.get(b.to);
                if (!a1 || !a2) return null;
                const dx = a2.x - a1.x;
                const dy = a2.y - a1.y;
                const len = Math.hypot(dx, dy) || 1;
                const nx = (-dy / len) * 4;
                const ny = (dx / len) * 4;
                const order = b.order ?? 1;
                const offsets = order === 1 ? [0] : order === 2 ? [-1, 1] : [-1.4, 0, 1.4];
                return (
                  <React.Fragment key={`b-${idx}`}>
                    {offsets.map((off, oIdx) => (
                      <Line
                        key={`o-${oIdx}`}
                        x1={a1.x + nx * off}
                        y1={a1.y + ny * off}
                        x2={a2.x + nx * off}
                        y2={a2.y + ny * off}
                        stroke={colors.textSecondary}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                      />
                    ))}
                  </React.Fragment>
                );
              })}

              {/* Atoms */}
              {(atoms ?? []).map((a) => {
                const fill =
                  a.color ??
                  (a.symbol === 'C'
                    ? '#334155'
                    : a.symbol === 'O'
                      ? '#EF4444'
                      : a.symbol === 'N'
                        ? '#3B82F6'
                        : a.symbol === 'H'
                          ? '#10B981'
                          : '#7C3AED');
                return (
                  <React.Fragment key={a.id}>
                    <Circle cx={a.x} cy={a.y} r={16} fill={fill} />
                    <SvgText
                      x={a.x}
                      y={a.y + 4.5}
                      fontSize={12}
                      fontWeight="bold"
                      fill="#FFFFFF"
                      textAnchor="middle"
                    >
                      {a.symbol}
                      {a.charge ?? ''}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </>
          )}
      </Svg>

      {caption && <Text style={[styles.caption, { color: colors.textSecondary }]}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, borderWidth: 1, padding: 13, gap: 10 },
  title: { fontSize: 14.5, fontWeight: '900' },
  tableBorder: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tr: { flexDirection: 'row' },
  cell: { paddingHorizontal: 10, paddingVertical: 9, justifyContent: 'center' },
  cellRightBorder: { borderRightWidth: 1 },
  thText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
  tdText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 17 },
  elDetail: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 10 },
  elSymbolBox: { width: 44, alignItems: 'center' },
  elCell: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
