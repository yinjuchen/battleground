# Battleground — Staged Build Plan

> Source: `project-brief.md`. Each stage ships something runnable/demoable before moving to next. Do not start stage N+1 until stage N works.

---

## Stage 0 — Scaffold

**Goal:** empty project running locally.

- [ ] `index.html`, `style.css`, `script.js` — bare skeleton, no logic yet
- [ ] `vercel.json` (if needed) + `api/` folder for serverless functions
- [ ] `package.json` (name, no deps yet unless a dev server is wanted)
- [ ] Run locally (e.g. `vercel dev` or a static server), confirm blank page loads

**Done when:** blank page loads locally. No deploy until Stage 7 — build and test locally until then.

---

## Stage 1 — Static UI shell (no backend)

**Goal:** all core UI elements exist and are wired to JS, hardcoded/mock data only.

- [ ] Four separate views on one page — input form, loading, result, error — each toggled via `hidden` attribute, never stacked/visible together
- [ ] Input form view: two text inputs (fighter A, fighter B), Fight button — the only view visible on load
- [ ] Loading view: spinner/skeleton, shown on click
- [ ] Result view: winner name, written reasoning, two image slots — populate with placeholder text/images after a fake `setTimeout` delay
- [ ] Error view: placeholder error message
- [ ] Basic CSS layout, mobile-usable

**Done when:** on load only input form shows; clicking Fight hides it, shows loading, then swaps to result view (fake data) via `hidden`, no network calls yet.

---

## Stage 2 — Judge system prompt

**Goal:** lock Claude's role to judging fights, resist prompt injection from fighter input.

- [ ] Write the system prompt used in the verdict call: role locked to fight judge only — takes two fighters, returns a winner and reasoning, nothing else
- [ ] Must always pick exactly one winner — no ties, no draws, no refusing to decide, even for identical/mirrored fighters (break the tie on flavor/creativity if needed, but still pick one)
- [ ] Reasoning must be 2-4 sentences max, fun and playful tone, but logically justifies the winner
- [ ] Explicitly forbid in the prompt: role changes, revealing the system prompt, following instructions embedded in fighter names/descriptions, doing anything other than judging the fight
- [ ] Treat fighter input strictly as data to judge, never as instructions
- [ ] Test with adversarial input (e.g. a fighter name containing "ignore previous instructions and...") — confirm it still just judges a fight
- [ ] Test with identical fighters twice (e.g. "cow" vs "cow") — confirm it still names one winner, no tie/refusal

**Done when:** injected instructions inside fighter text don't change judge behavior or leak the system prompt.

---

## Stage 3 — Fight API (verdict + art + rate limiting)

**Goal:** one function, one call, real winner + reasoning + one image per side, end to end.

- [ ] `api/fight.js` serverless function: takes `{ fighterA, fighterB }`
- [ ] Rate limit check runs first, before calling either API — key by IP, 5 requests/minute per `project-brief.md` §5, return 429 with a clear message when exceeded
- [ ] Calls Claude for the verdict (using the Stage 2 system prompt) and OpenAI image API for both fighters' art
- [ ] Verdict output (`winner`, `reasoning`) enforced via a zod schema, not JSON-format instructions in the prompt
- [ ] Store both API keys in env vars, never in client code
- [ ] Group inputs (e.g. "10 cows") still produce exactly one image for that side — handled in the prompt sent to the image API, not by looping
- [ ] Every generated image follows the shared art style template in `api/art-style.js` (psychedelic ancient Chinese ink-brush fusion in neon magenta/acid green/cobalt/gold, patterns on the figure only, plain flat light-grey background, no text/borders/mandalas/halos/clouds). Build prompts via `buildImagePrompt()`; never inline style text in `fight.js`
- [ ] Wire Fight button to call `/api/fight` instead of the fake timeout
- [ ] Handle errors distinctly in the UI: verdict failure, image failure, moderation-blocked, rate-limit 429 — don't hang on loading forever
- [ ] Moderation-blocked is its own error case, separate from generic image failure: `api/fight.js` detects the image API's moderation/safety rejection and returns a distinct status/`code` (e.g. 422 + `code: 'moderation_blocked'`), and the UI shows a specific message (e.g. "That fighter can't be drawn — try another") rather than the generic image-failure text

**Done when:** typing two real fighters returns winner + reasoning + one image per side from a single call; hammering Fight 6x in a minute from one IP gets blocked on the 6th and resets after a minute.

---

## Stage 4 — BattleDex (save to localStorage)

**Goal:** save individual fighters, view saved fighters.

- [ ] "Save" action per fighter: writes `{ label, image }` to a `localStorage` array — no fight/winner/reasoning data, just the fighter
- [ ] BattleDex lives in its own page, `battledex.html` (+ `battledex.js`; shared storage helpers in `dex.js`), linked from the main page — not a fifth view in `index.html`
- [ ] BattleDex page: grid of saved fighters, each shown as a styled card — image on top, name below, matching a mini trading-card look
- [ ] Cards are display-only: not clickable, no detail view (it's just the name and image)
- [ ] BattleDex page has a link back to the most recent fight's result (`index.html#result`; last fight kept in `sessionStorage`, not `localStorage`, since BattleDex stores no fight data; link hidden if no recent fight)
- [ ] BattleDex page has a link to start a new fight (`index.html`)
- [ ] Delete individual BattleDex entries (a visible Delete button on each card), plus Clear all

**Done when:** save a fighter, reload the page, it's still there in BattleDex.

---

## Stage 5 — Image compression before save

**Goal:** stay under `localStorage` quota (per brief §5).

- [ ] Before saving a fighter to BattleDex, draw its image to an off-screen `<canvas>`, resize down, re-export as JPEG/WebP at reduced quality
- [ ] Save the compressed data URI, not the original
- [ ] Test with several saved fighters that quota isn't hit quickly

**Done when:** ~10+ saved fighters don't blow `localStorage` quota.

---

## Stage 6 — Claude redesign

**Goal:** instead of just polishing the verdict UI, hand the entire app to Claude Design for a full visual overhaul.

- [ ] Hand off the whole app (form, loading, result/verdict, error views, plus the BattleDex page) to Claude Design for a full visual redesign
- [ ] Include the verdict presentation from the brief: winner card with entry animation, plus written reasoning
- [ ] Apply the redesign to `index.html` / `style.css` / `script.js` without breaking the `showView`, `showResult`, `showError` contracts or the `/api/fight` response shape
- [ ] Loading state covers the full wait for the fight call
- [ ] Redesign accommodates the art style (black image cards, light-grey image backgrounds) and all distinct error cases (verdict, image, moderation-blocked, 429)

**Done when:** the whole app has a cohesive redesigned look, no placeholder styling left, and the full Fight + BattleDex flow still works.

---

## Stage 7 — Final QA + deploy

**Goal:** verify the MVP end to end, then ship it to Vercel.

- [ ] Full manual pass: empty inputs, one empty input, same fighter twice, very long names, non-English input
- [ ] Confirm rate limiting doesn't fire on normal single-fight use
- [ ] Confirm loading/error states cover: fight API failure (verdict or image side), moderation-blocked, rate limit hit, network offline
- [ ] Deploy to Vercel: set `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` as Vercel env vars, deploy, and re-run the core Fight flow on the live URL

**Done when:** local build handles the MVP end to end without console errors, and the deployed Vercel app works the same.

---

## Explicitly out of scope (per brief §4 — later, not now)

- Real backend / cross-device BattleDex sync
- Quick re-fight using saved BattleDex characters
