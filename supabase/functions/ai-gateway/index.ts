// Supabase Edge Function: Server-side AI Gateway for LearnyMol (NVIDIA NIM)
// Deploy with:
//   supabase secrets set NVIDIA_API_KEY="<your-rotated-nvidia-api-key>"
//   supabase functions deploy ai-gateway
// Then set EXPO_PUBLIC_AI_GATEWAY_URL=https://<project-ref>.supabase.co/functions/v1/ai-gateway

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callNvidiaNim(messages: ChatMessage[], maxTokens = 700): Promise<string> {
  const apiKey = (globalThis as { Deno?: { env: { get: (k: string) => string | undefined } } }).Deno?.env.get(
    'NVIDIA_API_KEY'
  );
  const model =
    (globalThis as { Deno?: { env: { get: (k: string) => string | undefined } } }).Deno?.env.get(
      'NVIDIA_MODEL'
    ) ?? 'nvidia/nemotron-3.5-bolt-e4b';

  if (!apiKey) {
    throw new Error('Server secret NVIDIA_API_KEY is not configured.');
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
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NVIDIA NIM error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const denoServe = (globalThis as { Deno?: { serve: (handler: (req: Request) => Promise<Response>) => void } }).Deno?.serve;

if (denoServe) {
  denoServe(async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      const url = new URL(req.url);
      const path = url.pathname.replace(/^.*\/ai-gateway/, '') || '/chat';
      const body = await req.json();

      if (path === '/chat') {
        const question = String(body.question ?? '').trim();
        const subject = body.subject ? String(body.subject) : 'general studies';
        const reply = await callNvidiaNim([
          {
            role: 'system',
            content:
              'You are Molly, a warm, encouraging AI tutor inside the LearnyMol educational app. Give clear, concise, step-by-step student-friendly explanations. Include a key formula or equation when helpful.',
          },
          {
            role: 'user',
            content: `Subject: ${subject}\nStudent question: ${question}`,
          },
        ]);
        return jsonResponse({ text: reply });
      }

      if (path === '/live-teacher/plan') {
        const topic = String(body.topic ?? 'Quadratic Equations');
        const reply = await callNvidiaNim(
          [
            {
              role: 'system',
              content:
                'Return ONLY a valid JSON array of 4 LiveLessonStep objects with fields: id, speechText, durationMs, boardElement: { id, type ("title"|"equation"|"diagram"|"example"), label, content, explanation }. No markdown fences.',
            },
            {
              role: 'user',
              content: `Create a 4-step interactive Live Teacher board lesson on: ${topic}`,
            },
          ],
          1100
        );
        const parsed = JSON.parse(reply);
        return jsonResponse(parsed);
      }

      const fallbackReply = await callNvidiaNim([
        {
          role: 'system',
          content: 'You are Molly, an educational AI assistant for LearnyMol. Be accurate, clear, and concise.',
        },
        {
          role: 'user',
          content: `Route: ${path}\nPayload: ${JSON.stringify(body)}`,
        },
      ]);
      return jsonResponse({ text: fallbackReply });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI Gateway error';
      return jsonResponse({ error: message }, 500);
    }
  });
}
