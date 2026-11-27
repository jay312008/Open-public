import { LiveLessonStep } from '@/types/models';

function resolveGatewayUrl(): string {
  const configured = process.env.EXPO_PUBLIC_AI_GATEWAY_URL ?? '';
  if (configured && !configured.includes('your-ai-gateway') && !configured.includes('your-project-id')) {
    return configured.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.vercel.app')) {
    return '/api/ai';
  }
  return '';
}

const AI_GATEWAY_URL = resolveGatewayUrl();

export const isLiveAIGatewayConfigured = Boolean(AI_GATEWAY_URL);

export interface AIResponse<T> {
  data: T;
  source: 'live-gateway' | 'local-prototype';
}

async function postToGateway<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  if (!isLiveAIGatewayConfigured) return null;
  try {
    const res = await fetch(`${AI_GATEWAY_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface MollyChatReply {
  heading?: string;
  text: string;
  equation?: string;
  steps?: { title: string; detail: string }[];
  example?: string;
  tip?: string;
  widgets?: {
    type: 'wave' | 'parabola' | 'geometry' | 'calculator' | 'science_diagram';
    title?: string;
    caption?: string;
    variant?: string;
  }[];
}

export async function askMollyAI(
  question: string,
  subject?: string
): Promise<AIResponse<MollyChatReply>> {
  const remote = await postToGateway<MollyChatReply>('/chat', {
    question,
    subject,
  });
  if (remote && remote.text) {
    return { data: remote, source: 'live-gateway' };
  }

  const q = question.toLowerCase().trim();
  const isGreeting =
    /^(hi|hey|hello|yo|sup|hiya|good morning|good afternoon|good evening|how are you|what'?s up)[!.,?\s]*$/.test(
      q
    );
  if (isGreeting) {
    return {
      source: 'local-prototype',
      data: {
        heading: "Hey there! 👋 I'm Molly.",
        text: 'What are we studying today? Try asking me to describe waves, explain quadratic equations, draw a right triangle, or explain chemical bonding!',
      },
    };
  }
  if (q.includes('wave')) {
    return {
      source: 'local-prototype',
      data: {
        heading: "Let's break down Waves step by step!",
        text: 'A wave is a disturbance that transfers energy from one place to another without permanently moving matter.',
        equation: 'v = f × λ   (Wave Speed = Frequency × Wavelength)',
        steps: [
          { title: 'Transverse Waves', detail: 'Particles vibrate perpendicular (up & down) to wave travel — e.g., light and water ripples.' },
          { title: 'Longitudinal Waves', detail: 'Particles vibrate parallel (back & forth) in compressions and rarefactions — e.g., sound waves.' },
          { title: 'Key Measurements', detail: 'Amplitude (A) measures wave height; Wavelength (λ) is the distance between two crests.' },
        ],
        example: 'If a wave has frequency f = 50 Hz and wavelength λ = 2 m, its speed is v = 50 × 2 = 100 m/s.',
        tip: 'Use the interactive ruler board & calculator below to test different frequencies and wave speeds!',
        widgets: [
          { type: 'wave', title: 'Interactive Wave & Ruler Board', variant: 'transverse', caption: 'Toggle Transverse / Longitudinal or adjust Frequency & Amplitude' },
          { type: 'calculator', title: 'Wave Speed Calculator', variant: 'wave' },
        ],
      },
    };
  }
  if (q.includes('quadratic') || q.includes('parabola')) {
    return {
      source: 'local-prototype',
      data: {
        heading: "Sure! Let's break down Quadratic Equations step by step.",
        text: 'A quadratic equation is a second-degree polynomial equation in standard form:',
        equation: 'ax² + bx + c = 0   where a ≠ 0',
        steps: [
          { title: 'Identify a, b and c.', detail: 'These are the coefficients in the equation.' },
          { title: 'Find the solutions (roots).', detail: 'Factor or use x = (-b ± √(b² - 4ac)) / 2a.' },
          { title: 'Interpret the graph.', detail: 'The roots are where the parabola crosses the x-axis.' },
        ],
        example: 'For x² - 5x + 6 = 0, factoring gives (x - 2)(x - 3) = 0, so x = 2 and x = 3.',
        widgets: [
          { type: 'parabola', title: 'Interactive Parabola Graph' },
          { type: 'calculator', title: 'Quadratic Root Calculator' },
        ],
      },
    };
  }
  if (q.includes('triangle') || q.includes('pythagoras') || q.includes('circle') || q.includes('geometry')) {
    const isCircle = q.includes('circle');
    return {
      source: 'local-prototype',
      data: {
        heading: isCircle ? "Let's explore Circle Geometry!" : "Let's explore the Pythagorean Theorem!",
        text: isCircle
          ? 'A circle is the set of all points at a fixed distance (radius r) from its center.'
          : 'In any right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides.',
        equation: isCircle ? 'Area = πr²   |   Circumference = 2πr' : 'a² + b² = c²',
        steps: [
          { title: 'Identify known lengths', detail: isCircle ? 'Measure the radius r from center to edge.' : 'Label the two perpendicular sides a and b.' },
          { title: 'Apply the formula', detail: isCircle ? 'Substitute r into πr² or 2πr.' : 'Compute √(a² + b²) to find hypotenuse c.' },
        ],
        widgets: [{ type: 'geometry', variant: isCircle ? 'circle' : 'triangle' }],
      },
    };
  }
  if (q.includes('bond') || q.includes('chemistry') || q.includes('ionic') || q.includes('covalent')) {
    return {
      source: 'local-prototype',
      data: {
        heading: "Let's master Chemical Bonding!",
        text: 'Atoms bond so they can achieve a full, stable outer electron shell.',
        equation: 'Na → Na⁺ + e⁻   |   H — O — H (Covalent)',
        steps: [
          { title: 'Ionic Bonding', detail: 'A metal transfers electrons to a non-metal (e.g., NaCl).' },
          { title: 'Covalent Bonding', detail: 'Two non-metals share electron pairs (e.g., H₂O).' },
        ],
        widgets: [{ type: 'science_diagram', variant: 'bonding' }],
      },
    };
  }
  if (q.includes('photosynthesis') || q.includes('biology') || q.includes('cell')) {
    return {
      source: 'local-prototype',
      data: {
        heading: "How Photosynthesis Works",
        text: 'Plant chloroplasts use chlorophyll to capture sunlight and convert CO₂ and water into glucose and oxygen.',
        equation: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂',
        widgets: [{ type: 'science_diagram', variant: 'photosynthesis' }],
      },
    };
  }
  return {
    source: 'local-prototype',
    data: {
      heading: `Let's look at "${question}"`,
      text: `I'm ready to help! On your live Vercel deployment, NVIDIA AI answers any topic in structured steps and interactive boards. In offline preview, try asking about Waves, Quadratic Equations, Triangles/Circles, Chemical Bonding, or Photosynthesis!`,
    },
  };
}

