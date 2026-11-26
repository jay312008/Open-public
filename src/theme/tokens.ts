export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  waveTint1: string;
  waveTint2: string;
  waveTint3: string;

  // Surfaces
  surface: string;
  surfaceElevated: string;
  surfaceMint: string;
  surfaceMintStrong: string;
  surfaceMuted: string;
  surfaceCoralSoft: string;
  surfacePurpleSoft: string;
  surfaceBlueSoft: string;
  surfaceAmberSoft: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Brand & Accents
  coral: string;
  coralPressed: string;
  mint: string;
  mintDark: string;
  brandGreen: string;
  gold: string;
  purple: string;
  blue: string;
  danger: string;

  // Borders & Shadows
  border: string;
  borderSubtle: string;
  shadowColor: string;

  // Bottom Navigation
  navBackground: string;
  navBlob: string;
  navIconInactive: string;
  navIconActive: string;

  // Journey Sky & Road
  skyTop: string;
  skyBottom: string;
  hillBack: string;
  hillMid: string;
  hillFront: string;
  roadFill: string;
  roadBorder: string;
  roadCompleted: string;
  starMuted: string;
  starFilled: string;
}

export const LIGHT_COLORS: ThemeColors = {
  background: '#FFF6F5',
  backgroundSecondary: '#FFF0ED',
  waveTint1: '#FFE4DF',
  waveTint2: '#FDE8F0',
  waveTint3: '#FFF4E8',

  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMint: '#EAF7E7',
  surfaceMintStrong: '#D3F0CE',
  surfaceMuted: '#F5F2F1',
  surfaceCoralSoft: '#FFF0EC',
  surfacePurpleSoft: '#F3EEFF',
  surfaceBlueSoft: '#EAF4FF',
  surfaceAmberSoft: '#FFF6E5',

  text: '#1A1D1E',
  textSecondary: '#4B5563',
  textMuted: '#7C858D',
  textInverse: '#FFFFFF',

  coral: '#FF6B4A',
  coralPressed: '#E85A3A',
  mint: '#58C45B',
  mintDark: '#2E8B35',
  brandGreen: '#3BB54A',
  gold: '#F5B82E',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  danger: '#EF4444',

  border: 'rgba(26, 29, 30, 0.08)',
  borderSubtle: 'rgba(26, 29, 30, 0.05)',
  shadowColor: '#2B1B18',

  navBackground: 'rgba(255, 255, 255, 0.96)',
  navBlob: '#C8F2B8',
  navIconInactive: '#2C3338',
  navIconActive: '#1E5B24',

  skyTop: '#CBEBFF',
  skyBottom: '#F5F9FF',
  hillBack: '#A7DC8A',
  hillMid: '#7DC95E',
  hillFront: '#5AB342',
  roadFill: '#FFF6E3',
  roadBorder: '#E5CFA8',
  roadCompleted: '#58C45B',
  starMuted: '#D6D9DD',
  starFilled: '#FBBF24',
};

export const DARK_COLORS: ThemeColors = {
  background: '#151B19',
  backgroundSecondary: '#1B2420',
  waveTint1: 'rgba(255, 130, 145, 0.09)',
  waveTint2: 'rgba(65, 145, 95, 0.14)',
  waveTint3: 'rgba(255, 115, 95, 0.07)',

  surface: '#1F2A25',
  surfaceElevated: '#27382F',
  surfaceMint: '#22362A',
  surfaceMintStrong: '#2D4A38',
  surfaceMuted: '#24302B',
  surfaceCoralSoft: 'rgba(255, 107, 74, 0.18)',
  surfacePurpleSoft: 'rgba(139, 92, 246, 0.18)',
  surfaceBlueSoft: 'rgba(59, 130, 246, 0.18)',
  surfaceAmberSoft: 'rgba(245, 184, 46, 0.16)',

  text: '#F6F4F0',
  textSecondary: '#C5CFC9',
  textMuted: '#8B9A92',
  textInverse: '#151B19',

  coral: '#FF7557',
  coralPressed: '#FF5E3B',
  mint: '#63D467',
  mintDark: '#86E88A',
  brandGreen: '#58D166',
  gold: '#FACC15',
  purple: '#A78BFA',
  blue: '#60A5FA',
  danger: '#F87171',

  border: 'rgba(246, 244, 240, 0.10)',
  borderSubtle: 'rgba(246, 244, 240, 0.06)',
  shadowColor: '#000000',

  navBackground: 'rgba(27, 36, 32, 0.96)',
  navBlob: '#2D5236',
  navIconInactive: '#B8C4BD',
  navIconActive: '#9AF09D',

  skyTop: '#0B1A2C',
  skyBottom: '#16324A',
  hillBack: '#1C3B2B',
  hillMid: '#183324',
  hillFront: '#13281D',
  roadFill: '#D9CBAE',
  roadBorder: '#8D7D62',
  roadCompleted: '#63D467',
  starMuted: '#42524B',
  starFilled: '#FACC15',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADII = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};
