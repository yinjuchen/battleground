// Stage 3 (verdict half): rate limit -> Claude verdict. Image generation is not added yet.
const Anthropic = require('@anthropic-ai/sdk');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { z } = require('zod');
const { JUDGE_SYSTEM_PROMPT } = require('./judge-prompt');

const MAX_FIGHTER_LENGTH = 200;
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 1000;

// In-memory, per-instance limiter (resets on cold start; fine for local dev / MVP).
const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

const VerdictSchema = z.object({
  winner: z.string(),
  reasoning: z.string(),
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // Rate limit first, before any external API call.
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many fights! Max 5 per minute — try again shortly.' });
  }

  const { fighterA, fighterB } = req.body || {};
  if (
    typeof fighterA !== 'string' || typeof fighterB !== 'string' ||
    !fighterA.trim() || !fighterB.trim()
  ) {
    return res.status(400).json({ error: 'Both fighters are required.' });
  }
  if (fighterA.length > MAX_FIGHTER_LENGTH || fighterB.length > MAX_FIGHTER_LENGTH) {
    return res.status(400).json({ error: `Fighter names must be ${MAX_FIGHTER_LENGTH} characters or fewer.` });
  }

  
  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
    const response = await client.messages.parse({
      model: 'claude-sonnet-5-5',
      max_tokens: 1024,
      system: JUDGE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Fighter A: ${JSON.stringify(fighterA)}\nFighter B: ${JSON.stringify(fighterB)}`,
        },
      ],
      output_config: { format: zodOutputFormat(VerdictSchema) },
    });

    const verdict = response.parsed_output;
    if (!verdict || (verdict.winner !== fighterA && verdict.winner !== fighterB)) {
      return res.status(502).json({ error: 'The judge gave an invalid verdict. Please try again.' });
    }

    // Images arrive in the next stage; null for now.
    return res.status(200).json({
      winner: verdict.winner,
      reasoning: verdict.reasoning,
      imageA: null,
      imageB: null,
    });
  } catch (err) {
    console.error('Verdict call failed:', err);
    return res.status(502).json({ error: 'The judge is unavailable right now. Please try again.' });
  }
};
