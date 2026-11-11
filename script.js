const views = {
  form: document.getElementById('view-form'),
  loading: document.getElementById('view-loading'),
  result: document.getElementById('view-result'),
  error: document.getElementById('view-error'),
};

function showView(name) {
  for (const key in views) {
    views[key].hidden = key !== name;
  }
}

function showResult({ winner, reasoning, imageA, imageB }) {
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
      showError(data.error || 'Something went wrong. Please try again.');
      return;
    }
    showResult(data);
  } catch (err) {
    showError('Network error — check your connection and try again.');
  }
}

document.getElementById('fight-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fighterA = document.getElementById('fighter-a').value.trim();
  const fighterB = document.getElementById('fighter-b').value.trim();
  runFight(fighterA, fighterB);
});

document.getElementById('result-again').addEventListener('click', () => showView('form'));
document.getElementById('error-again').addEventListener('click', () => showView('form'));
