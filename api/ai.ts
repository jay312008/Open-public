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

async function callNvidia(messages: ChatMessage[], maxTokens = 850): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-bolt-e4b';

  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not set in Vercel Environment Variables.');
  }

  const res = await fetch(NVIDIA_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.35,
      max_tokens: maxTokens,
    }),
  });

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
              'You are Molly, a warm, orderly AI tutor in LearnyMol. Return ONLY raw valid JSON (no markdown fences) with schema: { "heading": string, "text": string, "equation"?: string, "steps"?: [{ "title": string, "detail": string }], "example"?: string, "tip"?: string, "widgets"?: Widget[] }. Keep explanations clean and orderly. Generate DYNAMIC widgets tailored strictly to the exact question (never reuse an unrelated graph!): Widget types: (1) { "type":"function_plot", "title":string, "expression":string (valid math in x like "2*x+3", "sin(x)", "x^3-3*x", "x^2-4*x+3"), "xMin"?:number, "xMax"?:number, "points"?:[{"x":number,"y":number,"label":string}], "caption":string } (2) { "type":"canvas_diagram", "title":string, "primitives":[{"kind":"line"|"circle"|"rect"|"path"|"text","x1"?:n,"y1"?:n,"x2"?:n,"y2"?:n,"cx"?:n,"cy"?:n,"r"?:n,"x"?:n,"y"?:n,"w"?:n,"h"?:n,"d"?:s,"content"?:s,"color"?:s,"fill"?:s}], "caption":string } on a 264x150 canvas (3) { "type":"chart", "title":string, "labels":string[], "values":number[], "unit"?:string, "caption":string } (4) { "type":"wave", "title":string, "variant":"transverse"|"longitudinal", "frequency":number, "amplitude":number, "caption":string } (5) { "type":"calculator", "title":string, "formulaExpr":string, "resultLabel":string, "variables":[{"name":string,"label":string,"defaultValue":number}] }. Omit widgets for simple greetings.',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        1100
      );

      try {
        const cleaned = reply.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        res.status(200).json(parsed);
      } catch {
        res.status(200).json({ text: reply });
      }
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
      const count = Math.min(8, Math.max(2, Number(body.count ?? 4)));
      const difficulty = String(body.difficulty ?? 'Medium');
      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'Return ONLY a raw JSON array (no markdown fences) of multiple-choice quiz objects: { "id": string, "prompt": string, "options": [string, string, string, string], "correctIndex": 0|1|2|3, "explanation": string }.',
          },
          {
            role: 'user',
            content: `Generate ${count} ${difficulty}-difficulty multiple-choice questions for ${subject} on topic "${topic}".`,
          },
        ],
        1300
      );
      const cleaned = reply.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
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