export async function generateLiveLessonSteps(
  topic: string
): Promise<AIResponse<LiveLessonStep[]>> {
  const remote = await postToGateway<LiveLessonStep[]>('/live-teacher/plan', { topic });
  if (remote && remote.length > 0) {
    return { data: remote, source: 'live-gateway' };
  }

  const lower = topic.toLowerCase();
  if (lower.includes('chemical') || lower.includes('bond')) {
    return {
      source: 'local-prototype',
      data: [
        {
          id: 'step-1',
          speechText: 'Welcome to Live Teacher! Today we are exploring Chemical Bonding and why atoms connect to form stable molecules.',
          durationMs: 4200,
          boardElement: {
            id: 'el-1',
            type: 'title',
            label: 'Lesson Topic',
            content: 'Chemical Bonding: Ionic vs Covalent',
            explanation: 'Atoms form bonds to reach a full outer electron shell (the octet rule).',
          },
        },
        {
          id: 'step-2',
          speechText: 'First, in an ionic bond, a metal atom transfers one or more electrons to a non-metal atom, creating opposite charges that attract.',
          durationMs: 5200,
          boardElement: {
            id: 'el-2',
            type: 'equation',
            label: 'Ionic Transfer',
            content: 'Na (2,8,1) + Cl (2,8,7) → Na⁺ [2,8] + Cl⁻ [2,8,8]',
            explanation: 'Sodium loses 1 valence electron and Chlorine gains it, forming strong electrostatic attraction.',
          },
        },
        {
          id: 'step-3',
          speechText: 'In a covalent bond, two non-metals share pairs of electrons instead of transferring them, as in a water molecule.',
          durationMs: 5000,
          boardElement: {
            id: 'el-3',
            type: 'diagram',
            label: 'Covalent Sharing',
            content: 'H — O — H   (2 shared electron pairs)',
            explanation: 'Oxygen shares one electron with each Hydrogen so all atoms fill their outer shells.',
          },
        },
        {
          id: 'step-4',
          speechText: 'Quick check: tap any card on the board if you want me to re-explain it, or tell me what type of bond forms between Magnesium and Oxygen!',
          durationMs: 4800,
          boardElement: {
            id: 'el-4',
            type: 'note',
            label: 'Checkpoint',
            content: 'Mg (metal) + O (non-metal) → Ionic Bond (MgO)',
            explanation: 'Because Magnesium is a metal and Oxygen is a non-metal, electrons transfer to form Mg²⁺ and O²⁻.',
          },
        },
      ],
    };
  }

  return {
    source: 'local-prototype',
    data: [
      {
        id: 'step-1',
        speechText: `Welcome to Live Teacher! Let's master ${topic} step by step on our interactive board.`,
        durationMs: 4200,
        boardElement: {
          id: 'el-1',
          type: 'title',
          label: 'Lesson Topic',
          content: topic || 'Quadratic Equations',
          explanation: 'A quadratic equation is a second-degree polynomial equation in a single variable x.',
        },
      },
      {
        id: 'step-2',
        speechText: 'Start with the standard form: a x squared plus b x plus c equals zero, where a is not zero.',
        durationMs: 4800,
        boardElement: {
          id: 'el-2',
          type: 'equation',
          label: 'Standard Form',
          content: 'ax² + bx + c = 0   (a ≠ 0)',
          explanation: 'Identifying a, b, and c accurately is the first step before factoring or using the formula.',
        },
      },
      {
        id: 'step-3',
        speechText: 'Let us solve x squared minus 5 x plus 6 equals zero by factoring into two binomials.',
        durationMs: 5000,
        boardElement: {
          id: 'el-3',
          type: 'step',
          label: 'Worked Example',
          content: 'x² - 5x + 6 = 0  ⇒  (x - 2)(x - 3) = 0',
          explanation: 'We look for two numbers that multiply to +6 and add to -5: those are -2 and -3.',
        },
      },
      {
        id: 'step-4',
        speechText: 'Setting each factor to zero gives the two roots: x equals 2 and x equals 3. Tap any board card to re-explain!',
        durationMs: 4800,
        boardElement: {
          id: 'el-4',
          type: 'note',
          label: 'Final Roots',
          content: 'x = 2   or   x = 3',
          explanation: 'Check by substituting x = 2: 4 - 10 + 6 = 0. Both roots satisfy the equation!',
        },
      },
    ],
  };
}

