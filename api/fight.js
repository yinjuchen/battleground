// Stage 3: rate limit -> Claude verdict + OpenAI art for both fighters (in parallel).
const Anthropic = require('@anthropic-ai/sdk');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { z } = require('zod/v4'); // SDK's zodOutputFormat needs v4 schemas; root 'zod' is v3 in 3.25.x
const OpenAI = require('openai');
const { JUDGE_SYSTEM_PROMPT } = require('./judge-prompt');
const { buildImagePrompt } = require('./art-style');

const MAX_FIGHTER_LENGTH = 50; // keep in sync with MAX_FIGHTER_LENGTH in script.js
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
    return res.status(405).json({ error: "Wrong door, challenger! This arena only takes POST requests." });
  }

  // Rate limit first, before any external API call.
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Whoa there, slugger! The crowd needs a breather: five fights a minute is the limit. Catch your breath and come back shortly!' });
  }

  const { fighterA, fighterB } = req.body || {};
  if (
    typeof fighterA !== 'string' || typeof fighterB !== 'string' ||
    !fighterA.trim() || !fighterB.trim()
  ) {
    return res.status(400).json({ error: 'A fight needs TWO contenders, folks! Step up both fighters and try again.' });
  }
  if (fighterA.trim().length > MAX_FIGHTER_LENGTH || fighterB.trim().length > MAX_FIGHTER_LENGTH) {
    return res.status(400).json({ error: `That name won't fit on the announcer's scoreboard! Keep each fighter to ${MAX_FIGHTER_LENGTH} characters or fewer.` });
  }

  const [verdictResult, imageResults] = await Promise.all([
    getVerdict(fighterA, fighterB).then((v) => ({ ok: true, v }), (err) => ({ ok: false, err })),
    Promise.all([fighterA, fighterB].map((f) =>
      generateImage(f).then((img) => ({ ok: true, img }), (err) => ({ ok: false, err }))
    )),
  ]);

  if (!verdictResult.ok) {
    console.error('Verdict call failed:', verdictResult.err);
    return res.status(502).json({ code: 'verdict_failed', error: 'The judge has wandered off mid-fight! Give it another shot and we\'ll drag them back to their seat.' });
  }
  const verdict = verdictResult.v;
  if (!verdict || (verdict.winner !== fighterA && verdict.winner !== fighterB)) {
    return res.status(502).json({ code: 'verdict_invalid', error: 'The judges scribbled something unreadable on the scorecard! Run the fight again for a proper verdict.' });
  }

  const failed = imageResults.find((r) => !r.ok);
  if (failed) {
    console.error('Image generation failed:', failed.err);
    if (isModerationBlock(failed.err)) {
      return res.status(422).json({
        code: 'moderation_blocked',
        error: "The arena censors have blocked one of those contenders from entering the ring! Pick a different fighter and try again.",
      });
    }
    return res.status(502).json({ code: 'image_failed', error: 'Our portrait painter dropped their brush! The fight is on hold, so try again in a moment.' });
  }

  return res.status(200).json({
    winner: verdict.winner,
    reasoning: verdict.reasoning,
    imageA: imageResults[0].img,
    imageB: imageResults[1].img,
  });
};

async function getVerdict(fighterA, fighterB) {
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
  return response.parsed_output;
}

// One image per fighter, returned as a data URI.
async function generateImage(fighter) {
  const openai = new OpenAI(); // reads OPENAI_API_KEY from env
  const result = await openai.images.generate({
    model: 'gpt-image-2',
    prompt: buildImagePrompt(fighter),
    n: 1,
    size: '1024x1024',
    quality: 'low',
  });
  return `data:image/png;base64,${result.data[0].b64_json}`;
}

function isModerationBlock(err) {
  return err?.code === 'moderation_blocked' || err?.error?.code === 'moderation_blocked';
}
