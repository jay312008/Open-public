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
      const companionName = body.companionName ? String(body.companionName).slice(0, 30) : 'Molly';
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
              `You are ${companionName}, a warm, attentive, 1-on-1 human-like tutor in LearnyMol. If asked your name, always say your name is ${companionName}. RULES: (1) ALWAYS listen carefully to the student's exact message and the conversation history — NEVER switch to an unrelated topic! (2) Talk naturally like a caring teacher sitting beside the student: clear, simple English, never robotic or overly dense. (3) For math/science equations, put each step on its own clean line so nothing is squeezed together. (4) NEVER use LaTeX backslashes (no \\rightarrow, \\frac, \\neq, \\sqrt, no $ signs) — use plain Unicode symbols (→, ≠, ≤, ≥, √, ±, ², ³, π, Ω, θ, ×, ÷). (5) Choose the EXACT right visual widget! Return ONLY raw valid JSON with schema: { "heading"?: string, "text": string, "equation"?: string, "steps"?: [{ "title": string, "detail": string }], "example"?: string, "tip"?: string, "widgets"?: Widget[] }. Widget types: (1) { "type":"function_plot", "title":string, "expression":string, "xMin"?:number, "xMax"?:number, "points"?:[{"x":number,"y":number,"label":string}], "caption":string } — ONLY use for pure y=f(x) functions of single variable x (like "x^2 - 4" or "sin(x)"). NEVER put "=" or variables like theta1/n1/u/v in function_plot! (2) { "type":"table", "title":string, "headers":string[], "rows":string[][], "caption":string } — use for ANY spreadsheet/comparison/truth/values table! (3) { "type":"periodic_table", "title":string, "caption":string } — use whenever the student asks for the Periodic Table! (4) { "type":"molecule", "title":string, "atoms"?:[{"id":string,"symbol":string,"x":number,"y":number,"charge"?:string}], "bonds"?:[{"from":string,"to":string,"order"?:1|2|3}], "shells"?:[{"symbol":string,"charge"?:string,"rings":number[],"style":"dot"|"cross"}], "caption":string } on a 320x190 canvas — use for chemical bonding dot-and-cross shells or organic structures! (5) { "type":"canvas_diagram", "title":string, "primitives":[...], "caption":string } on a 340x220 scientific blueprint canvas — USE THIS for ALL physics/optics/echo/sound/geometry/triangles/ladder problems/forces/circuits/potential difference/prisms/lenses/biology diagrams! Supported primitives: "arrow" (x1,y1,x2,y2,color,dashed?), "line" (x1,y1,x2,y2,color,dashed?), "polygon" (points:[{x,y}],color,fill?), "arc" (cx,cy,r,startAngle,endAngle,label?,color), "right_angle" (x,y,size?,dx?,dy?,color), "circle" (cx,cy,r,color,fill?), "rect" (x,y,w,h,color,fill?), "path" (d,color,fill?,dashed?), "text" (x,y,content,color,fontSize?). (6) { "type":"chart", "title":string, "labels":string[], "values":number[], "unit"?:string, "caption":string } (7) { "type":"wave", "title":string, "variant":"transverse"|"longitudinal", "frequency":number, "amplitude":number, "caption":string } (8) { "type":"calculator", "title":string, "formulaExpr":string, "resultLabel":string, "variables":[{"name":string,"label":string,"defaultValue":number}] }.`,
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

      // Auto-upgrade chemical bonding visual requests to crisp dot-and-cross molecule shells
      // instead of messy raw canvas_diagram circles/overlapping text
      const recentContext = [
        ...historyMsgs.slice(-4).map((m) => m.content),
        question,
        String(parsed.heading ?? ''),
      ].join(' ');
      const asksVisual = /\b(draw|diagram|visual|graph|sketch|illustrat|represent|show|dot[\s-]and[\s-]cross|shell)\b/i.test(question);
      const isBondingTopic = /\b(ionic\s+bond|covalent\s+bond|chemical\s+bond|dot[\s-]and[\s-]cross|electron\s+transfer|nacl)\b/i.test(recentContext);
      if (asksVisual && isBondingTopic) {
        const existing = Array.isArray(parsed.widgets) ? parsed.widgets : [];
        const hasMolecule = existing.some((w: unknown) => (w as { type?: string })?.type === 'molecule');
        if (!hasMolecule) {
          const isCovalentOnly = /\bcovalent\b/i.test(recentContext) && !/\bionic\b/i.test(recentContext);
          const bondingWidget = isCovalentOnly
            ? {
                type: 'molecule',
                title: 'Covalent Bonding — Water (H₂O) Shared Electron Pairs',
                atoms: [
                  { id: 'h1', symbol: 'H', x: 75, y: 120, color: '#0EA5E9' },
                  { id: 'o1', symbol: 'O', x: 160, y: 72, color: '#EF4444' },
                  { id: 'h2', symbol: 'H', x: 245, y: 120, color: '#0EA5E9' },
                ],
                bonds: [
                  { from: 'h1', to: 'o1', order: 1 },
                  { from: 'o1', to: 'h2', order: 1 },
                ],
                caption: 'Oxygen shares one pair of electrons with each Hydrogen atom to complete its outer shell.',
              }
            : {
                type: 'molecule',
                title: 'Ionic Bonding — Dot-and-Cross Diagram (Na⁺Cl⁻)',
                shells: [
                  { symbol: 'Na', charge: '+', rings: [2, 8], style: 'cross' },
                  { symbol: 'Cl', charge: '−', rings: [2, 8, 8], style: 'dot' },
                ],
                caption: 'Sodium (2,8,1) transfers 1 outer electron (×) to Chlorine (2,8,7), forming stable Na⁺ [2,8] and Cl⁻ [2,8,8] ions.',
              };
          parsed.widgets = [
            bondingWidget,
            ...existing.filter((w: unknown) => (w as { type?: string })?.type !== 'canvas_diagram'),
          ];
        }
      }

      // Sanitize broken function_plot & empty/malformed canvas_diagram widgets so empty grids NEVER appear
      if (Array.isArray(parsed.widgets)) {
        const ALLOWED_IDENTS = new Set(['x', 'sin', 'cos', 'tan', 'sqrt', 'abs', 'log', 'ln', 'exp', 'pi', 'e']);
        const VALID_KINDS = new Set(['line', 'arrow', 'polygon', 'arc', 'right_angle', 'circle', 'rect', 'path', 'text']);
        parsed.widgets = parsed.widgets
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
            if (obj?.type !== 'function_plot') return true;
            const expr = String(obj.expression ?? '').trim();
            if (!expr || expr.includes('=')) return false;
            const idents = expr.toLowerCase().match(/[a-z_][a-z0-9_]*/g) ?? [];
            return idents.every((id) => ALLOWED_IDENTS.has(id));
          });
      }

      // INTELLIGENT VISUALIZATION DECISION ENGINE (Sections 3, 5, 6, 11, 12, 16)
      // 1. Respect text-only factual/definition questions (e.g., "What is the definition of photosynthesis?") unless visual explicitly requested
      const isDefinitionOnly =
        /^\s*(what\s+is\s+the\s+definition\s+of|define\b|what\s+does\s+.+\s+mean|who\s+discovered|when\s+did)\b/i.test(question) &&
        !asksVisual;

      if (isDefinitionOnly) {
        parsed.widgets = [];
      } else {
        const currentWidgets = Array.isArray(parsed.widgets) ? parsed.widgets : [];
        const hasType = (t: string) => currentWidgets.some((w: unknown) => (w as { type?: string })?.type === t);
        const hasRichCanvas = currentWidgets.some(
          (w: unknown) =>
            (w as { type?: string; primitives?: unknown[] })?.type === 'canvas_diagram' &&
            Array.isArray((w as { primitives?: unknown[] }).primitives) &&
            ((w as { primitives?: unknown[] }).primitives?.length ?? 0) >= 5
        );

        // A. Interactive 3D Models (Water H2O, Methane CH4, 3D Cube, 3D Pyramid)
        if (/\b(3d|three[\s-]dimensional)\b/i.test(question) || /\b(water\s+molecule|h2o\s+structure|methane\s+structure|tetrahedral)\b/i.test(question)) {
          if (!hasType('model_3d')) {
            const preset3d = /\bmethane|ch4\b/i.test(question)
              ? 'methane_ch4'
              : /\bcube\b/i.test(question)
                ? 'cube_3d'
                : /\bpyramid\b/i.test(question)
                  ? 'pyramid_3d'
                  : 'water_h2o';
            parsed.widgets = [{ type: 'model_3d', preset3d }, ...currentWidgets];
          }
        }
        // B. Interactive Code-Based Simulation (Projectile Motion)
        else if (/\b(projectile|trajectory|launch\s+angle|initial\s+velocity)\b/i.test(question)) {
          if (!hasType('code_sim')) {
            parsed.widgets = [
              {
                type: 'code_sim',
                title: 'Animated Projectile Motion Simulation',
                caption: 'Adjust initial velocity (v₀) and launch angle (θ) to observe Range R = (v₀²·sin 2θ)/g, Max Height, and parabolic trajectory live.',
                codeExplanation:
                  'This HTML5 Canvas simulation splits initial velocity into horizontal vx = v₀·cos(θ) (constant) and vertical vy = v₀·sin(θ) (accelerated downward by g = 9.81 m/s²), updating position (x, y) each frame.',
              },
              ...currentWidgets,
            ];
          }
        }
        // C. Preloaded Educational Asset Library (Plant Cell, Human Heart, River Meander, Newton's 2nd Law, Atom)
        else if (/\bplant\s+cell\b/i.test(question)) {
          if (!hasType('asset_ref')) {
            parsed.widgets = [{ type: 'asset_ref', assetId: 'plant_cell' }, ...currentWidgets];
          }
        } else if (/\bhuman\s+heart\b|\bheart\s+structure\b|\bchambers\s+of\s+the\s+heart\b/i.test(question)) {
          if (!hasType('asset_ref')) {
            parsed.widgets = [{ type: 'asset_ref', assetId: 'human_heart', animation: 'blood_flow' }, ...currentWidgets];
          }
        } else if (/\briver\s+meander\b|\bmeander\b/i.test(question)) {
          if (!hasType('asset_ref')) {
            parsed.widgets = [{ type: 'asset_ref', assetId: 'river_meander', animation: 'river_flow' }, ...currentWidgets];
          }
        } else if (/\bnewton'?s\s+second\s+law\b|\bf\s*=\s*ma\b|\bfree[\s-]body\s+diagram\b/i.test(question)) {
          if (!hasType('asset_ref')) {
            parsed.widgets = [{ type: 'asset_ref', assetId: 'newtons_second_law', animation: 'force_motion' }, ...currentWidgets];
          }
        } else if (/\bstructure\s+of\s+an?\s+atom\b|\bbohr\s+model\b|\bprotons\s+and\s+neutrons\b/i.test(question)) {
          if (!hasType('asset_ref') && !hasType('molecule')) {
            parsed.widgets = [{ type: 'asset_ref', assetId: 'atom_bohr' }, ...currentWidgets];
          }
        }
        // D. Multiple Visualizations: Open Circuit vs Closed Circuit (2 independent diagrams!)
        else if (/\bopen\s+circuit\b/i.test(question) && /\bclosed\s+circuit\b/i.test(question)) {
          const openCircuit = {
            type: 'canvas_diagram',
            title: '1. Open Electrical Circuit (Switch Open — No Current)',
            primitives: [
              { kind: 'line', x1: 56, y1: 52, x2: 140, y2: 52, color: '#334155', strokeWidth: 2.5 },
              { kind: 'line', x1: 140, y1: 52, x2: 186, y2: 26, color: '#EF4444', strokeWidth: 3 },
              { kind: 'line', x1: 192, y1: 52, x2: 284, y2: 52, color: '#334155', strokeWidth: 2.5 },
              { kind: 'line', x1: 284, y1: 52, x2: 284, y2: 164, color: '#334155', strokeWidth: 2.5 },
              { kind: 'line', x1: 284, y1: 164, x2: 56, y2: 164, color: '#334155', strokeWidth: 2.5 },
              { kind: 'line', x1: 56, y1: 164, x2: 56, y2: 52, color: '#334155', strokeWidth: 2.5 },
              { kind: 'circle', cx: 170, cy: 164, r: 18, color: '#64748B', fill: '#F1F5F9', strokeWidth: 2.4 },
              { kind: 'text', x: 170, y: 168, content: 'OFF', color: '#64748B', fontSize: 10 },
              { kind: 'text', x: 166, y: 20, content: 'Open Switch (Gap)', color: '#DC2626', fontSize: 10.5 },
              { kind: 'text', x: 170, y: 202, content: 'Break in path stops electrons — Lamp stays OFF (I = 0 A)', color: '#475569', fontSize: 10 },
            ],
            caption: 'In an open circuit, the broken path prevents continuous charge flow.',
          };
          const closedCircuit = {
            type: 'canvas_diagram',
            title: '2. Closed Electrical Circuit (Switch Closed — Current Flows)',
            animation: 'current_flow',
            primitives: [
              { kind: 'rect', x: 56, y: 52, w: 228, h: 112, color: '#16A34A', fill: 'none', strokeWidth: 2.5 },
              { kind: 'arrow', x1: 72, y1: 52, x2: 268, y2: 52, color: '#16A34A', strokeWidth: 2.8 },
              { kind: 'arrow', x1: 284, y1: 68, x2: 284, y2: 152, color: '#16A34A', strokeWidth: 2.8 },
              { kind: 'arrow', x1: 268, y1: 164, x2: 72, y2: 164, color: '#16A34A', strokeWidth: 2.8 },
              { kind: 'circle', cx: 170, cy: 164, r: 18, color: '#F59E0B', fill: '#FEF08A', strokeWidth: 2.6 },
              { kind: 'text', x: 170, y: 168, content: 'ON', color: '#B45309', fontSize: 10.5 },
              { kind: 'text', x: 170, y: 34, content: 'Closed Switch → Current I Flows', color: '#15803D', fontSize: 10.5 },
              { kind: 'text', x: 170, y: 202, content: 'Complete loop allows continuous current — Lamp glows ON', color: '#15803D', fontSize: 10 },
            ],
            caption: 'In a closed circuit, the complete conducting loop allows continuous current flow.',
          };
          parsed.widgets = [openCircuit, closedCircuit];
        }
        // E. Interactive Wave Simulation
        else if (
          /\b(wave|waves|transverse|longitudinal|wavelength|crest|trough|amplitude)\b/i.test(question) &&
          !/\b(echo|refract|deflect|mirror)\b/i.test(question)
        ) {
          if (!hasType('wave')) {
            const isLongitudinal = /\blongitudinal\b/i.test(question) && !/\btransverse\b/i.test(question);
            parsed.widgets = [
              {
                type: 'wave',
                title: isLongitudinal
                  ? 'Interactive Longitudinal Wave (Compressions & Rarefactions)'
                  : 'Interactive Transverse Wave (Crest, Trough, Amplitude & Wavelength)',
                variant: isLongitudinal ? 'longitudinal' : 'transverse',
                frequency: 2,
                amplitude: 34,
                caption: 'Adjust frequency and amplitude interactively to see how wavelength and wave height change.',
              },
              ...currentWidgets.filter((w: unknown) => (w as { type?: string })?.type !== 'canvas_diagram'),
            ];
          }
        }
        // F. Deterministic Right-Angled Triangle / Pythagoras / Ladder Problem
        else if (/\b(pythagor|right[\s-]angled?\s+triangle|hypotenuse|ladder)\b/i.test(question) && !hasRichCanvas) {
          const nums = (question.match(/\b(\d+(?:\.\d+)?)\s*(cm|m|mm|km|ft|in)?\b/gi) ?? [])
            .map((m) => {
              const p = m.match(/(\d+(?:\.\d+)?)\s*(cm|m|mm|km|ft|in)?/i);
              return p ? { val: parseFloat(p[1]), unit: p[2] || 'cm' } : null;
            })
            .filter((x): x is { val: number; unit: string } => Boolean(x && x.val > 0 && x.val < 10000));

          if (nums.length >= 2) {
            const hVal = nums[0].val;
            const bVal = nums[1].val;
            const unit = nums[0].unit || 'cm';
            const hyp = Math.sqrt(hVal * hVal + bVal * bVal);
            const hypStr = Number.isInteger(hyp) ? String(hyp) : hyp.toFixed(2);
            const maxDim = Math.max(hVal, bVal, 1);
            const drawW = Math.max(85, Math.min(195, (bVal / maxDim) * 185));
            const drawH = Math.max(70, Math.min(130, (hVal / maxDim) * 125));
            const x0 = 84;
            const y0 = 176;
            const x1 = x0 + drawW;
            const yTop = y0 - drawH;
            parsed.widgets = [
              {
                type: 'canvas_diagram',
                title: `Right-Angled Triangle (${hVal} ${unit} × ${bVal} ${unit} → ${hypStr} ${unit})`,
                primitives: [
                  { kind: 'polygon', points: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x0, y: yTop }], color: '#7C3AED', fill: 'rgba(124,92,250,0.12)', strokeWidth: 2.6 },
                  { kind: 'line', x1: x0, y1: yTop, x2: x1, y2: y0, color: '#FF6B4A', strokeWidth: 3.4 },
                  { kind: 'right_angle', x: x0, y: y0, size: 15, dx: 1, dy: -1, color: '#7C3AED' },
                  { kind: 'text', x: x0 - 34, y: (y0 + yTop) / 2, content: `${hVal} ${unit}`, color: '#1E293B', fontSize: 11 },
                  { kind: 'text', x: (x0 + x1) / 2, y: y0 + 20, content: `${bVal} ${unit}`, color: '#1E293B', fontSize: 11 },
                  { kind: 'text', x: (x0 + x1) / 2 + 26, y: (y0 + yTop) / 2 - 8, content: `c = ${hypStr} ${unit}`, color: '#EA580C', fontSize: 11.5 },
                  { kind: 'text', x: x0 + 26, y: y0 - 12, content: '90°', color: '#7C3AED', fontSize: 9.5 },
                ],
                caption: `Pythagorean Theorem: c = √(${hVal}² + ${bVal}²) = ${hypStr} ${unit}.`,
              },
              ...currentWidgets,
            ];
          } else {
            parsed.widgets = [
              {
                type: 'canvas_diagram',
                title: /\bladder\b/i.test(question)
                  ? 'Right Triangle Model — Leaning Ladder Problem'
                  : 'Right-Angled Triangle & Trigonometry',
                primitives: [
                  { kind: 'polygon', points: [{ x: 76, y: 176 }, { x: 268, y: 176 }, { x: 76, y: 42 }], color: '#7C3AED', fill: 'rgba(124,92,250,0.12)', strokeWidth: 2.6 },
                  { kind: 'line', x1: 76, y1: 42, x2: 268, y2: 176, color: '#FF6B4A', strokeWidth: 3.4 },
                  { kind: 'right_angle', x: 76, y: 176, size: 16, dx: 1, dy: -1, color: '#7C3AED' },
                  { kind: 'arc', cx: 268, cy: 176, r: 34, startAngle: 180, endAngle: 215, label: 'θ', color: '#EF4444' },
                  { kind: 'text', x: 44, y: 112, content: 'Height (h)', color: '#1E293B', fontSize: 10.5 },
                  { kind: 'text', x: 172, y: 198, content: 'Base (b)', color: '#1E293B', fontSize: 10.5 },
                  { kind: 'text', x: 204, y: 92, content: /\bladder\b/i.test(question) ? 'Ladder (L)' : 'Hypotenuse (c)', color: '#EA580C', fontSize: 11 },
                  { kind: 'text', x: 104, y: 162, content: '90°', color: '#7C3AED', fontSize: 9.5 },
                ],
                caption: 'Pythagoras: h² + b² = c² · Trig: sin(θ) = h/c, cos(θ) = b/c, tan(θ) = h/b.',
              },
              ...currentWidgets,
            ];
          }
        }
        // G. Animated Refraction / Reflection of Light, Echo, Potential Difference, Quadratic Graph
        else if (!hasRichCanvas) {
          if (/\b(refract|deflect|snell|light\s+bend|air\s+to\s+water|glass\s+block)\b/i.test(recentContext)) {
            parsed.widgets = [
              {
                type: 'canvas_diagram',
                title: 'Refraction (Deflection) of Light — Air to Water',
                animation: 'light_ray',
                primitives: [
                  { kind: 'rect', x: 16, y: 112, w: 308, h: 94, color: '#0EA5E9', fill: 'rgba(14,165,233,0.14)', strokeWidth: 1.5 },
                  { kind: 'line', x1: 16, y1: 112, x2: 324, y2: 112, color: '#0284C7', strokeWidth: 2.5 },
                  { kind: 'line', x1: 170, y1: 18, x2: 170, y2: 204, color: '#64748B', dashed: true, strokeWidth: 1.8 },
                  { kind: 'arrow', x1: 66, y1: 28, x2: 170, y2: 112, color: '#F59E0B', strokeWidth: 3 },
                  { kind: 'arrow', x1: 170, y1: 112, x2: 222, y2: 202, color: '#EF4444', strokeWidth: 3 },
                  { kind: 'arc', cx: 170, cy: 112, r: 34, startAngle: -141, endAngle: -90, label: 'θ₁', color: '#D97706' },
                  { kind: 'arc', cx: 170, cy: 112, r: 34, startAngle: 60, endAngle: 90, label: 'θ₂', color: '#DC2626' },
                  { kind: 'text', x: 56, y: 98, content: 'Air (n₁ = 1.00)', color: '#0369A1', fontSize: 10 },
                  { kind: 'text', x: 64, y: 132, content: 'Water (n₂ = 1.33)', color: '#0369A1', fontSize: 10 },
                  { kind: 'text', x: 215, y: 30, content: 'Normal (90°)', color: '#64748B', fontSize: 10 },
                  { kind: 'text', x: 84, y: 24, content: 'Incident Ray', color: '#D97706', fontSize: 10.5 },
                  { kind: 'text', x: 266, y: 184, content: 'Refracted Ray', color: '#DC2626', fontSize: 10.5 },
                ],
                caption: 'Light slows down entering water (n₂ > n₁) and bends toward the normal: n₁·sin(θ₁) = n₂·sin(θ₂).',
              },
              ...currentWidgets,
            ];
          } else if (/\b(reflect|mirror|law\s+of\s+reflection)\b/i.test(question) && /\b(light|ray|mirror|angle)\b/i.test(question)) {
            parsed.widgets = [
              {
                type: 'canvas_diagram',
                title: 'Animated Reflection of Light on a Plane Mirror',
                animation: 'light_ray',
                primitives: [
                  { kind: 'rect', x: 24, y: 162, w: 292, h: 16, color: '#475569', fill: 'rgba(100,116,139,0.22)', strokeWidth: 2 },
                  { kind: 'line', x1: 170, y1: 24, x2: 170, y2: 162, color: '#64748B', dashed: true, strokeWidth: 1.8 },
                  { kind: 'arrow', x1: 58, y1: 42, x2: 170, y2: 162, color: '#F59E0B', strokeWidth: 3 },
                  { kind: 'arrow', x1: 170, y1: 162, x2: 282, y2: 42, color: '#10B981', strokeWidth: 3 },
                  { kind: 'arc', cx: 170, cy: 162, r: 38, startAngle: -133, endAngle: -90, label: 'i', color: '#D97706' },
                  { kind: 'arc', cx: 170, cy: 162, r: 38, startAngle: -90, endAngle: -47, label: 'r', color: '#059669' },
                  { kind: 'text', x: 170, y: 196, content: 'Plane Mirror Surface (Angle i = Angle r)', color: '#334155', fontSize: 10.5 },
                  { kind: 'text', x: 170, y: 18, content: 'Normal', color: '#64748B', fontSize: 10 },
                  { kind: 'text', x: 76, y: 36, content: 'Incident Ray', color: '#D97706', fontSize: 10.5 },
                  { kind: 'text', x: 266, y: 36, content: 'Reflected Ray', color: '#059669', fontSize: 10.5 },
                ],
                caption: 'Law of Reflection: Angle of incidence (i) = Angle of reflection (r), measured from the normal.',
              },
              ...currentWidgets,
            ];
          } else if (/\b(echo|sound\s+reflect|reverberation)\b/i.test(question)) {
            parsed.widgets = [
              {
                type: 'canvas_diagram',
                title: 'Formation of an Echo (Sound Reflection)',
                animation: 'light_ray',
                primitives: [
                  { kind: 'circle', cx: 52, cy: 112, r: 22, color: '#2563EB', fill: 'rgba(37,99,235,0.16)' },
                  { kind: 'text', x: 52, y: 115, content: 'Source', color: '#1D4ED8', fontSize: 10 },
                  { kind: 'rect', x: 284, y: 30, w: 28, h: 160, color: '#475569', fill: 'rgba(100,116,139,0.28)' },
                  { kind: 'text', x: 298, y: 20, content: 'Wall / Cliff', color: '#334155', fontSize: 10 },
                  { kind: 'arrow', x1: 82, y1: 84, x2: 278, y2: 84, color: '#3B82F6', strokeWidth: 2.8 },
                  { kind: 'arc', cx: 92, cy: 84, r: 18, startAngle: -45, endAngle: 45, color: '#3B82F6' },
                  { kind: 'arrow', x1: 278, y1: 140, x2: 82, y2: 140, color: '#EF4444', strokeWidth: 2.8, dashed: true },
                  { kind: 'arc', cx: 266, cy: 140, r: 18, startAngle: 135, endAngle: 225, color: '#EF4444' },
                  { kind: 'line', x1: 52, y1: 186, x2: 284, y2: 186, color: '#7C3AED', dashed: true, strokeWidth: 1.6 },
                  { kind: 'text', x: 178, y: 66, content: 'Original Sound Wave →', color: '#1D4ED8', fontSize: 10.5 },
                  { kind: 'text', x: 178, y: 162, content: '← Reflected Echo Wave', color: '#DC2626', fontSize: 10.5 },
                  { kind: 'text', x: 168, y: 204, content: 'Distance d = (v × t) / 2', color: '#7C3AED', fontSize: 11 },
                ],
                caption: 'Sound travels distance d to the wall and returns distance d (total 2d), so d = (v × t) / 2.',
              },
              ...currentWidgets,
            ];
          } else if (/\b(potential\s+difference|voltage|ohm'?s\s+law|voltmeter|electric\s+circuit|resistor)\b/i.test(question)) {
            parsed.widgets = [
              {
                type: 'canvas_diagram',
                title: 'Electric Circuit — Measuring Potential Difference (V)',
                animation: 'current_flow',
                primitives: [
                  { kind: 'rect', x: 56, y: 48, w: 228, h: 118, color: '#334155', fill: 'none', strokeWidth: 2.4 },
                  { kind: 'rect', x: 40, y: 86, w: 32, h: 42, color: '#F8FBFF', fill: '#F8FBFF', strokeWidth: 0 },
                  { kind: 'line', x1: 42, y1: 98, x2: 70, y2: 98, color: '#EF4444', strokeWidth: 3.2 },
                  { kind: 'line', x1: 49, y1: 112, x2: 63, y2: 112, color: '#1E293B', strokeWidth: 3.2 },
                  { kind: 'text', x: 30, y: 96, content: '+', color: '#EF4444', fontSize: 12 },
                  { kind: 'text', x: 30, y: 120, content: '−', color: '#1E293B', fontSize: 12 },
                  { kind: 'rect', x: 132, y: 34, w: 76, h: 28, color: '#7C3AED', fill: '#EDE9FE', strokeWidth: 2.4 },
                  { kind: 'text', x: 170, y: 52, content: 'R', color: '#5B21B6', fontSize: 12 },
                  { kind: 'line', x1: 116, y1: 48, x2: 116, y2: 108, color: '#0EA5E9', strokeWidth: 2 },
                  { kind: 'line', x1: 224, y1: 48, x2: 224, y2: 108, color: '#0EA5E9', strokeWidth: 2 },
                  { kind: 'line', x1: 116, y1: 108, x2: 224, y2: 108, color: '#0EA5E9', strokeWidth: 2 },
                  { kind: 'circle', cx: 170, cy: 108, r: 17, color: '#0284C7', fill: '#E0F2FE', strokeWidth: 2.4 },
                  { kind: 'text', x: 170, y: 112, content: 'V', color: '#0369A1', fontSize: 12 },
                  { kind: 'circle', cx: 170, cy: 166, r: 17, color: '#16A34A', fill: '#DCFCE7', strokeWidth: 2.4 },
                  { kind: 'text', x: 170, y: 170, content: 'A', color: '#15803D', fontSize: 12 },
                  { kind: 'arrow', x1: 72, y1: 48, x2: 106, y2: 48, color: '#F59E0B', strokeWidth: 2.6 },
                  { kind: 'text', x: 88, y: 34, content: 'Current I', color: '#D97706', fontSize: 10 },
                  { kind: 'text', x: 170, y: 204, content: 'V = I × R  (Voltmeter in Parallel, Ammeter in Series)', color: '#334155', fontSize: 10 },
                ],
                caption: 'Potential difference (V) is measured by a voltmeter connected in parallel across resistor R: V = W/Q = I × R.',
              },
              ...currentWidgets,
            ];
          } else if (/\bquadratic\s+(function|graph|equation|parabola)\b/i.test(question) && !hasType('function_plot')) {
            parsed.widgets = [
              {
                type: 'function_plot',
                title: 'Quadratic Function Graph: y = x² − 4',
                expression: 'x^2 - 4',
                xMin: -5,
                xMax: 5,
                points: [
                  { x: -2, y: 0, label: 'Root (-2,0)' },
                  { x: 0, y: -4, label: 'Vertex (0,-4)' },
                  { x: 2, y: 0, label: 'Root (2,0)' },
                ],
                caption: 'Interactive parabola y = x² − 4. Edit the equation above or trace points below.',
              },
              ...currentWidgets,
            ];
          }
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
                ? `Write the NEXT FULL MULTI-PAGE CONTINUATION CHAPTER of the ${level} ${subject} textbook notes on "${topic}". STRICTLY DO NOT repeat any of these already-covered sections: [${previousSections.join(', ')}]. Include: a 2-paragraph bridge introduction, 4 new objectives, 5 new key terms, 5 to 6 brand-new deeply explained subtopic sections (each section MUST be 3 full detailed paragraphs with real-world examples and formulas — NO short 2-sentence paragraphs!), 2 fresh full step-by-step worked examples, examiner mistakes, 6 summary points, and 4 new exam-standard practice exercises with full solutions.`
                : `Write COMPLETE, FULL-LENGTH, MULTI-PAGE ${level} ${subject} school textbook notes on "${topic}" aligned strictly to ${level} syllabus depth (never mix O-Level and A-Level). Requirements: (1) Rich 3-paragraph introduction explaining background, significance, and exam relevance; (2) 5-6 measurable learning objectives; (3) 6-8 thorough key terms & definitions; (4) 6 to 8 comprehensive subtopic sections where EVERY section has 3-4 well-developed paragraphs (at least 150-220 words per section!) with clear explanations, everyday real-world examples, comparisons, and formulas on separate lines; (5) 2 complete 9-step worked examples; (6) detailed common mistakes & examiner warnings; (7) high-yield exam tip; (8) 6-8 summary points; (9) 5 practice exercises (Foundation to GCE Exam level) with complete step-by-step solutions.`,
          },
        ],
        5200,
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
      res.status(200).json(JSON.parse(repaired));
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
