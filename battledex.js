// BattleDex page: display-only trading cards for saved fighters.

function renderBattleDex() {
  const list = loadDex();
  const grid = document.getElementById('battledex-grid');
  grid.replaceChildren();
  list.forEach((fighter, index) => {
    const card = document.createElement('article');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = fighter.image;
    img.alt = fighter.label;
    const name = document.createElement('p');
    name.className = 'card-name';
    name.textContent = fighter.label;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'card-remove';
    remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete ${fighter.label}`);
    remove.addEventListener('click', () => {
      const current = loadDex();
      current.splice(index, 1);
      saveDex(current);
      renderBattleDex();
    });
    card.append(img, name, remove);
    grid.append(card);
  });
  document.getElementById('battledex-empty').hidden = list.length > 0;
  document.getElementById('battledex-clear').hidden = list.length === 0;
  document.getElementById('battledex-recent').hidden = !loadLastFight();
}

document.getElementById('battledex-clear').addEventListener('click', () => {
  if (confirm('Remove all saved fighters?')) {
    saveDex([]);
    renderBattleDex();
  }
});

renderBattleDex();
