import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';

export interface StudentAvatarSpec {
  id: string;
  label: string;
  bg: string;
  skin: string;
  hair: string;
  shirt: string;
  accent: string;
  hairStyle: 'short' | 'afro' | 'bun' | 'curly' | 'bob' | 'waves';
  accessory?: 'glasses' | 'grad_cap' | 'headphones' | 'lab_coat' | 'beret' | 'visor';
}

export const STUDENT_AVATARS: StudentAvatarSpec[] = [
  {
    id: 'avatar_scholar',
    label: 'Scholar',
    bg: '#FFE4DC',
    skin: '#8D5524',
    hair: '#1F1B18',
    shirt: '#4F46E5',
    accent: '#F59E0B',
    hairStyle: 'short',
    accessory: 'grad_cap',
  },
  {
    id: 'avatar_graduate',
    label: 'Graduate',
    bg: '#FEF3C7',
    skin: '#A5693D',
    hair: '#1E1B18',
    shirt: '#7C3AED',
    accent: '#FBBF24',
    hairStyle: 'bun',
    accessory: 'grad_cap',
  },
  {
    id: 'avatar_scientist',
    label: 'Scientist',
    bg: '#DCFCE7',
    skin: '#C68642',
    hair: '#292524',
    shirt: '#FFFFFF',
    accent: '#16A34A',
    hairStyle: 'curly',
    accessory: 'glasses',
  },
  {
    id: 'avatar_chemist',
    label: 'Chemist',
    bg: '#CCFBF1',
    skin: '#6F4222',
    hair: '#171717',
    shirt: '#FFFFFF',
    accent: '#0D9488',
    hairStyle: 'afro',
    accessory: 'glasses',
  },
  {
    id: 'avatar_coder',
    label: 'Coder',
    bg: '#DBEAFE',
    skin: '#9C6234',
    hair: '#1C1917',
    shirt: '#2563EB',
    accent: '#38BDF8',
    hairStyle: 'short',
    accessory: 'headphones',
  },
  {
    id: 'avatar_engineer',
    label: 'Engineer',
    bg: '#E0E7FF',
    skin: '#D9A066',
    hair: '#3B2314',
    shirt: '#1D4ED8',
    accent: '#F97316',
    hairStyle: 'bob',
    accessory: 'glasses',
  },
  {
    id: 'avatar_artist',
    label: 'Artist',
    bg: '#FCE7F3',
    skin: '#B57644',
    hair: '#271912',
    shirt: '#EC4899',
    accent: '#F43F5E',
    hairStyle: 'waves',
    accessory: 'beret',
  },
  {
    id: 'avatar_mentor',
    label: 'Mentor',
    bg: '#F3E8FF',
    skin: '#7A4924',
    hair: '#1C1917',
    shirt: '#6D28D9',
    accent: '#A78BFA',
    hairStyle: 'bun',
    accessory: 'glasses',
  },
  {
    id: 'avatar_explorer',
    label: 'Explorer',
    bg: '#CFFAFE',
    skin: '#C68642',
    hair: '#291D16',
    shirt: '#0284C7',
    accent: '#38BDF8',
    hairStyle: 'curly',
    accessory: 'visor',
  },
  {
    id: 'avatar_medic',
    label: 'Medic',
    bg: '#FFE4E6',
    skin: '#8D5524',
    hair: '#171717',
    shirt: '#FFFFFF',
    accent: '#EF4444',
    hairStyle: 'bob',
    accessory: 'lab_coat',
  },
  {
    id: 'avatar_reader',
    label: 'Reader',
    bg: '#FFEDD5',
    skin: '#E0AC69',
    hair: '#4A2C18',
    shirt: '#EA580C',
    accent: '#FDBA74',
    hairStyle: 'waves',
    accessory: 'glasses',
  },
  {
    id: 'avatar_champion',
    label: 'Champion',
    bg: '#FEF9C3',
    skin: '#6F4222',
    hair: '#171717',
    shirt: '#16A34A',
    accent: '#FACC15',
    hairStyle: 'afro',
    accessory: 'headphones',
  },
];

export function resolveStudentAvatar(idOrLegacy?: string): StudentAvatarSpec {
  if (!idOrLegacy) return STUDENT_AVATARS[0];
  const exact = STUDENT_AVATARS.find((a) => a.id === idOrLegacy);
  if (exact) return exact;
  // Deterministic fallback for any legacy emoji string so zero emojis ever render
  let hash = 0;
  for (let i = 0; i < idOrLegacy.length; i++) {
    hash = (hash * 31 + idOrLegacy.charCodeAt(i)) % STUDENT_AVATARS.length;
  }
  return STUDENT_AVATARS[Math.abs(hash) % STUDENT_AVATARS.length];
}

