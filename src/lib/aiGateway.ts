import { LiveLessonStep } from '@/types/models';

const AI_GATEWAY_URL = process.env.EXPO_PUBLIC_AI_GATEWAY_URL ?? '';

export const isLiveAIGatewayConfigured =
  Boolean(AI_GATEWAY_URL) && !AI_GATEWAY_URL.includes('your-ai-gateway');

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

export async function askMollyAI(
  question: string,
  subject?: string
): Promise<AIResponse<{ text: string; equation?: string }>> {
  const remote = await postToGateway<{ text: string; equation?: string }>('/chat', {
    question,
    subject,
  });
  if (remote) {
    return { data: remote, source: 'live-gateway' };
  }

  const q = question.toLowerCase();
  if (q.includes('quadratic')) {
    return {
      source: 'local-prototype',
      data: {
        text: 'A quadratic equation has the standard form ax² + bx + c = 0 where a ≠ 0. You can solve it by factoring, completing the square, or using the quadratic formula. The discriminant Δ = b² - 4ac tells you how many real roots exist.',
        equation: 'x = (-b ± √(b² - 4ac)) / 2a',
      },
    };
  }
  if (q.includes('bond') || q.includes('chemistry') || q.includes('ionic') || q.includes('covalent')) {
    return {
      source: 'local-prototype',
      data: {
        text: 'Chemical bonding happens so atoms achieve a stable outer electron shell. Ionic bonds transfer electrons (usually metal + non-metal, like NaCl), while covalent bonds share electron pairs between non-metals (like H₂O).',
        equation: 'Na → Na⁺ + e⁻   |   Cl + e⁻ → Cl⁻   ⇒   NaCl',
      },
    };
  }
  if (q.includes('force') || q.includes('newton') || q.includes('motion') || q.includes('physics')) {
    return {
      source: 'local-prototype',
      data: {
        text: "Newton's Second Law states that the net force acting on an object equals its mass multiplied by its acceleration. If you double the net force on the same mass, the acceleration doubles.",
        equation: 'F = m × a   (Newtons = kg · m/s²)',
      },
    };
  }
  return {
    source: 'local-prototype',
    data: {
      text: `Great question about "${question}"! Here is a structured breakdown:\n1. Identify the core concept and given values.\n2. Connect it to the main rule or formula for ${subject ?? 'this topic'}.\n3. Test your understanding with a short practice problem.\n\n(Prototype response — connect EXPO_PUBLIC_AI_GATEWAY_URL for live AI tutoring.)`,
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
