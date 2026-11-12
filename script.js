
const views = {
  form: document.getElementById('view-form'),
  loading: document.getElementById('view-loading'),
  fight: document.getElementById('view-fight'), // arena plays the fight behind this empty view
  result: document.getElementById('view-result'),
  error: document.getElementById('view-error'),
};

const LOADING_MESSAGES = [
  'Sharpening claws...',
  'Consulting the ancient scrolls...',
  'Polishing the championship belt...',
  'Warming up the crowd...',
  'Lighting the lanterns over the Jade Sea...',
  'Taping up the fighters\' knuckles...',
  'Unfurling the battle ribbons...',
  'Asking the judges to stop snacking...',
  'Sweeping the deck planks...',
  'Counting the odds (they are bad)...',
];
const LOADING_INTERVAL_MS = 2500;
let loadingTimer = null;

function startLoadingMessages() {
  stopLoadingMessages();
  const el = document.getElementById('loading-message');
  let i = Math.floor(Math.random() * LOADING_MESSAGES.length);
  el.textContent = LOADING_MESSAGES[i];
  loadingTimer = setInterval(() => {
    i = (i + 1) % LOADING_MESSAGES.length;
    el.textContent = LOADING_MESSAGES[i];
  }, LOADING_INTERVAL_MS);
}

function stopLoadingMessages() {
  clearInterval(loadingTimer);
  loadingTimer = null;
}

function showView(name) {
  for (const key in views) {
    views[key].hidden = key !== name;
  }
  document.body.classList.toggle('fighting', name === 'loading' || name === 'fight');
  if (name === 'loading') startLoadingMessages();
  else stopLoadingMessages();
}

function setSaveButton(btn, saved) {
  btn.disabled = saved;
  btn.textContent = saved ? 'Saved!' : 'Save to BattleDex';
}

let lastResult = null;

function showResult({ winner, reasoning, imageA, imageB, fighterA, fighterB, saved = {}, eyebrow = 'The Emperor has spoken' }) {
  lastResult = { winner, reasoning, imageA, imageB, fighterA, fighterB, saved: { a: !!saved.a, b: !!saved.b } };
  saveLastFight(lastResult);
  for (const side of ['a', 'b']) {
    const label = side === 'a' ? fighterA : fighterB;
    const image = side === 'a' ? imageA : imageB;
    const btn = document.getElementById(`save-${side}`);
    btn.hidden = !label || !image;
    setSaveButton(btn, lastResult.saved[side]);
  }
  document.getElementById('save-status').textContent = '';
  document.getElementById('result-eyebrow').textContent = eyebrow;
  document.getElementById('result-winner').textContent = `${winner} triumphs`;
  document.getElementById('result-reasoning').textContent = reasoning;
  for (const [id, src] of [['result-image-a', imageA], ['result-image-b', imageB]]) {
    const img = document.getElementById(id);
    img.hidden = !src;
    if (src) img.src = src; else img.removeAttribute('src');
  }
  Arena.hold();
  showView('result');
}

function showError(message) {
  Arena.reset();
  document.getElementById('error-message').textContent = message;
  showView('error');
}

async function runFight(fighterA, fighterB) {
  const mode = (document.querySelector('input[name="mode"]:checked') || {}).value || 'play';
  Arena.unlockAudio(); // runs inside the submit click, so sound is allowed
  Arena.intro();
  showView('loading');
  try {
    const res = await fetch('/api/fight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fighterA, fighterB }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showError(data.error || 'Well, THAT wasn\'t in the script! Something broke backstage. Give it another go!');
      return;
    }
    showView('fight');
    const out = await Arena.fight({ fighterA, fighterB, winner: data.winner, imageA: data.imageA, imageB: data.imageB, mode });
    const real = out.winner === 'a' ? fighterA : fighterB;
    if (mode === 'play') {
      showResult({ ...data, winner: real, fighterA, fighterB, eyebrow: out.winner === 'a' ? 'Victory' : 'Defeat',
        reasoning: 'The judge called it for ' + data.winner + '. ' + data.reasoning });
    } else showResult({ ...data, fighterA, fighterB });
  } catch (err) {
    showError('The signal to the arena just got knocked out cold! Check your connection and step back into the ring.');
  }
}

const MAX_FIGHTER_LENGTH = 50; // keep in sync with MAX_FIGHTER_LENGTH in api/fight.js
const formError = document.getElementById('form-error');

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

for (const id of ['fighter-a', 'fighter-b']) {
  document.getElementById(id).addEventListener('input', () => { formError.hidden = true; });
}

document.getElementById('fight-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fighterA = document.getElementById('fighter-a').value.trim();
  const fighterB = document.getElementById('fighter-b').value.trim();
  if (!fighterA || !fighterB) {
    showFormError(!fighterA && !fighterB
      ? 'The ring is empty, folks! Name BOTH contenders before the bell rings.'
      : `Hold the bell! Fighter ${!fighterA ? 'I' : 'II'} hasn't shown up yet. Name your contender to start the fight!`);
    document.getElementById(!fighterA ? 'fighter-a' : 'fighter-b').focus();
    return;
  }
  const tooLong = [fighterA, fighterB].some((f) => f.length > MAX_FIGHTER_LENGTH);
  if (tooLong) {
    showFormError(`That name won't fit on the announcer's scoreboard! Keep each fighter to ${MAX_FIGHTER_LENGTH} characters or fewer.`);
    return;
  }
  formError.hidden = true;
  runFight(fighterA, fighterB);
});

function backToForm() { Arena.reset(); showView('form'); }
document.getElementById('result-again').addEventListener('click', backToForm);
document.getElementById('error-again').addEventListener('click', backToForm);

async function saveFighter(side) {
  if (!lastResult || lastResult.saved[side]) return;
  const label = side === 'a' ? lastResult.fighterA : lastResult.fighterB;
  const image = side === 'a' ? lastResult.imageA : lastResult.imageB;
  const status = document.getElementById('save-status');
  const btn = document.getElementById(`save-${side}`);
  btn.disabled = true;
  try {
    const small = await compressImage(image);
    const list = loadDex();
    list.push({ label, image: small });
    if (!saveDex(list)) throw new Error('quota');
    lastResult.saved[side] = true;
    saveLastFight(lastResult);
    setSaveButton(btn, true);
    status.textContent = '';
  } catch (err) {
    btn.disabled = false;
    status.textContent = 'The trophy shelf is full, champ! Delete a few fighters from the BattleDex to make room.';
  }
}

document.getElementById('save-a').addEventListener('click', () => saveFighter('a'));
document.getElementById('save-b').addEventListener('click', () => saveFighter('b'));

Arena.init();

// Coming back from battledex.html#result: restore the most recent fight.
if (location.hash === '#result') {
  const recent = loadLastFight();
  if (recent) showResult(recent);
}
