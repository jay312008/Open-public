import { ImageSourcePropType } from 'react-native';

export const BrandAssets = {
  appIcon: require('../../assets/images/icon.png') as ImageSourcePropType,
  mascotTransparent: require('../../assets/images/logo-mascot-transparent.png') as ImageSourcePropType,
  splashIcon: require('../../assets/images/splash-icon.png') as ImageSourcePropType,
};

export type CompanionId = 'molly' | 'leo' | 'pip' | 'zuri';

export interface CompanionConfig {
  id: CompanionId;
  name: string;
  subtitle: string;
  accentColor: string;
  bgTint: string;
  emojiFallback: string;
  usesOfficialMascot?: boolean;
  description: string;
  isPremiumEligible?: boolean;
}

export const COMPANION_REGISTRY: CompanionConfig[] = [
  {
    id: 'molly',
    name: 'Molly',
    subtitle: 'Default',
    accentColor: '#52B755',
    bgTint: '#E9F8E5',
    emojiFallback: '🌿',
    usesOfficialMascot: true,
    description: 'Your friendly, curious LearnyMol study guide with glasses, headphones, and a love for breaking down tough topics.',
  },
  {
    id: 'leo',
    name: 'Leo',
    subtitle: 'Cat Buddy',
    accentColor: '#F59E0B',
    bgTint: '#FEF3C7',
    emojiFallback: '🐱',
    description: 'Calm, focused feline tutor who keeps your exam prep sharp and structured.',
  },
  {
    id: 'pip',
    name: 'Pip',
    subtitle: 'Dog Buddy',
    accentColor: '#FF6B4A',
    bgTint: '#FFEDE8',
    emojiFallback: '🐶',
    description: 'Energetic cheerleader who celebrates every streak, star, and quiz milestone.',
  },
  {
    id: 'zuri',
    name: 'Zuri',
    subtitle: 'Robot Pro',
    accentColor: '#3B82F6',
    bgTint: '#DBEAFE',
    emojiFallback: '🤖',
    description: 'Precision AI companion specialized in STEM formulas, diagrams, and step-by-step proofs.',
    isPremiumEligible: true,
  },
];

export function getCompanionById(id: CompanionId): CompanionConfig {
  return COMPANION_REGISTRY.find((c) => c.id === id) ?? COMPANION_REGISTRY[0];
}
