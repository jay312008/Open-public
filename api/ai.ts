// Vercel Serverless Function: Server-side NVIDIA NIM AI Gateway for LearnyMol
// Set NVIDIA_API_KEY in Vercel Dashboard -> Project -> Settings -> Environment Variables.
// Never put NVIDIA_API_KEY in EXPO_PUBLIC_* or client code.

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

interface VercelRequestLike {
  method?: string;
  url?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown> | string;
}

interface VercelResponseLike {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => VercelResponseLike;
  json: (body: unknown) => void;
  end: (body?: string) => void;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callNvidia(
  messages: ChatMessage[],
  maxTokens = 850,
  jsonMode = false
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-bolt-e4b';

  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not set in Vercel Environment Variables.');
  }

  const makeBody = (useJsonMode: boolean) =>
    JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
      ...(useJsonMode ? { response_format: { type: 'json_object' } } : {}),
    });

  let res = await fetch(NVIDIA_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: makeBody(jsonMode),
  });

  if (!res.ok && jsonMode && res.status === 400) {
    res = await fetch(NVIDIA_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: makeBody(false),
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NVIDIA NIM API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

function setCors(res: VercelResponseLike) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const hasSupabase = Boolean(
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL
    );
    res.status(200).json({
      ok: true,
      hasApiKey: Boolean(process.env.NVIDIA_API_KEY),
      hasSupabase,
      model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-bolt-e4b',
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rawRoute = req.query?.route;
    const route = Array.isArray(rawRoute) ? rawRoute.join('/') : rawRoute ?? 'chat';
    const body: Record<string, unknown> =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});

    if (route === 'chat') {
      const question = String(body.question ?? '').trim();
      const subject = body.subject ? String(body.subject) : 'general studies';
      const learningContext = body.learningContext ? String(body.learningContext).slice(0, 800) : '';
      const rawHistory = Array.isArray(body.history) ? body.history : [];
      const historyMsgs: ChatMessage[] = rawHistory
        .slice(-10)
        .filter((m): m is { role: string; content: string } => Boolean(m && typeof m === 'object' && 'content' in m))
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content).slice(0, 700),
        }));

      const userPrompt = [
        subject !== 'general studies' ? `[Subject: ${subject}]` : '',
        learningContext ? `[Student Learning Context: ${learningContext}]` : '',
        question,
      ]
        .filter(Boolean)
        .join('\n');

      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'You are Molly, a warm, attentive, 1-on-1 human-like tutor in LearnyMol. RULES: (1) ALWAYS listen carefully to the student\'s exact message and the conversation history — NEVER switch to an unrelated topic! (2) Talk naturally like a caring teacher sitting beside the student: clear, simple English, never robotic or overly dense. (3) For math/science equations, put each step on its own clean line so nothing is squeezed together. (4) NEVER use LaTeX backslashes (no \\rightarrow, \\frac, \\neq, \\sqrt, no $ signs) — use plain Unicode symbols (→, ≠, ≤, ≥, √, ±, ², ³, π, Ω, θ, ×, ÷). (5) If the student says "can you draw..." or asks for a visual/diagram/graph of what you were just discussing, draw THAT exact topic using a widget! Return ONLY raw valid JSON with schema: { "heading"?: string, "text": string, "equation"?: string, "steps"?: [{ "title": string, "detail": string }], "example"?: string, "tip"?: string, "widgets"?: Widget[] }. Keep steps/example/tip optional — only include them when they genuinely help answer the student\'s question. Widget types: (1) { "type":"function_plot", "title":string, "expression":string, "xMin"?:number, "xMax"?:number, "points"?:[{"x":number,"y":number,"label":string}], "caption":string } (2) { "type":"canvas_diagram", "title":string, "primitives":[{"kind":"line"|"circle"|"rect"|"path"|"text","x1"?:n,"y1"?:n,"x2"?:n,"y2"?:n,"cx"?:n,"cy"?:n,"r"?:n,"x"?:n,"y"?:n,"w"?:n,"h"?:n,"d"?:s,"content"?:s,"color"?:s,"fill"?:s}], "caption":string } on a 264x150 canvas (3) { "type":"chart", "title":string, "labels":string[], "values":number[], "unit"?:string, "caption":string } (4) { "type":"wave", "title":string, "variant":"transverse"|"longitudinal", "frequency":number, "amplitude":number, "caption":string } (5) { "type":"calculator", "title":string, "formulaExpr":string, "resultLabel":string, "variables":[{"name":string,"label":string,"defaultValue":number}] }.',
          },
          ...historyMsgs,
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        1600,
        true
      );

      const cleanLatex = (s: unknown): unknown => {
        if (typeof s === 'string') {
          return s
            .replace(/\\\\/g, '\\')
            .replace(/\\text\{([^}]+)\}/g, '$1')
            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
            .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
            .replace(/\\rightarrow|\\to/g, '→')
            .replace(/\\leftarrow/g, '←')
            .replace(/\\leftrightarrow/g, '↔')
            .replace(/\\Rightarrow/g, '⇒')
            .replace(/\\neq/g, '≠')
            .replace(/\\leq|\\le\b/g, '≤')
            .replace(/\\geq|\\ge\b/g, '≥')
            .replace(/\\approx/g, '≈')
            .replace(/\\Delta/g, 'Δ')
            .replace(/\\Omega/g, 'Ω')
            .replace(/\\pi/g, 'π')
            .replace(/\\theta/g, 'θ')
            .replace(/\\alpha/g, 'α')
            .replace(/\\beta/g, 'β')
            .replace(/\\lambda/g, 'λ')
            .replace(/\\infty/g, '∞')
            .replace(/\\times/g, '×')
            .replace(/\\div/g, '÷')
            .replace(/\\cdot/g, '·')
            .replace(/\\pm/g, '±')
            .replace(/\\degree|\^\\circ/g, '°')
            .replace(/\\sin/g, 'sin')
            .replace(/\\cos/g, 'cos')
            .replace(/\\tan/g, 'tan')
            .replace(/\\left|\\right/g, '')
            .replace(/\\([a-zA-Z]+)/g, '')
            .replace(/\^2\b/g, '²')
            .replace(/\^3\b/g, '³')
            .replace(/\$/g, '')
            .replace(/\\n/g, '\n')
            .trim();
        }
        if (Array.isArray(s)) return s.map(cleanLatex);
        if (s && typeof s === 'object') {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(s as Record<string, unknown>)) {
            out[k] = k === 'expression' || k === 'formulaExpr' ? v : cleanLatex(v);
          }
          return out;
        }
        return s;
      };

      const extractField = (src: string, field: string): string | undefined => {
        const m = src.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's'));
        return m ? (cleanLatex(m[1].replace(/\\"/g, '"')) as string) : undefined;
      };

      let parsed: Record<string, unknown> | null = null;
      const cleanedRaw = reply
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const firstBrace = cleanedRaw.indexOf('{');
      const lastBrace = cleanedRaw.lastIndexOf('}');
      const jsonSlice =
        firstBrace >= 0 && lastBrace > firstBrace
          ? cleanedRaw.slice(firstBrace, lastBrace + 1)
          : cleanedRaw;

      try {
        const repaired = jsonSlice
          .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
          .replace(/,\s*([}\]])/g, '$1');
        parsed = cleanLatex(JSON.parse(repaired)) as Record<string, unknown>;
      } catch {
        // Fallback: extract clean plain-English fields even if JSON was truncated or had unescaped quotes.
        // NEVER dump raw JSON braces/keys to the student!
        const heading = extractField(cleanedRaw, 'heading');
        const text = extractField(cleanedRaw, 'text');
        const equation = extractField(cleanedRaw, 'equation');
        const example = extractField(cleanedRaw, 'example');
        const tip = extractField(cleanedRaw, 'tip');
        if (text || heading) {
          parsed = {
            ...(heading ? { heading } : {}),
            text: text ?? heading ?? 'Here is your explanation.',
            ...(equation ? { equation } : {}),
            ...(example ? { example } : {}),
            ...(tip ? { tip } : {}),
          };
        } else {
          // Strip any stray JSON scaffolding if model emitted partial JSON
          const plain = String(cleanLatex(cleanedRaw))
            .replace(/^\{|\}$/g, '')
            .replace(/"[a-zA-Z_]+"\s*:\s*/g, '')
            .replace(/^\s*"|"\s*,?$/gm, '')
            .trim();
          parsed = { text: plain || 'Let me explain that step by step.' };
        }
      }

      // If the user explicitly asked to graph/plot an equation, guarantee a dynamic function_plot for THAT exact equation
      const eqMatch = question.match(/(?:y|f\(x\))\s*=\s*([0-9a-zA-Z+\-*/^().\s²³]+)/i);
      const asksGraph = /\b(graph|plot|sketch|curve|parabola|sine|cosine|function)\b/i.test(question);
      if (eqMatch && eqMatch[1] && asksGraph) {
        const expr = eqMatch[1].trim().replace(/²/g, '^2').replace(/³/g, '^3');
        const existing = Array.isArray(parsed.widgets) ? parsed.widgets : [];
        const hasPlot = existing.some((w: unknown) => (w as { type?: string })?.type === 'function_plot');
        if (!hasPlot) {
          parsed.widgets = [
            {
              type: 'function_plot',
              title: `Interactive Graph: y = ${expr}`,
              expression: expr,
              xMin: -6,
              xMax: 6,
              caption: `Live plot of y = ${expr}. Edit the equation or trace points below.`,
            },
            ...existing,
          ];
        }
      }

      res.status(200).json(parsed);
      return;
    }

    if (route === 'live-teacher/plan') {
      const topic = String(body.topic ?? 'Quadratic Equations');
      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'Return ONLY a raw JSON array (no markdown fences) of 4 lesson steps. Each step must have: { "id": string, "speechText": string, "durationMs": number, "boardElement": { "id": string, "type": "title"|"equation"|"diagram"|"example", "label": string, "content": string, "explanation": string } }.',
          },
          {
            role: 'user',
            content: `Create a 4-step interactive Live Teacher whiteboard lesson on: ${topic}`,
          },
        ],
        1100
      );

      const cleaned = reply.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      res.status(200).json(parsed);
      return;
    }

    if (route === 'exam-predictor') {
      const examType = String(body.examType ?? 'WAEC');
      const subject = String(body.subject ?? 'Mathematics');
      const topic = String(body.topic ?? 'Quadratic Equations');
      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'Return ONLY a raw JSON array (no markdown fences) of 3 predicted exam question objects: { "id": string, "question": string, "probability": "High"|"Medium", "markingTip": string }. Be realistic and never guarantee exam outcomes.',
          },
          {
            role: 'user',
            content: `Exam: ${examType}, Subject: ${subject}, Topic: ${topic}. Generate 3 realistic high-yield practice exam predictions with marking tips.`,
          },
        ],
        900
      );
      const cleaned = reply.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      res.status(200).json(JSON.parse(cleaned));
      return;
    }

    if (route === 'quiz-generator') {
      const subject = String(body.subject ?? 'Mathematics');
      const topic = String(body.topic ?? 'Quadratic Equations');
      const count = Math.min(20, Math.max(1, Number(body.count ?? 5)));
      const difficulty = String(body.difficulty ?? 'Medium');
      const tokenBudget = Math.min(3600, count * 180 + 400);
      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'You are a Cameroon GCE & University exam writer. Return ONLY raw valid JSON (no markdown fences, no LaTeX backslashes — use Unicode symbols like ², ×, →, ≠, π, Ω) with schema: { "questions": [{ "id": string, "prompt": string, "options": [string, string, string, string], "correctIndex": 0|1|2|3, "explanation": string }] }. You MUST generate the EXACT number of distinct questions requested.',
          },
          {
            role: 'user',
            content: `Generate EXACTLY ${count} distinct ${difficulty}-difficulty exam questions for ${subject} on topic "${topic}". Each question must have 4 realistic options, the right correctIndex (0-3), and a clear 1-2 sentence explanation.`,
          },
        ],
        tokenBudget,
        true
      );
      const cleaned = reply
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim()
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
        .replace(/,\s*([}\]])/g, '$1');
      const parsed = JSON.parse(cleaned);
      const list = Array.isArray(parsed) ? parsed : parsed?.questions ?? [];
      res.status(200).json({ questions: list });
      return;
    }

    if (route === 'timetable') {
      const examDate = String(body.examDate ?? 'Upcoming Exam');
      const subjects = Array.isArray(body.subjects) ? body.subjects.map(String) : ['Mathematics', 'Physics'];
      const educationLevel = String(body.educationLevel ?? 'O-Level');
      const weakTopics = Array.isArray(body.weakTopics) ? body.weakTopics.map(String) : [];
      const recentActivity = Array.isArray(body.recentActivity) ? body.recentActivity.map(String) : [];

      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'You are LearnyMol AI Study Planner. Return ONLY raw valid JSON (no markdown fences) with schema: { "slots": [{ "day": "Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun", "timeRange": string (e.g. "90 min" or "16:00 – 17:30"), "subjectName": string, "topic": string (specific exam-level topic action like "Study Thermodynamics and Heat Transfer" or "Review Classical Mechanics"), "priority": "weak_point"|"core"|"revision" }] }. Generate 6 to 10 realistic study slots across the week prioritizing weak topics first, matched strictly to the student education level and selected subjects.',
          },
          {
            role: 'user',
            content: `Exam Date: ${examDate}\nEducation Level: ${educationLevel}\nSelected Subjects: ${subjects.join(', ')}\nTracked Weak Topics: ${weakTopics.length ? weakTopics.join(', ') : 'None yet — cover core syllabus foundations'}\nRecent Student Activity: ${recentActivity.length ? recentActivity.slice(0, 12).join('; ') : 'New study plan'}`,
          },
        ],
        1400,
        true
      );

      const cleaned = reply
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim()
        .replace(/,\s*([}\]])/g, '$1');
      const parsed = JSON.parse(cleaned);
      res.status(200).json(parsed);
      return;
    }

    if (route === 'topic-notes') {
      const subject = String(body.subject ?? 'General');
      const level = String(body.level ?? 'O-Level');
      const topic = String(body.topic ?? 'Core Topic');
      const mode = String(body.mode ?? 'initial'); // 'initial' | 'continue'
      const previousSections = Array.isArray(body.previousSections)
        ? body.previousSections.map(String).slice(0, 25)
        : [];
      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'You are a master Cameroon GCE & University teacher creating complete, classroom-ready digital textbook notes. NEVER use LaTeX backslashes (no \\frac, \\rightarrow, \\neq, no $ signs) — use clean Unicode (→, ≠, ≤, ≥, √, ±, ², ³, π, Ω, θ, ×, ÷). For any math/science worked example, use the clear 9-step presentation (Question, Known values, Required, Formula, Variables, Substitution, Calculation step-by-step on separate lines, Final Answer with unit, Interpretation). Return ONLY raw valid JSON with schema: { "title": string, "introduction": string, "objectives": string[], "keyTerms": [{ "term": string, "definition": string }], "sections": [{ "heading": string, "body": string }], "workedExample": string, "commonMistakes": string, "examTip": string, "summaryPoints": string[], "exercises": [{ "question": string, "solution": string }], "widgets"?: Widget[] }. Include a dynamic visual widget (function_plot, wave, canvas_diagram, chart, or calculator) whenever the topic benefits from visual learning (e.g. Waves, Functions, Forces, Circuits, Cells, Bonding).',
          },
          {
            role: 'user',
            content:
              mode === 'continue'
                ? `Write the NEXT continuation part of the ${level} ${subject} lesson on "${topic}". STRICTLY DO NOT repeat any of these already-covered sections: [${previousSections.join(', ')}]. Teach brand-new subtopics, deeper exam applications, a fresh 9-step worked example, and 2 new practice exercises.`
                : `Write a complete, thorough ${level} ${subject} classroom lesson on "${topic}" aligned strictly to ${level} depth (never mix O-Level and A-Level). Include introduction, 3 learning objectives, 3-4 key terms, 3-4 detailed subtopic sections, a clear 9-step worked example (if applicable) or real-world demonstration, common mistakes, summary points, and 2 practice exercises with solutions.`,
          },
        ],
        2000,
        true
      );
      const cleaned = reply
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim()
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
        .replace(/,\s*([}\]])/g, '$1');
      res.status(200).json(JSON.parse(cleaned));
      return;
    }

    if (route === 'flashcards') {
      const subject = String(body.subject ?? 'General');
      const topic = String(body.topic ?? 'Core Topic');
      const count = Math.min(20, Math.max(5, Number(body.count ?? 10)));
      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'Return ONLY raw valid JSON (no markdown fences, no LaTeX backslashes) with schema: { "cards": [{ "front": string, "back": string }] }. Make each front a crisp exam prompt/definition question and each back a clear 1-2 sentence answer.',
          },
          {
            role: 'user',
            content: `Generate ${count} high-yield revision flashcards for ${subject} on "${topic}".`,
          },
        ],
        1600,
        true
      );
      const cleaned = reply.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim().replace(/,\s*([}\]])/g, '$1');
      res.status(200).json(JSON.parse(cleaned));
      return;
    }

    if (route === 'grade-essay') {
      const subject = String(body.subject ?? 'General');
      const topic = String(body.topic ?? 'Core Topic');
      const answer = String(body.answer ?? '').trim();
      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'You are a fair GCE/University examiner. Return ONLY raw valid JSON (no markdown fences, no LaTeX backslashes) with schema: { "score": number (0-100), "strengths": string, "missing": string, "modelAnswer": string }. Award partial marks fairly for equivalent wording.',
          },
          {
            role: 'user',
            content: `Subject: ${subject}\nTopic: ${topic}\nStudent Written Answer:\n${answer.slice(0, 2000)}`,
          },
        ],
        900,
        true
      );
      const cleaned = reply.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim().replace(/,\s*([}\]])/g, '$1');
      res.status(200).json(JSON.parse(cleaned));
      return;
    }

    const reply = await callNvidia([
      {
        role: 'system',
        content:
          'You are Molly, an educational AI assistant for LearnyMol. Provide clear, accurate, student-friendly output.',
      },
      {
        role: 'user',
        content: `Task: ${route}\nInput: ${JSON.stringify(body)}`,
      },
    ]);

    res.status(200).json({ text: reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server AI Gateway error';
    res.status(500).json({ error: message });
  }
}