export function StudentAvatar({
  avatarId,
  bgColor,
  size = 44,
}: {
  avatarId?: string;
  bgColor?: string;
  size?: number;
}) {
  const spec = resolveStudentAvatar(avatarId);
  const bg = bgColor || spec.bg;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Background soft circle */}
        <Circle cx={32} cy={32} r={32} fill={bg} />

        {/* Back Hair Layer */}
        {spec.hairStyle === 'afro' && (
          <Circle cx={32} cy={26} r={19} fill={spec.hair} />
        )}
        {spec.hairStyle === 'waves' && (
          <Path d="M 15 28 C 14 42, 17 50, 22 52 L 42 52 C 47 50, 50 42, 49 28 C 49 16, 15 16, 15 28 Z" fill={spec.hair} />
        )}
        {spec.hairStyle === 'bob' && (
          <Path d="M 16 28 C 16 39, 18 45, 22 46 L 42 46 C 46 45, 48 39, 48 28 C 48 16, 16 16, 16 28 Z" fill={spec.hair} />
        )}
        {spec.hairStyle === 'bun' && (
          <>
            <Circle cx={32} cy={10} r={7.5} fill={spec.hair} />
            <Circle cx={32} cy={27} r={15} fill={spec.hair} />
          </>
        )}
        {spec.hairStyle === 'curly' && (
          <>
            <Circle cx={21} cy={20} r={8} fill={spec.hair} />
            <Circle cx={32} cy={16} r={9} fill={spec.hair} />
            <Circle cx={43} cy={20} r={8} fill={spec.hair} />
          </>
        )}

        {/* Shoulders / Shirt */}
        <Path
          d="M 11 64 C 12 49, 20 45, 32 45 C 44 45, 52 49, 53 64 Z"
          fill={spec.shirt}
        />
        {/* Collar / Accent Stripe */}
        <Path d="M 26 45 L 32 52 L 38 45 Z" fill={spec.accent} />
        {spec.accessory === 'lab_coat' && (
          <>
            <Line x1={32} y1={52} x2={32} y2={64} stroke="#CBD5E1" strokeWidth={1.6} />
            <Circle cx={25} cy={55} r={2.2} fill={spec.accent} />
          </>
        )}

        {/* Neck */}
        <Rect x={28} y={38} width={8} height={9} rx={4} fill={spec.skin} />

        {/* Ears */}
        <Circle cx={19} cy={30} r={3.2} fill={spec.skin} />
        <Circle cx={45} cy={30} r={3.2} fill={spec.skin} />

        {/* Face */}
        <Circle cx={32} cy={29} r={13} fill={spec.skin} />

        {/* Front Hair Bangs */}
        {spec.hairStyle === 'short' && (
          <Path d="M 19 26 C 19 16, 45 16, 45 26 C 41 21, 23 21, 19 26 Z" fill={spec.hair} />
        )}
        {spec.hairStyle === 'bob' && (
          <Path d="M 19 25 C 21 17, 43 17, 45 25 C 39 21, 25 21, 19 25 Z" fill={spec.hair} />
        )}
        {spec.hairStyle === 'waves' && (
          <Path d="M 19 25 C 23 17, 41 17, 45 25 C 38 22, 26 20, 19 25 Z" fill={spec.hair} />
        )}

        {/* Eyes */}
        <Circle cx={27} cy={29} r={1.8} fill="#1E293B" />
        <Circle cx={37} cy={29} r={1.8} fill="#1E293B" />
        <Circle cx={27.6} cy={28.4} r={0.55} fill="#FFFFFF" />
        <Circle cx={37.6} cy={28.4} r={0.55} fill="#FFFFFF" />

        {/* Warm Smile */}
        <Path
          d="M 27.5 34.5 Q 32 38.2 36.5 34.5"
          stroke="#431407"
          strokeWidth={1.7}
          strokeLinecap="round"
          fill="none"
        />

        {/* Accessories */}
        {spec.accessory === 'glasses' && (
          <>
            <Circle cx={27} cy={29} r={4.2} stroke="#1E293B" strokeWidth={1.5} fill="rgba(255,255,255,0.22)" />
            <Circle cx={37} cy={29} r={4.2} stroke="#1E293B" strokeWidth={1.5} fill="rgba(255,255,255,0.22)" />
            <Line x1={31.2} y1={29} x2={32.8} y2={29} stroke="#1E293B" strokeWidth={1.5} />
          </>
        )}

        {spec.accessory === 'grad_cap' && (
          <>
            <Path d="M 16 17 L 32 10 L 48 17 L 32 22 Z" fill="#1E293B" />
            <Rect x={24} y={17} width={16} height={4.5} rx={1.5} fill="#334155" />
            <Line x1={46} y1={17} x2={46} y2={25} stroke={spec.accent} strokeWidth={1.8} />
            <Circle cx={46} cy={25.5} r={2} fill={spec.accent} />
          </>
        )}

        {spec.accessory === 'headphones' && (
          <>
            <Path
              d="M 17.5 29 C 17.5 14, 46.5 14, 46.5 29"
              stroke={spec.accent}
              strokeWidth={2.6}
              fill="none"
            />
            <Rect x={14.5} y={25} width={4.5} height={9} rx={2.2} fill={spec.accent} />
            <Rect x={45} y={25} width={4.5} height={9} rx={2.2} fill={spec.accent} />
          </>
        )}

        {spec.accessory === 'beret' && (
          <Path d="M 18 20 C 18 12, 43 11, 46 19 C 38 21, 24 22, 18 20 Z" fill={spec.accent} />
        )}

        {spec.accessory === 'visor' && (
          <Rect x={21} y={25.5} width={22} height={6.5} rx={3.2} fill="rgba(56,189,248,0.65)" stroke="#0284C7" strokeWidth={1.4} />
        )}
      </Svg>
    </View>
  );
}
