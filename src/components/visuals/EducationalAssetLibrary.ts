import { DiagramPrimitive } from '@/components/chat/ChatVisualWidget';

export type AnimationKind = 'none' | 'light_ray' | 'blood_flow' | 'current_flow' | 'force_motion' | 'river_flow';

export interface EducationalAsset {
  id: string;
  name: string;
  subject: 'Biology' | 'Physics' | 'Chemistry' | 'Geography' | 'Mathematics';
  topic: string;
  description: string;
  license: string;
  animationKind: AnimationKind;
  primitives: DiagramPrimitive[];
}

export const EDUCATIONAL_ASSETS: Record<string, EducationalAsset> = {
  plant_cell: {
    id: 'plant_cell',
    name: 'Structure of a Plant Cell',
    subject: 'Biology',
    topic: 'Cell Biology',
    description: 'Plant cell showing rigid cellulose cell wall, cell membrane, large central vacuole, nucleus, chloroplasts, mitochondria, and cytoplasm.',
    license: 'Original LearnyMol Educational Vector (CC0)',
    animationKind: 'none',
    primitives: [
      // Outer Cell Wall (hexagonal/rounded rect)
      { kind: 'rect', x: 52, y: 26, w: 236, h: 162, color: '#15803D', fill: 'rgba(34,197,94,0.14)', strokeWidth: 4 },
      // Inner Cell Membrane
      { kind: 'rect', x: 62, y: 36, w: 216, h: 142, color: '#16A34A', fill: 'rgba(187,247,208,0.22)', strokeWidth: 1.8, dashed: true },
      // Large Central Vacuole
      { kind: 'rect', x: 118, y: 54, w: 120, h: 92, color: '#0284C7', fill: 'rgba(56,189,248,0.28)', strokeWidth: 2 },
      // Nucleus
      { kind: 'circle', cx: 90, cy: 84, r: 21, color: '#7C3AED', fill: 'rgba(139,92,246,0.30)', strokeWidth: 2.2 },
      { kind: 'circle', cx: 90, cy: 84, r: 7, color: '#5B21B6', fill: '#5B21B6' },
      // Chloroplasts
      { kind: 'circle', cx: 94, cy: 142, r: 10, color: '#15803D', fill: '#22C55E' },
      { kind: 'circle', cx: 254, cy: 76, r: 10, color: '#15803D', fill: '#22C55E' },
      { kind: 'circle', cx: 254, cy: 144, r: 10, color: '#15803D', fill: '#22C55E' },
      // Mitochondrion
      { kind: 'rect', x: 158, y: 154, w: 30, h: 14, color: '#EA580C', fill: '#FDBA74', strokeWidth: 1.8 },
      // Labels
      { kind: 'text', x: 170, y: 16, content: 'Cell Wall (Cellulose)', color: '#15803D', fontSize: 10.5 },
      { kind: 'text', x: 178, y: 103, content: 'Large Vacuole', color: '#0369A1', fontSize: 10.5 },
      { kind: 'text', x: 32, y: 84, content: 'Nucleus', color: '#6D28D9', fontSize: 10 },
      { kind: 'text', x: 308, y: 78, content: 'Chloroplast', color: '#15803D', fontSize: 9.5 },
      { kind: 'text', x: 173, y: 204, content: 'Mitochondrion · Cytoplasm · Cell Membrane', color: '#9A3412', fontSize: 10 },
    ],
  },

  human_heart: {
    id: 'human_heart',
    name: 'Human Heart — Chambers, Valves & Circulation',
    subject: 'Biology',
    topic: 'Circulatory System',
    description: 'Four-chambered mammalian heart showing deoxygenated blood (blue, right side) and oxygenated blood (red, left side) with valves and major vessels.',
    license: 'Original LearnyMol Educational Vector (CC0)',
    animationKind: 'blood_flow',
    primitives: [
      // Right Side (Deoxygenated - Blue)
      { kind: 'rect', x: 74, y: 52, w: 88, h: 64, color: '#2563EB', fill: 'rgba(59,130,246,0.20)', strokeWidth: 2.4 },
      { kind: 'rect', x: 74, y: 120, w: 88, h: 72, color: '#1D4ED8', fill: 'rgba(37,99,235,0.26)', strokeWidth: 2.6 },
      // Left Side (Oxygenated - Red)
      { kind: 'rect', x: 178, y: 52, w: 88, h: 64, color: '#DC2626', fill: 'rgba(239,68,68,0.20)', strokeWidth: 2.4 },
      { kind: 'rect', x: 178, y: 120, w: 88, h: 72, color: '#B91C1C', fill: 'rgba(220,38,38,0.28)', strokeWidth: 3 },
      // Septum
      { kind: 'rect', x: 164, y: 52, w: 12, h: 140, color: '#7F1D1D', fill: 'rgba(185,28,28,0.18)', strokeWidth: 1.5 },
      // Vessels & Flow Arrows
      { kind: 'arrow', x1: 118, y1: 18, x2: 118, y2: 50, color: '#2563EB', strokeWidth: 2.8 },
      { kind: 'arrow', x1: 118, y1: 104, x2: 118, y2: 132, color: '#1D4ED8', strokeWidth: 2.6 },
      { kind: 'arrow', x1: 222, y1: 18, x2: 222, y2: 50, color: '#DC2626', strokeWidth: 2.8 },
      { kind: 'arrow', x1: 222, y1: 104, x2: 222, y2: 132, color: '#B91C1C', strokeWidth: 2.6 },
      // Valves
      { kind: 'line', x1: 96, y1: 118, x2: 140, y2: 118, color: '#F59E0B', strokeWidth: 3.5 },
      { kind: 'line', x1: 200, y1: 118, x2: 244, y2: 118, color: '#F59E0B', strokeWidth: 3.5 },
      // Labels
      { kind: 'text', x: 118, y: 13, content: 'Vena Cava (Body)', color: '#1D4ED8', fontSize: 9.5 },
      { kind: 'text', x: 222, y: 13, content: 'Pulmonary Vein / Aorta', color: '#B91C1C', fontSize: 9.5 },
      { kind: 'text', x: 118, y: 84, content: 'Right Atrium', color: '#1E40AF', fontSize: 10 },
      { kind: 'text', x: 118, y: 158, content: 'Right Ventricle', color: '#1E3A8A', fontSize: 10 },
      { kind: 'text', x: 222, y: 84, content: 'Left Atrium', color: '#991B1B', fontSize: 10 },
      { kind: 'text', x: 222, y: 158, content: 'Left Ventricle', color: '#7F1D1D', fontSize: 10 },
      { kind: 'text', x: 170, y: 210, content: 'Valves (Yellow) prevent backflow · Septum separates blood', color: '#475569', fontSize: 9.5 },
    ],
  },

  river_meander: {
    id: 'river_meander',
    name: 'River Meander — Erosion & Deposition',
    subject: 'Geography',
    topic: 'Fluvial Landforms',
    description: 'S-shaped river bend showing faster flow and hydraulic erosion on the outer bank (river cliff) and slower flow with deposition on the inner bank (slip-off slope).',
    license: 'Original LearnyMol Educational Vector (CC0)',
    animationKind: 'river_flow',
    primitives: [
      // River channel (thick curved blue path)
      { kind: 'path', d: 'M 22 44 C 120 26, 260 40, 260 110 C 260 176, 120 190, 22 174', color: '#0EA5E9', strokeWidth: 30, fill: 'none' },
      // Thalweg fastest current line (dashed white/blue)
      { kind: 'path', d: 'M 26 42 C 126 24, 270 38, 270 110 C 270 180, 124 192, 26 176', color: '#1D4ED8', strokeWidth: 2.2, dashed: true, fill: 'none' },
      // Inner bank deposition (Point Bar / Slip-off slope)
      { kind: 'circle', cx: 204, cy: 110, r: 28, color: '#D97706', fill: 'rgba(251,191,36,0.45)', strokeWidth: 2 },
      // Outer bank erosion arrows
      { kind: 'arrow', x1: 274, y1: 110, x2: 312, y2: 110, color: '#EF4444', strokeWidth: 2.6 },
      { kind: 'arrow', x1: 68, y1: 38, x2: 116, y2: 38, color: '#1D4ED8', strokeWidth: 2.4 },
      // Labels
      { kind: 'text', x: 118, y: 20, content: 'Fast Flow (Thalweg) →', color: '#1D4ED8', fontSize: 10 },
      { kind: 'text', x: 288, y: 86, content: 'Outer Bank:', color: '#DC2626', fontSize: 10 },
      { kind: 'text', x: 288, y: 132, content: 'Erosion (Cliff)', color: '#DC2626', fontSize: 10 },
      { kind: 'text', x: 148, y: 112, content: 'Inner Bank: Deposition', color: '#B45309', fontSize: 10 },
      { kind: 'text', x: 170, y: 208, content: 'Outer bank erodes faster · Inner bank deposits silt (Point Bar)', color: '#334155', fontSize: 9.5 },
    ],
  },

  newtons_second_law: {
    id: 'newtons_second_law',
    name: "Newton's Second Law (F = ma) & Free-Body Diagram",
    subject: 'Physics',
    topic: 'Dynamics & Forces',
    description: 'Block pushed across a surface showing Applied Force (F), Friction (f), Normal Reaction (N), Weight (mg), and resulting Acceleration (a).',
    license: 'Original LearnyMol Educational Vector (CC0)',
    animationKind: 'force_motion',
    primitives: [
      // Ground surface
      { kind: 'line', x1: 24, y1: 154, x2: 316, y2: 154, color: '#475569', strokeWidth: 3 },
      // Block mass m
      { kind: 'rect', x: 130, y: 92, w: 80, h: 62, color: '#7C3AED', fill: 'rgba(124,92,250,0.20)', strokeWidth: 2.6 },
      { kind: 'text', x: 170, y: 127, content: 'Mass (m)', color: '#5B21B6', fontSize: 11 },
      // Applied Force F (right)
      { kind: 'arrow', x1: 210, y1: 123, x2: 298, y2: 123, color: '#16A34A', strokeWidth: 3.4 },
      { kind: 'text', x: 268, y: 112, content: 'Applied Force (F)', color: '#15803D', fontSize: 10.5 },
      // Friction f (left)
      { kind: 'arrow', x1: 130, y1: 144, x2: 62, y2: 144, color: '#EF4444', strokeWidth: 2.8 },
      { kind: 'text', x: 84, y: 132, content: 'Friction (f)', color: '#DC2626', fontSize: 10.5 },
      // Normal force N (up)
      { kind: 'arrow', x1: 170, y1: 92, x2: 170, y2: 34, color: '#0284C7', strokeWidth: 2.8 },
      { kind: 'text', x: 204, y: 46, content: 'Normal (N)', color: '#0369A1', fontSize: 10 },
      // Weight mg (down)
      { kind: 'arrow', x1: 170, y1: 154, x2: 170, y2: 202, color: '#D97706', strokeWidth: 2.8 },
      { kind: 'text', x: 214, y: 192, content: 'Weight (W = mg)', color: '#B45309', fontSize: 10 },
      // Acceleration arrow above
      { kind: 'arrow', x1: 224, y1: 68, x2: 288, y2: 68, color: '#FF6B4A', strokeWidth: 2.6, dashed: true },
      { kind: 'text', x: 256, y: 58, content: 'a = (F − f) / m', color: '#EA580C', fontSize: 10 },
    ],
  },

  atom_bohr: {
    id: 'atom_bohr',
    name: 'Structure of an Atom (Carbon-12 Bohr Model)',
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    description: 'Central nucleus containing 6 protons (+) and 6 neutrons (0), surrounded by 2 electron shells holding 2 inner and 4 outer electrons (2, 4).',
    license: 'Original LearnyMol Educational Vector (CC0)',
    animationKind: 'none',
    primitives: [
      // Outer shell (n=2)
      { kind: 'circle', cx: 170, cy: 106, r: 74, color: '#7C3AED', fill: 'none', dashed: true, strokeWidth: 1.8 },
      // Inner shell (n=1)
      { kind: 'circle', cx: 170, cy: 106, r: 44, color: '#0284C7', fill: 'none', dashed: true, strokeWidth: 1.8 },
      // Nucleus
      { kind: 'circle', cx: 170, cy: 106, r: 22, color: '#EF4444', fill: 'rgba(239,68,68,0.22)', strokeWidth: 2.4 },
      { kind: 'text', x: 170, y: 103, content: '6p⁺', color: '#B91C1C', fontSize: 10 },
      { kind: 'text', x: 170, y: 115, content: '6n⁰', color: '#475569', fontSize: 9.5 },
      // Inner 2 electrons
      { kind: 'circle', cx: 170, cy: 62, r: 5.5, color: '#0284C7', fill: '#38BDF8' },
      { kind: 'circle', cx: 170, cy: 150, r: 5.5, color: '#0284C7', fill: '#38BDF8' },
      // Outer 4 electrons
      { kind: 'circle', cx: 170, cy: 32, r: 5.5, color: '#7C3AED', fill: '#A78BFA' },
      { kind: 'circle', cx: 170, cy: 180, r: 5.5, color: '#7C3AED', fill: '#A78BFA' },
      { kind: 'circle', cx: 96, cy: 106, r: 5.5, color: '#7C3AED', fill: '#A78BFA' },
      { kind: 'circle', cx: 244, cy: 106, r: 5.5, color: '#7C3AED', fill: '#A78BFA' },
      // Labels
      { kind: 'text', x: 52, y: 42, content: 'Electron (e⁻)', color: '#6D28D9', fontSize: 10 },
      { kind: 'text', x: 288, y: 42, content: 'Outer Shell (4 e⁻)', color: '#6D28D9', fontSize: 10 },
      { kind: 'text', x: 288, y: 172, content: 'Inner Shell (2 e⁻)', color: '#0369A1', fontSize: 10 },
      { kind: 'text', x: 170, y: 206, content: 'Carbon-12: Nucleus (6p⁺, 6n⁰) + Electron Shells [2, 4]', color: '#334155', fontSize: 10 },
    ],
  },
};

