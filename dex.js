// Shared BattleDex storage helpers, loaded by index.html and battledex.html.
// BattleDex entries are just { label, image } in localStorage; the most recent
// fight is kept in sessionStorage so the BattleDex page can link back to it.

const DEX_KEY = 'battledex';
const LAST_FIGHT_KEY = 'battleground:lastFight';

function loadDex() {
  try {
    const list = JSON.parse(localStorage.getItem(DEX_KEY));
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
}

// Returns false if the write fails (e.g. localStorage quota exceeded).
function saveDex(list) {
  try {
    localStorage.setItem(DEX_KEY, JSON.stringify(list));
    return true;
  } catch (err) {
    return false;
  }
}

// Best effort: images are large, so this can fail on quota; the app works without it.
function saveLastFight(result) {
  try {
    sessionStorage.setItem(LAST_FIGHT_KEY, JSON.stringify(result));
  } catch (err) {
    try { sessionStorage.removeItem(LAST_FIGHT_KEY); } catch (e) { /* ignore */ }
  }
}

function loadLastFight() {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_FIGHT_KEY));
  } catch (err) {
    return null;
  }
}

// Downsize + recompress an image data URI via an off-screen canvas so many fighters fit in localStorage.
const DEX_IMAGE_SIZE = 512;
const DEX_IMAGE_QUALITY = 0.82;

function compressImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, DEX_IMAGE_SIZE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', DEX_IMAGE_QUALITY));
    };
    img.onerror = () => reject(new Error('Could not load image for compression'));
    img.src = src;
  });
}