export async function generateExamPredictions(params: {
  examType: string;
  subject: string;
  topic: string;
}): Promise<
  AIResponse<
    { id: string; question: string; probability: 'High' | 'Medium'; markingTip: string }[]
  >
> {
  const remote = await postToGateway<
    { id: string; question: string; probability: 'High' | 'Medium'; markingTip: string }[]
  >('/exam-predictor', params);
  if (remote) return { data: remote, source: 'live-gateway' };

  return {
    source: 'local-prototype',
    data: [
      {
        id: 'pred-1',
        question: `Solve and interpret a multi-step ${params.topic} problem under ${params.examType} marking criteria.`,
        probability: 'High',
        markingTip: 'Show all intermediate working clearly — method marks account for 60% of the score.',
      },
      {
        id: 'pred-2',
        question: `Compare two key principles in ${params.topic} (${params.subject}) using a labeled diagram or formula.`,
        probability: 'High',
        markingTip: 'Include units and state definitions concisely before giving your example.',
      },
      {
        id: 'pred-3',
        question: `Apply ${params.topic} to a real-world scenario and justify your conclusion.`,
        probability: 'Medium',
        markingTip: 'Check edge cases and round final numerical answers to 2 decimal places.',
      },
    ],
  };
}

export async function generateQuizQuestions(params: {
  subject: string;
  topic: string;
  count: number;
  difficulty: string;
}): Promise<
  AIResponse<
    { id: string; prompt: string; options: string[]; correctIndex: number; explanation: string }[]
  >
> {
  const remote = await postToGateway<
    { id: string; prompt: string; options: string[]; correctIndex: number; explanation: string }[]
  >('/quiz-generator', params);
  if (remote) return { data: remote, source: 'live-gateway' };

  const bank = [
    {
      id: 'q-1',
      prompt: `Which statement best describes the core rule of ${params.topic} in ${params.subject}?`,
      options: [
        'It links foundational definitions directly to measurable outcomes.',
        'It only applies when all variables are zero.',
        'It ignores conservation or balance laws.',
        'It cannot be represented mathematically or structurally.',
      ],
      correctIndex: 0,
      explanation: `In ${params.topic}, connecting definitions to measurable relationships is the key principle.`,
    },
    {
      id: 'q-2',
      prompt: `What is the most common mistake students make when solving ${params.topic} (${params.difficulty}) problems?`,
      options: [
        'Writing down the formula first',
        'Skipping sign checks or unit conversions',
        'Verifying the final answer',
        'Drawing a quick sketch',
      ],
      correctIndex: 1,
      explanation: 'Sign errors and unit mismatches are the #1 cause of lost marks on exams.',
    },
    {
      id: 'q-3',
      prompt: `When reviewing ${params.topic} before an exam, which strategy gives the highest retention?`,
      options: [
        'Passive rereading without practice',
        'Active recall with timed practice questions',
        'Memorizing only the chapter title',
        'Skipping worked examples',
      ],
      correctIndex: 1,
      explanation: 'Active recall and spaced practice consistently outperform passive rereading.',
    },
  ];
  return {
    source: 'local-prototype',
    data: bank.slice(0, Math.max(1, Math.min(params.count, bank.length))),
  };
}