export function buildDeterministicRightTriangle(heightVal: number, baseVal: number, unit = 'cm'): {
  title: string;
  primitives: DiagramPrimitive[];
  caption: string;
} {
  const hyp = Math.sqrt(heightVal * heightVal + baseVal * baseVal);
  const hypStr = Number.isInteger(hyp) ? String(hyp) : hyp.toFixed(2);
  // Proportionally scale inside 340x220 canvas
  const maxDim = Math.max(heightVal, baseVal, 1);
  const drawW = Math.max(85, Math.min(195, (baseVal / maxDim) * 185));
  const drawH = Math.max(70, Math.min(130, (heightVal / maxDim) * 125));
  const x0 = 84;
  const y0 = 176;
  const x1 = x0 + drawW;
  const yTop = y0 - drawH;

  return {
    title: `Right-Angled Triangle (${heightVal} ${unit} × ${baseVal} ${unit} → ${hypStr} ${unit})`,
    primitives: [
      {
        kind: 'polygon',
        points: [
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x0, y: yTop },
        ],
        color: '#7C3AED',
        fill: 'rgba(124,92,250,0.12)',
        strokeWidth: 2.6,
      },
      { kind: 'line', x1: x0, y1: yTop, x2: x1, y2: y0, color: '#FF6B4A', strokeWidth: 3.2 },
      { kind: 'right_angle', x: x0, y: y0, size: 15, dx: 1, dy: -1, color: '#7C3AED' },
      { kind: 'text', x: x0 - 34, y: (y0 + yTop) / 2, content: `h = ${heightVal} ${unit}`, color: '#1E293B', fontSize: 11 },
      { kind: 'text', x: (x0 + x1) / 2, y: y0 + 20, content: `b = ${baseVal} ${unit}`, color: '#1E293B', fontSize: 11 },
      { kind: 'text', x: (x0 + x1) / 2 + 26, y: (y0 + yTop) / 2 - 8, content: `c = ${hypStr} ${unit}`, color: '#EA580C', fontSize: 11.5 },
      { kind: 'text', x: x0 + 26, y: y0 - 12, content: '90°', color: '#7C3AED', fontSize: 9.5 },
    ],
    caption: `Pythagorean Theorem: c = √(${heightVal}² + ${baseVal}²) = √(${heightVal * heightVal + baseVal * baseVal}) = ${hypStr} ${unit}.`,
  };
}
