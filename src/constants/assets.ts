import { ImageSourcePropType } from 'react-native';

export const BrandAssets = {
  appIcon: require('../../assets/images/icon.png') as ImageSourcePropType,
  mascotTransparent: require('../../assets/images/logo-mascot-transparent.png') as ImageSourcePropType,
  splashIcon: require('../../assets/images/splash-icon.png') as ImageSourcePropType,
};

export const HomeCardAssets = {
  subjectsBg: require('../../assets/images/home/subjects_card_bg.jpg') as ImageSourcePropType,
  subjectsFg: require('../../assets/images/home/subjects_card_fg.png') as ImageSourcePropType,
  askMollyBg: require('../../assets/images/home/ask_molly_bg.jpg') as ImageSourcePropType,
  askMollyFg: require('../../assets/images/home/ask_molly_fg.png') as ImageSourcePropType,
  learningJourneyBg: require('../../assets/images/home/learning_journey_bg.jpg') as ImageSourcePropType,
  quizGeneratorBg: require('../../assets/images/home/quiz_generator_bg.jpg') as ImageSourcePropType,
  quizGeneratorFg: require('../../assets/images/home/quiz_generator_fg.png') as ImageSourcePropType,
  imageAnalyzerBg: require('../../assets/images/home/image_analyzer_bg.jpg') as ImageSourcePropType,
  imageAnalyzerFg: require('../../assets/images/home/image_analyzer_fg.png') as ImageSourcePropType,
  bookAnalyzerBg: require('../../assets/images/home/book_analyzer_bg.jpg') as ImageSourcePropType,
  bookAnalyzerFg: require('../../assets/images/home/book_analyzer_fg.png') as ImageSourcePropType,
};

export const SubjectCardAssets = {
  mathBg: require('../../assets/images/subjects/math_bg.jpg') as ImageSourcePropType,
  scienceBg: require('../../assets/images/subjects/science_bg.jpg') as ImageSourcePropType,
  humanitiesBg: require('../../assets/images/subjects/humanities_bg.jpg') as ImageSourcePropType,
  techBg: require('../../assets/images/subjects/tech_bg.jpg') as ImageSourcePropType,
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
