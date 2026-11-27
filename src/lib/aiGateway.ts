import { LiveLessonStep } from '@/types/models';
import { ChatWidgetSpec } from '@/components/chat/ChatVisualWidget';

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
  error?: string;
}

async function postToGatewayDetailed<T>(
  path: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error?: string }> {
  if (!isLiveAIGatewayConfigured) return { data: null };
  try {
    const res = await fetch(`${AI_GATEWAY_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (!res.ok) {
      const msg =
        (parsed && typeof parsed.error === 'string' && parsed.error) ||
        `HTTP ${res.status}: ${text.slice(0, 180)}`;
      return { data: null, error: msg };
    }
    return { data: parsed as T };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Network error calling AI gateway',
    };
  }
}

async function postToGateway<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  const { data } = await postToGatewayDetailed<T>(path, body);
  return data;
}

export interface MollyChatReply {
  heading?: string;
  text: string;
  equation?: string;
  steps?: { title: string; detail: string }[];
  example?: string;
  tip?: string;
  widgets?: ChatWidgetSpec[];
}

export async function askMollyAI(
  question: string,
  subject?: string,
  learningContext?: string
): Promise<AIResponse<MollyChatReply>> {
  if (isLiveAIGatewayConfigured) {
    const remote = await postToGatewayDetailed<MollyChatReply>('/chat', {
      question,
      subject,
      learningContext,
    });
    if (remote.data && remote.data.text) {
      return { data: remote.data, source: 'live-gateway' };
    }
    if (remote.error) {
      return {
        source: 'live-gateway',
        error: remote.error,
        data: {
          heading: 'Live AI Gateway Error',
          text: `Your Vercel server returned an error instead of a live AI answer:\n\n${remote.error}\n\nCheck Vercel → Project Settings → Environment Variables and make sure NVIDIA_API_KEY is saved and redeployed.`,
        },
      };
    }
  }

  // Offline / GitHub Pages prototype fallback (only used when no live gateway URL is present)
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
        text: 'What are we studying today? Ask me to graph any equation (like y = 2x + 3 or y = sin(x)), describe waves, or explain a science topic!',
      },
    };
  }

  // Dynamic equation extraction even in offline mode (e.g. "graph y = 2x + 3" or "plot sin(x)")
  const eqMatch = question.match(/y\s*=\s*([0-9a-zA-Z+\-*/^().\s²³]+)/i);
  if (eqMatch && eqMatch[1]) {
    const expr = eqMatch[1].trim();
    return {
      source: 'local-prototype',
      data: {
        heading: `Graph of y = ${expr}`,
        text: `Here is the live interactive plot of y = ${expr}. You can edit the equation directly on the graph board below to explore how it changes!`,
        equation: `y = ${expr}`,
        widgets: [
          {
            type: 'function_plot',
            title: `Graph of y = ${expr}`,
            expression: expr,
            caption: 'Edit the equation above or tap Zoom +/- to inspect the curve',
          },
        ],
      },
    };
  }

  if (q.includes('wave')) {
    return {
      source: 'local-prototype',
      data: {
        heading: "Let's break down Waves step by step!",
        text: 'A wave transfers energy from one place to another without permanently moving matter.',
        equation: 'v = f × λ   (Wave Speed = Frequency × Wavelength)',
        steps: [
          { title: 'Transverse Waves', detail: 'Particles vibrate perpendicular to wave travel (light, water ripples).' },
          { title: 'Longitudinal Waves', detail: 'Particles vibrate parallel in compressions & rarefactions (sound).' },
        ],
        example: 'If f = 50 Hz and λ = 2 m, wave speed v = 50 × 2 = 100 m/s.',
        widgets: [
          { type: 'wave', title: 'Interactive Wave & Ruler Board', variant: 'transverse', frequency: 2, amplitude: 26 },
          {
            type: 'calculator',
            title: 'Wave Speed Calculator (v = f · λ)',
            formulaExpr: 'f * l',
            resultLabel: 'Wave Speed (m/s)',
            variables: [
              { name: 'f', label: 'Freq f (Hz)', defaultValue: 50 },
              { name: 'l', label: 'λ (m)', defaultValue: 2 },
            ],
          },
        ],
      },
    };
  }

  if (q.includes('quadratic') || q.includes('parabola')) {
    return {
      source: 'local-prototype',
      data: {
        heading: "Let's break down Quadratic Equations step by step.",
        text: 'A quadratic equation is a second-degree polynomial equation in standard form:',
        equation: 'ax² + bx + c = 0   where a ≠ 0',
        steps: [
          { title: 'Identify a, b and c.', detail: 'These are the coefficients in the equation.' },
          { title: 'Find the roots.', detail: 'Factor or apply x = (-b ± √(b² - 4ac)) / 2a.' },
        ],
        example: 'For y = x² - 4x + 3, the roots are x = 1 and x = 3, with vertex at (2, -1).',
        widgets: [
          {
            type: 'function_plot',
            title: 'Graph of y = x² - 4x + 3',
            expression: 'x^2 - 4*x + 3',
            points: [
              { x: 1, y: 0, label: '(1,0)' },
              { x: 3, y: 0, label: '(3,0)' },
              { x: 2, y: -1, label: 'Vertex (2,-1)' },
            ],
            caption: 'Edit the equation above to plot any other curve live!',
          },
          {
            type: 'calculator',
            title: 'Discriminant Calculator (Δ = b² - 4ac)',
            formulaExpr: 'b^2 - 4*a*c',
            resultLabel: 'Discriminant Δ',
            variables: [
              { name: 'a', label: 'a', defaultValue: 1 },
              { name: 'b', label: 'b', defaultValue: -4 },
              { name: 'c', label: 'c', defaultValue: 3 },
            ],
          },
        ],
      },
    };
  }

  return {
    source: 'local-prototype',
    data: {
      heading: `Offline Preview Mode`,
      text: `You are viewing the static preview (no live AI server attached). Open your Vercel .vercel.app deployment to get live NVIDIA AI answers and custom diagrams for "${question}"!`,
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
