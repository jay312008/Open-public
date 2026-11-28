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

type MessageContent =
  | string
  | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

async function callNvidia(
  messages: ChatMessage[],
  maxTokens = 850,
  jsonMode = false,
  modelOverride?: string
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = modelOverride || process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-bolt-e4b';

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
      const companionName = body.companionName ? String(body.companionName).slice(0, 30) : 'Molly';
      const educationLevel = body.educationLevel ? String(body.educationLevel).slice(0, 40) : 'O-Level / Secondary';
      const imageBase64 = typeof body.imageBase64 === 'string' && body.imageBase64.startsWith('data:image/')
        ? body.imageBase64
        : undefined;
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
        `[Student Level: ${educationLevel}]`,
        subject !== 'general studies' ? `[Subject: ${subject}]` : '',
        learningContext ? `[Student Learning Context: ${learningContext}]` : '',
        question || (imageBase64 ? 'Please read, describe, and explain what is in this uploaded image step by step.' : ''),
      ]
        .filter(Boolean)
        .join('\n');

      const systemPrompt =
        `You are ${companionName}, an expert human-like tutor in LearnyMol teaching a ${educationLevel} student. CRITICAL RULES: (1) NEVER introduce yourself or say "Hello! I'm ${companionName}" — jump straight into teaching like a real teacher. ONLY state your name (${companionName}) if the student explicitly asks "what is your name?". (2) ALWAYS give thorough, clear, well-structured, easy-to-understand explanations tailored to ${educationLevel} — NEVER give short, rushed 2-sentence replies! Break concepts into clear numbered steps, simple everyday analogies, and concrete examples. If the student asks for a simpler explanation, explain it even more simply. (3) YOU HAVE A LIVE INTERACTIVE SVG CANVAS ("widgets"). NEVER EVER say "I cannot draw a picture" or apologize for not showing a diagram/symbol! Whenever a diagram, symbol, table, or graph helps — OR when the student asks for one — you MUST populate "widgets". (4) Put every equation step on its own clean line. NEVER use LaTeX backslashes (no \\frac, \\rightarrow, \\neq, no $ signs) or markdown *asterisks* — use plain Unicode (→, ≠, ≤, ≥, √, ±, ², ³, π, Ω, θ, ×, ÷). Return ONLY raw valid JSON: { "heading"?: string, "text": string, "equation"?: string, "steps"?: [{ "title": string, "detail": string }], "example"?: string, "tip"?: string, "widgets"?: Widget[] }. Widget types: (1) "canvas_diagram": { "type":"canvas_diagram", "title":string, "primitives":[...], "caption":string } on a 340x220 canvas — primitives: "arrow"(x1,y1,x2,y2,color,dashed?), "line"(x1,y1,x2,y2,color,dashed?), "polygon"(points:[{x,y}],color,fill?), "arc"(cx,cy,r,startAngle,endAngle,label?,color), "right_angle"(x,y,size?,dx?,dy?,color), "circle"(cx,cy,r,color,fill?), "rect"(x,y,w,h,color,fill?), "path"(d,color,fill?,dashed?), "text"(x,y,content,color,fontSize?). (2) "table": { "type":"table", "title":string, "headers":string[], "rows":string[][], "caption":string } (3) "function_plot": { "type":"function_plot", "title":string, "expression":string (ONLY single variable x, NEVER "="), "xMin"?:n, "xMax"?:n, "caption":string } (4) "molecule" / "periodic_table" / "wave" / "chart" / "model_3d" / "code_sim".`;

      let reply = '';
      if (imageBase64) {
        const visionModels = [
          'meta/llama-3.2-11b-vision-instruct',
          'nvidia/neva-22b',
          'microsoft/phi-3.5-vision-instruct',
        ];
        const visionMsgs: ChatMessage[] = [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: imageBase64 } },
            ],
          },
        ];
        for (const vm of visionModels) {
          try {
            reply = await callNvidia(visionMsgs, 2000, false, vm);
            if (reply) break;
          } catch {
            // try next vision model
          }
        }
        if (!reply) {
          reply = await callNvidia(
            [
              { role: 'system', content: systemPrompt },
              ...historyMsgs,
              {
                role: 'user',
                content: `${userPrompt}\n(Note: The student attached an image, but the vision model is temporarily unavailable. Ask them kindly to type or summarize the key question from the image if needed while helping with what they wrote.)`,
              },
            ],
            1800,
            true
          );
        }
      } else {
        reply = await callNvidia(
          [
            { role: 'system', content: systemPrompt },
            ...historyMsgs,
            { role: 'user', content: userPrompt },
          ],
          2400,
          true
        );
      }

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
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*\n]+)\*/g, '$1')
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

      // Auto-attach exact dynamic visual widgets when the student explicitly asks for a Periodic Table or Equation Graph
      if (/\bperiodic\s+table\b/i.test(question)) {
        const existing = Array.isArray(parsed.widgets) ? parsed.widgets : [];
        const hasPT = existing.some((w: unknown) => (w as { type?: string })?.type === 'periodic_table');
        if (!hasPT) {
          parsed.widgets = [
            {
              type: 'periodic_table',
              title: 'Interactive Periodic Table of Elements',
              caption: 'Tap any element tile to inspect its atomic number, mass, electron shells, and group.',
            },
            ...existing.filter((w: unknown) => (w as { type?: string })?.type !== 'canvas_diagram'),
          ];
        }
      }

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

      const recentContext = [
        ...historyMsgs.slice(-4).map((m) => (typeof m.content === 'string' ? m.content : '')),
        question,
        String(parsed.heading ?? ''),
      ].join(' ');
      const asksVisual =
        /\b(draw|diagram|visual|graph|sketch|illustrat|represent|show\s+me|symbol|dot[\s-]and[\s-]cross|shell|table|chart|plot|structure|where\s+is\s+the\s+(diagram|symbol|graph|visual|picture|drawing))\b/i.test(
          question
        );

      // Sanitize broken function_plot & empty/malformed canvas_diagram widgets so empty grids NEVER appear
      const sanitizeWidgets = (list: unknown[]): unknown[] => {
        const ALLOWED_IDENTS = new Set(['x', 'sin', 'cos', 'tan', 'sqrt', 'abs', 'log', 'ln', 'exp', 'pi', 'e']);
        const VALID_KINDS = new Set(['line', 'arrow', 'polygon', 'arc', 'right_angle', 'circle', 'rect', 'path', 'text']);
        return list
          .map((w: unknown) => {
            const obj = w as Record<string, unknown>;
            if (obj?.type === 'canvas_diagram' && Array.isArray(obj.primitives)) {
              const norm = obj.primitives
                .map((p: unknown) => {
                  const r = p as Record<string, unknown>;
                  const kind = String(r.kind ?? r.type ?? '').toLowerCase();
                  return VALID_KINDS.has(kind)
                    ? { ...r, kind, color: r.color ?? r.stroke, content: r.content ?? r.text ?? r.label }
                    : null;
                })
                .filter(Boolean);
              return { ...obj, primitives: norm };
            }
            return obj;
          })
          .filter((w: unknown) => {
            const obj = w as { type?: string; expression?: string; primitives?: unknown[] };
            if (obj?.type === 'canvas_diagram') {
              return Array.isArray(obj.primitives) && obj.primitives.length >= 2;
            }
            if (obj?.type === 'asset_ref') return false; // Never force preloaded default assets
            if (obj?.type !== 'function_plot') return true;
            const expr = String(obj.expression ?? '').trim();
            if (!expr || expr.includes('=')) return false;
            const idents = expr.toLowerCase().match(/[a-z_][a-z0-9_]*/g) ?? [];
            return idents.every((id) => ALLOWED_IDENTS.has(id));
          });
      };

      if (Array.isArray(parsed.widgets)) {
        parsed.widgets = sanitizeWidgets(parsed.widgets);
      }

      // Respect simple factual/definition-only questions unless user asked for a visual
      const isDefinitionOnly =
        /^\s*(what\s+is\s+the\s+definition\s+of|define\b|what\s+does\s+.+\s+mean|who\s+discovered|when\s+did)\b/i.test(
          question
        ) && !asksVisual;

      if (isDefinitionOnly) {
        parsed.widgets = [];
      } else {
        // PURE 100% DYNAMIC AI VISUAL SYNTHESIZER (ZERO hardcoded/default diagrams!)
        // Whenever the student asks for a diagram/visual/symbol/structure/graph OR asks a clearly visual question
        // and the first pass did not produce a valid widget, generate the EXACT custom visual from scratch!
        const existingWidgets = Array.isArray(parsed.widgets) ? parsed.widgets : [];
        if (asksVisual && existingWidgets.length === 0) {
          try {
            const synthReply = await callNvidia(
              [
                {
                  role: 'system',
                  content:
                    'You are a precision educational visual generator. NEVER use generic defaults — generate the EXACT diagram, molecule, table, or graph requested by the student from scratch! Return ONLY raw valid JSON: { "widgets": [ ... ] }. Choose the best widget type(s) for the exact request: (1) "canvas_diagram": { "type":"canvas_diagram", "title":string, "primitives":[...], "caption":string } on a 340x220 SVG canvas with well-spaced, accurate shapes: {"kind":"arrow","x1":n,"y1":n,"x2":n,"y2":n,"color":hex}, {"kind":"line","x1":n,"y1":n,"x2":n,"y2":n,"color":hex,"dashed"?:bool}, {"kind":"rect","x":n,"y":n,"w":n,"h":n,"color":hex,"fill":rgba}, {"kind":"circle","cx":n,"cy":n,"r":n,"color":hex,"fill":rgba}, {"kind":"polygon","points":[{"x":n,"y":n},...],"color":hex,"fill":rgba}, {"kind":"arc","cx":n,"cy":n,"r":n,"startAngle":deg,"endAngle":deg,"label":str,"color":hex}, {"kind":"right_angle","x":n,"y":n,"size":14,"dx":1,"dy":-1,"color":hex}, {"kind":"path","d":svgPath,"color":hex,"fill":rgbaOrNone}, {"kind":"text","x":n,"y":n,"content":str,"color":hex,"fontSize":10}. (2) "molecule": { "type":"molecule", "title":string, "shells"?:[{"symbol":str,"charge"?:str,"rings":number[],"style":"dot"|"cross"}], "atoms"?:[{"id":str,"symbol":str,"x":n,"y":n,"color":hex}], "bonds"?:[{"from":str,"to":str,"order":1|2|3}], "caption":string } on 320x190 canvas — use the EXACT elements/compound the student asked about! (3) "table": { "type":"table", "title":string, "headers":string[], "rows":string[][], "caption":string }. (4) "function_plot": { "type":"function_plot", "title":string, "expression":string (ONLY single variable x, NEVER "="), "xMin":-6, "xMax":6, "caption":string }. (5) "wave": { "type":"wave", "title":string, "variant":"transverse"|"longitudinal", "frequency":2, "amplitude":34, "caption":string }. Include at least 7 clear primitives if using canvas_diagram.',
                },
                {
                  role: 'user',
                  content: `Student Level: ${educationLevel}\nConversation Context: ${recentContext.slice(0, 700)}\nExact Student Request: ${question}\nGenerate the exact custom visual widget(s) from scratch for this request.`,
                },
              ],
              1400,
              true
            );
            const sc = synthReply.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
            const fb = sc.indexOf('{');
            const lb = sc.lastIndexOf('}');
            const sObj = JSON.parse(fb >= 0 && lb > fb ? sc.slice(fb, lb + 1) : sc) as {
              widgets?: unknown[];
              type?: string;
            };
            const rawList = Array.isArray(sObj.widgets) ? sObj.widgets : sObj.type ? [sObj] : [];
            const validList = sanitizeWidgets(rawList);
            if (validList.length > 0) {
              parsed.widgets = validList;
            }
          } catch {
            // non-fatal; written explanation still returned
          }
        }

        // Clean any leftover "I can't draw" apology sentence if a real visual widget is attached
        if (Array.isArray(parsed.widgets) && parsed.widgets.length > 0 && typeof parsed.text === 'string') {
          parsed.text = parsed.text
            .replace(/Since I can'?t draw[^.!?\n]*[.!?]\s*/gi, '')
            .replace(/I cannot draw[^.!?\n]*[.!?]\s*/gi, '')
            .trim();
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
        ? body.previousSections.map(String).slice(0, 30)
        : [];
      const reply = await callNvidia(
        [
          {
            role: 'system',
            content:
              'You are a senior Cameroon GCE & University textbook author writing FULL, EXHAUSTIVE, classroom-grade lecture notes — NOT short summaries. Write at the depth of a real multi-page school textbook chapter (aim for 1,600 to 2,500+ words total). NEVER use LaTeX backslashes (no \\frac, \\rightarrow, \\neq, no $ signs) — use clean Unicode (→, ≠, ≤, ≥, √, ±, ², ³, π, Ω, θ, ×, ÷). Put every formula and equation step on its own clean line. For worked examples, show 2 complete step-by-step worked examples (Problem, Known values, Required, Formula, Substitution, Line-by-line Calculation, Final Answer with units, Interpretation). Return ONLY raw valid JSON with schema: { "title": string, "introduction": string, "objectives": string[], "keyTerms": [{ "term": string, "definition": string }], "sections": [{ "heading": string, "body": string }], "workedExample": string, "commonMistakes": string, "examTip": string, "summaryPoints": string[], "exercises": [{ "question": string, "solution": string }], "widgets"?: Widget[] }. Include a relevant visual widget (table, canvas_diagram on 340x220 canvas, molecule, wave, chart, or valid single-variable x function_plot) whenever helpful.',
          },
          {
            role: 'user',
            content:
              mode === 'continue'
                ? `Write the NEXT FULL CONTINUATION CHAPTER of the ${level} ${subject} textbook notes on "${topic}". STRICTLY DO NOT repeat any already-covered sections: [${previousSections.join(', ')}]. Include: a 2-paragraph bridge introduction, 4 new objectives, 4 new key terms, 4 deeply explained subtopic sections (each 2-3 detailed paragraphs with real-world examples and formulas), 1 full 9-step worked example, examiner mistakes, 5 summary points, and 3 exam-standard practice exercises with solutions.`
                : `Write COMPLETE, THOROUGH ${level} ${subject} school textbook notes on "${topic}" aligned strictly to ${level} syllabus depth. Include: (1) rich 2-paragraph introduction; (2) 4-5 learning objectives; (3) 5-6 thorough key terms & definitions; (4) 5 comprehensive subtopic sections where EVERY section has 2-3 detailed paragraphs with real-world examples and formulas on separate lines; (5) 1 complete 9-step worked example; (6) common mistakes & examiner warnings; (7) high-yield exam tip; (8) 5-6 summary points; (9) 4 practice exercises with full step-by-step solutions.`,
          },
        ],
        2600,
        true
      );
      const cleaned = reply
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const firstB = cleaned.indexOf('{');
      const lastB = cleaned.lastIndexOf('}');
      const slice = firstB >= 0 && lastB > firstB ? cleaned.slice(firstB, lastB + 1) : cleaned;
      const repaired = slice
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
        .replace(/,\s*([}\]])/g, '$1');
      try {
        res.status(200).json(JSON.parse(repaired));
      } catch {
        res.status(200).json({
          title: `${topic} — ${level} ${subject} Notes`,
          introduction: cleaned.replace(/[{}"]/g, '').slice(0, 1200),
          sections: [
            {
              heading: `Core Concepts of ${topic}`,
              body: cleaned.replace(/[{}"]/g, '').slice(0, 2400),
            },
          ],
        });
      }
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
