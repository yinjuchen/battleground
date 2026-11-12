const views = {
  form: document.getElementById('view-form'),
  loading: document.getElementById('view-loading'),
  result: document.getElementById('view-result'),
  error: document.getElementById('view-error'),
};

const LOADING_MESSAGES = [
  'Sharpening claws...',
  'Consulting the ancient scrolls...',
  'Polishing the championship belt...',
  'Warming up the crowd...',
  'Summoning the arena torches...',
  'Taping up the fighters\' knuckles...',
  'Unfurling the battle ribbons...',
  'Asking the judges to stop snacking...',
  'Sweeping the sand off the arena floor...',
  'Counting the odds (they are bad)...',
];
const LOADING_INTERVAL_MS = 2500;
let loadingTimer = null;

// Cycle through the loading phrases (random start, no immediate repeats) while the loading view is up.
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
  if (name === 'loading') startLoadingMessages();
  else stopLoadingMessages();
}

function setSaveButton(btn, saved) {
  btn.disabled = saved;
  btn.textContent = saved ? 'Saved!' : 'Save to BattleDex';
}

// Most recent successful fight (also persisted via saveLastFight so BattleDex can link back).
let lastResult = null;

function showResult({ winner, reasoning, imageA, imageB, fighterA, fighterB, saved = {} }) {
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
  document.getElementById('result-winner').textContent = `${winner} wins!`;
  document.getElementById('result-reasoning').textContent = reasoning;
  for (const [id, src] of [['result-image-a', imageA], ['result-image-b', imageB]]) {
    const img = document.getElementById(id);
    img.hidden = !src;
    img.src = src || '';
  }
  showView('result');
}

function showError(message) {
  document.getElementById('error-message').textContent = message;
  showView('error');
}

async function runFight(fighterA, fighterB) {
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
    showResult({ ...data, fighterA, fighterB });
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

// Typing again clears the inline form error.
for (const id of ['fighter-a', 'fighter-b']) {
  document.getElementById(id).addEventListener('input', () => { formError.hidden = true; });
}

document.getElementById('fight-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fighterA = document.getElementById('fighter-a').value.trim();
  const fighterB = document.getElementById('fighter-b').value.trim();
  const tooLong = [fighterA, fighterB].some((f) => f.length > MAX_FIGHTER_LENGTH);
  if (tooLong) {
    showFormError(`That name won't fit on the announcer's scoreboard! Keep each fighter to ${MAX_FIGHTER_LENGTH} characters or fewer.`);
    return;
  }
  formError.hidden = true;
  runFight(fighterA, fighterB);
});

document.getElementById('result-again').addEventListener('click', () => showView('form'));
document.getElementById('error-again').addEventListener('click', () => showView('form'));

async function saveFighter(side) {
  if (!lastResult || lastResult.saved[side]) return;
  const label = side === 'a' ? lastResult.fighterA : lastResult.fighterB;
  const image = side === 'a' ? lastResult.imageA : lastResult.imageB;
  const status = document.getElementById('save-status');
  const btn = document.getElementById(`save-${side}`);
  btn.disabled = true; // block double-clicks while compressing
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

// Coming back from battledex.html#result: restore the most recent fight.
if (location.hash === '#result') {
  const recent = loadLastFight();
  if (recent) showResult(recent);
}
