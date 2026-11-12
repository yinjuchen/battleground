
// Battleground arena: pixel fight scene drawn behind the app. Vanilla JS, no deps.
(() => {
const BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const hx = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
function hash(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
function strHash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function rng(seed) { let a = seed || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const $ = (id) => document.getElementById(id);

function buildSea(W, H) {
  const img = new ImageData(W, H), d = img.data, HZ = Math.round(H * .44), DK = Math.round(H * .63), lanterns = [];
  const px = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
  const rect = (x, y, w, h, c) => { c = typeof c === 'string' ? hx(c) : c; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
  const L = (a) => a.map(hx);
  const sky = L(['#070a1e', '#0c1230', '#142046', '#1e3058', '#2c4a68', '#4a6a78', '#8a9a90']);
  const sea = L(['#2a5068', '#1c3c58', '#14304c', '#0e2240', '#0a1a34']);
  const wood = L(['#4a3040', '#5a3a48', '#6a4650']);
  const moonX = Math.round(W * .7), moonY = Math.round(H * .17), mr = Math.max(4, Math.round(W * .045));
  const pk = (x, cx, hw, ht) => ht * H * Math.pow(Math.max(0, 1 - Math.abs(x / W - cx) / hw), .7);
  const far = [[.08, .1, .13], [.3, .07, .2], [.47, .06, .1], [.6, .08, .16], [.93, .1, .23]];
  const near = [[.0, .1, .2], [.19, .06, .15], [.5, .05, .11], [.8, .1, .21]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const b = BAYER[(y & 3) * 4 + (x & 3)] / 16; let c;
    if (y < HZ) {
      const t = y / HZ; c = sky[Math.min(6, Math.floor(t * 6 + b))];
      const dm = Math.hypot(x - moonX, y - moonY);
      if (dm < mr) c = hx(dm < mr * .35 && hash(x, y) > .4 ? '#d8d4b0' : '#f2ecd0');
      else if (dm < mr * 2.6 && hash(x, y) < (1 - (dm - mr) / (mr * 1.6)) * .5) c = hx('#8a98a8');
      if (hash(x, y) > .988 && dm > mr * 3) c = hx('#e8e4ff');
      let fh = 0, nh = 0; far.forEach((p) => fh = Math.max(fh, pk(x, ...p))); near.forEach((p) => nh = Math.max(nh, pk(x, ...p)));
      if (y > HZ - fh) c = hx(y < HZ - fh + 1 ? '#3a5470' : (y > HZ - fh * .5 && b > .5 ? '#20344e' : '#1c2c48'));
      if (y > HZ - nh) c = hx(y < HZ - nh + 1 ? '#2a3a56' : (hash(x >> 1, y >> 1) > .9 ? '#0c1428' : '#10182e'));
      if (y > HZ - 5 && hash(x >> 1, y) > .55 + (HZ - y) * .08) c = hx('#8a9aa0');
    } else if (y < DK) {
      const l = (y - HZ) / (DK - HZ); c = sea[Math.min(4, Math.floor(l * 4 + b * .9))];
      if (hash(x >> 2, y) > .9) c = hx('#2c5a70');
      if (Math.abs(x - moonX) < 3 + l * 10 && hash(x, y) > .45 + l * .2 && (y & 1) === 0) c = hx('#d8e0c0');
    } else {
      const l = y - DK; c = wood[Math.min(2, Math.floor(hash(x >> 4, (y / 7) | 0) * 3))];
      if (l < 2) c = hx(l === 0 ? '#a8805a' : '#7a5a44');
      else if (x % 24 === 0 || l % 7 === 0) c = hx('#2e1c2a');
      else if (hash(x, y) > .94) c = hx('#3a2432');
    }
    px(x, y, c);
  }
  const bx = Math.round(W * .8), by = Math.round(HZ - H * .21);
  for (let i = 0; i < 4; i++) {
    const w = 11 - i * 2, y = by - i * 6;
    rect(bx - (w >> 1), y - 4, w, 4, '#5a1a2a'); rect(bx - (w >> 1) + 1, y - 3, w - 2, 1, '#8a2a3a');
    rect(bx - (w >> 1) - 2, y - 5, w + 4, 1, '#0c1020'); rect(bx - (w >> 1) - 3, y - 6, 1, 1, '#0c1020'); rect(bx + (w >> 1) + 2, y - 6, 1, 1, '#0c1020');
  }
  rect(bx, by - 30, 1, 4, '#d9a84a'); px(bx, by - 31, hx('#ffd860'));
  rect(bx - 1, by, 3, 2, '#d9a84a');
  for (let x = 6; x < W; x += 40) {
    rect(x, DK - 13, 2, 14, '#a01c2c'); rect(x - 1, DK - 14, 4, 1, '#d9a84a'); rect(x, DK + 1, 2, 1, '#3a0a14');
    lanterns.push({ x: x + 1, y: DK - 17 });
  }
  for (let x = 0; x < W; x++) if (x % 40 > 7 || x % 40 < 5) px(x, DK - 8 + (x % 40 > 20 ? 1 : 0), hx('#8a1a2a'));
  return { img, persons: [], torches: [], lanterns, moonX, HZ, DK };
}


const POSES = {
  idle: { hip:[22,32], sh:[23,21], hd:[24,15], af:[[29,24],[32,19]], ab:[[19,25],[22,19]], lf:[[27,39],[29,46]], lb:[[18,40],[15,46]] },
  punch: { hip:[21,32], sh:[25,22], hd:[27,16], af:[[32,22],[41,22]], ab:[[21,26],[27,20]], lf:[[30,39],[34,46]], lb:[[16,40],[10,46]] },
  kick: { hip:[19,30], sh:[17,21], hd:[15,15], af:[[23,26],[27,22]], ab:[[12,24],[9,29]], lf:[[30,28],[41,25]], lb:[[19,39],[18,46]] },
  block: { hip:[21,34], sh:[22,24], hd:[23,18], af:[[28,27],[29,19]], ab:[[27,28],[28,20]], lf:[[27,40],[30,46]], lb:[[16,41],[12,46]] },
  hit: { hip:[24,32], sh:[19,22], hd:[15,17], af:[[16,27],[11,31]], ab:[[13,23],[8,25]], lf:[[28,39],[31,46]], lb:[[21,40],[18,46]] },
  win: { hip:[22,32], sh:[22,21], hd:[22,15], af:[[28,15],[30,8]], ab:[[16,15],[14,8]], lf:[[26,39],[28,46]], lb:[[18,40],[16,46]] },
  down: { hip:[12,43], sh:[22,43], hd:[29,42], af:[[26,46],[33,46]], ab:[[18,46],[14,46]], lf:[[7,43],[2,45]], lb:[[7,45],[2,46]] },
};
const FPAL = {
  a: { robe:'#e8433a', dark:'#8a1a22', trim:'#f2c14e', skin:'#f6cca4', hair:'#1a0a14' },
  b: { robe:'#3a6ad9', dark:'#1a2f7a', trim:'#f2c14e', skin:'#d49468', hair:'#1a0a14' },
};
function ln(c, a, b, w, col) {
  c.fillStyle = col; const n = Math.max(Math.abs(b[0]-a[0]), Math.abs(b[1]-a[1]), 1);
  for (let i = 0; i <= n; i++) { const x = Math.round(a[0]+(b[0]-a[0])*i/n), y = Math.round(a[1]+(b[1]-a[1])*i/n); c.fillRect(x-(w>>1), y-(w>>1), w, w); }
}
function drawFighter(c, pose, p) {
  const q = POSES[pose] || POSES.idle; c.clearRect(0,0,48,48);
  const arm = (j) => { ln(c, q.sh, j[0], 4, '#1a0a14'); ln(c, j[0], j[1], 4, '#1a0a14'); ln(c, q.sh, j[0], 2, p.skin); ln(c, j[0], j[1], 2, p.skin); c.fillStyle=p.trim; c.fillRect(j[1][0]-1, j[1][1]-1, 3, 3); };
  const leg = (j) => { ln(c, q.hip, j[0], 5, '#1a0a14'); ln(c, j[0], j[1], 5, '#1a0a14'); ln(c, q.hip, j[0], 3, p.dark); ln(c, j[0], j[1], 3, p.dark); c.fillStyle='#1a0a14'; c.fillRect(j[1][0]-1, j[1][1]-1, 5, 2); };
  arm(q.ab); leg(q.lb);
  ln(c, q.hip, q.sh, 9, '#1a0a14'); ln(c, q.hip, q.sh, 7, p.robe); ln(c, [q.hip[0], q.hip[1]-1], [q.hip[0], q.hip[1]-1], 7, p.trim);
  leg(q.lf);
  const [x,y] = q.hd; c.fillStyle='#1a0a14'; c.fillRect(x-4,y-5,9,9); c.fillStyle=p.skin; c.fillRect(x-3,y-3,7,7); c.fillStyle=p.hair; c.fillRect(x-3,y-4,7,2);
  c.fillStyle=p.trim; c.fillRect(x-3,y-2,7,1); c.fillStyle='#1a0a14'; c.fillRect(x+1,y,2,1);
  arm(q.af);
}
const IMG_POSE = { idle: 'none', punch: 'translateX(8%) scale(1.06)', kick: 'translate(6%,-6%) rotate(10deg)', block: 'scaleY(.9) translateX(-3%)', hit: 'translateX(-8%) rotate(-12deg)', win: 'translateY(-8%) scale(1.04)' };
// Cut the plain light background out of generated art (flood fill from the edges).
function keyImage(url) {
  return new Promise((res) => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => {
      const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), r = Math.min(N / im.width, N / im.height);
      x.drawImage(im, (N - im.width * r) / 2, (N - im.height * r) / 2, im.width * r, im.height * r);
      try {
        const d = x.getImageData(0, 0, N, N), p = d.data, bg = [p[0], p[1], p[2]], seen = new Uint8Array(N * N), st = [];
        const near = (i) => Math.abs(p[i] - bg[0]) + Math.abs(p[i + 1] - bg[1]) + Math.abs(p[i + 2] - bg[2]) < 54;
        for (let i = 0; i < N; i++) st.push(i, (N - 1) * N + i, i * N, i * N + N - 1);
        while (st.length) { const k = st.pop(); if (seen[k] || !near(k * 4)) continue; seen[k] = 1; p[k * 4 + 3] = 0; const xx = k % N; if (xx > 0) st.push(k - 1); if (xx < N - 1) st.push(k + 1); if (k >= N) st.push(k - N); if (k < N * N - N) st.push(k + N); }
        x.putImageData(d, 0, 0);
      } catch (e) { /* tainted canvas: keep uncut */ }
      res(c);
    };
    im.onerror = () => res(null); im.src = url;
  });
}

class Sfx {
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = .7;
      const comp = this.ctx.createDynamicsCompressor(); this.master.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), dd = b.getChannelData(0);
      for (let i = 0; i < len; i++) dd[i] = Math.random() * 2 - 1; this.nbuf = b;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  env(g, t, a, v, dec) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dec); }
  tone(type, f0, f1, dur, v, delay = 0) { const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); this.env(g, t, .004, v, dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .1); }
  noise(ft, f0, f1, q, dur, v, delay = 0, a = .004) { const c = this.ctx, t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = this.nbuf; f.type = ft; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + a + dur); this.env(g, t, a, v, dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + a + dur + .1); }
  whoosh() { this.noise('bandpass', 300, 2600, 1.4, .14, .45, 0, .07); }
  punch() { this.tone('sine', 170, 45, .16, 1); this.noise('lowpass', 2200, 300, .7, .07, .8); }
  kick() { this.tone('sine', 120, 32, .28, 1.1); this.tone('square', 70, 30, .12, .18); this.noise('lowpass', 2800, 380, .7, .12, .9); }
  block() { this.tone('triangle', 1650, 1520, .4, .25); this.tone('square', 2470, 2300, .16, .07); this.noise('highpass', 3200, 3000, 1, .05, .45); }
  final() { this.kick(); this.tone('sawtooth', 95, 24, .5, .32); this.noise('lowpass', 3200, 180, .5, .5, 1); }
  gong() { const c = this.ctx, t = c.currentTime + .1; [[96,1],[143,.6],[197,.45],[263,.32],[331,.2],[419,.14]].forEach(([fq, v]) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = fq * (1 + Math.random() * .004); this.env(g, t, .01, v * .4, 3.6); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 3.8); }); }
  roar() { this.noise('bandpass', 550, 900, .6, 2.4, .38, .05, .5); }
  fall() { this.tone('sine', 85, 30, .35, .9); this.noise('lowpass', 600, 150, .8, .3, .7); }
  ambStart() { if (this.amb || !this.ctx) return; const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = this.nbuf; s.loop = true; f.type = 'lowpass'; f.frequency.value = 420; g.gain.value = .05; s.connect(f); f.connect(g); g.connect(this.master); s.start(); this.amb = s; }
  ambStop() { if (this.amb) { try { this.amb.stop(); } catch (e) {} this.amb = null; } }
}

const sfx = new Sfx();
const S = { timers: [], hp: { a: 100, b: 100 }, excite: 0, poses: { a: 'idle', b: 'idle' }, imgs: { a: null, b: null }, soundOn: true, bg: null, done: null, winner: 'a' };
const el = {};
const later = (fn, ms) => S.timers.push(setTimeout(fn, ms));
const play = (n) => { if (S.soundOn && sfx.ctx) sfx[n](); };
const size = () => el.wrapA.offsetWidth || 200;
const mover = (s) => s === 'a' ? el.moverA : el.moverB;
const cvOf = (s) => s === 'a' ? el.cvA : el.cvB;

function initBg() {
  const W = innerWidth < 600 ? 150 : 320, H = Math.max(60, Math.round(W * innerHeight / innerWidth));
  if (S.bg && S.bg.W === W && S.bg.H === H) return;
  el.bg.width = W; el.bg.height = H; S.bg = { W, H, ...buildSea(W, H) }; drawBg();
}
function drawBg() {
  if (!S.bg) return; const ctx = el.bg.getContext('2d'), { img, lanterns, moonX, HZ, DK } = S.bg;
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 7; i++) { ctx.fillStyle = Math.random() > .5 ? '#f2f0d0' : '#a8c0c0'; ctx.fillRect(moonX + ((Math.random() * 2 - 1) * 14 | 0), HZ + 2 + (Math.random() * (DK - HZ - 3) | 0), 2, 1); }
  for (const t of lanterns) {
    ctx.fillStyle = '#d9a84a'; ctx.fillRect(t.x - 1, t.y, 3, 1); ctx.fillStyle = '#d8342c'; ctx.fillRect(t.x - 1, t.y + 1, 3, 3); ctx.fillStyle = '#ffd860'; ctx.fillRect(t.x, t.y + 2, 1, 1); ctx.fillStyle = '#d9a84a'; ctx.fillRect(t.x - 1, t.y + 4, 3, 1);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,90,50,' + (.12 + Math.random() * .05 + S.excite * .08) + ')'; ctx.beginPath(); ctx.arc(t.x, t.y + 3, 9, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  }
  S.excite *= .88;
}

function drawPose(s) {
  const cv = cvOf(s), img = S.imgs[s], key = S.poses[s] + (img ? '#' + img.n : ''); if (cv.dataset.p === key) return; cv.dataset.p = key;
  if (img) {
    if (cv.width !== 256) { cv.width = cv.height = 256; cv.style.imageRendering = 'auto'; }
    const g = cv.getContext('2d'); g.clearRect(0, 0, 256, 256); g.drawImage(img.c, 0, 0);
    cv.style.transform = S.poses[s] === 'down' ? 'rotate(' + (s === 'b' ? 80 : -80) + 'deg) translateY(8%)' : IMG_POSE[S.poses[s]] || 'none';
  } else {
    if (cv.width !== 48) { cv.width = cv.height = 48; cv.style.imageRendering = 'pixelated'; }
    cv.style.transform = 'none'; drawFighter(cv.getContext('2d'), S.poses[s], FPAL[s]);
  }
}
function pose(s, n, ms) { S.poses[s] = n; drawPose(s); if (ms) later(() => { if (S.poses[s] === n) { S.poses[s] = 'idle'; drawPose(s); } }, ms); }
async function setImg(s, url) { S.imgs[s] = null; if (!url) return drawPose(s); const c = await keyImage(url); if (c) S.imgs[s] = { c, n: Date.now() }; drawPose(s); }

function syncHp(instant) {
  for (const s of ['a', 'b']) {
    const S_ = s.toUpperCase(), f = el['fill' + S_], t = el['trail' + S_]; f.style.transition = instant ? 'none' : 'width 140ms steps(5)'; t.style.transition = instant ? 'none' : 'width 520ms steps(8) 380ms';
    f.style.width = t.style.width = Math.max(0, S.hp[s]) + '%';
  }
}
function idle(s, hop) {
  const e = s === 'a' ? el.bobA : el.bobB, z = size(); e.getAnimations().forEach((a) => a.cancel());
  e.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-z * (hop ? .1 : .025)) + 'px)' }, { transform: 'translateY(0)' }], { duration: hop ? 520 : 900, iterations: Infinity, easing: 'steps(4,end)', delay: s === 'b' && !hop ? 450 : 0 });
}
function shake(px, dur = 280) { const f = []; for (let i = 0; i <= 7; i++) { const k = px * (1 - i / 7); f.push({ transform: 'translate(' + (Math.random() * 2 - 1) * k + 'px,' + (Math.random() * 2 - 1) * k + 'px)' }); } el.world.animate(f, { duration: dur, easing: 'steps(7)' }); }
function spark(x, y, type) {
  const L = el.sparks, u = Math.max(3, Math.round(size() / 55)), big = type === 'final';
  const cols = type === 'block' ? ['#ffffff', '#bfe8ff', '#6ab8ff'] : ['#ffffff', '#fff2a0', '#ffd84a', '#ff8a2a'];
  const mk = (css) => { const e = document.createElement('div'); e.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;' + css; L.appendChild(e); return e; };
  const ds = u * (big ? 20 : 10), dia = mk('width:' + ds + 'px;height:' + ds + 'px;margin:' + (-ds / 2) + 'px 0 0 ' + (-ds / 2) + 'px;border:' + u + 'px solid ' + cols[1] + ';box-sizing:border-box');
  dia.animate([{ transform: 'rotate(45deg) scale(.2)', opacity: 1 }, { transform: 'rotate(45deg) scale(1.5)', opacity: 0 }], { duration: big ? 360 : 220, easing: 'steps(4)' }).onfinish = () => dia.remove();
  const core = mk('width:' + u * 5 + 'px;height:' + u * 5 + 'px;margin:' + (-u * 2.5) + 'px 0 0 ' + (-u * 2.5) + 'px;background:#fff');
  core.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'steps(2)' }).onfinish = () => core.remove();
  const n = big ? 24 : type === 'block' ? 8 : 13;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = (6 + Math.random() * 16) * u * (big ? 1.8 : 1), dx = Math.cos(a) * r, dy = Math.sin(a) * r * .8, e = mk('width:' + u + 'px;height:' + u + 'px;background:' + cols[(Math.random() * cols.length) | 0]);
    e.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: 1, offset: .7 }, { transform: 'translate(' + dx * 1.1 + 'px,' + (dy * 1.1 + u * 6) + 'px)', opacity: 0 }], { duration: 380 + Math.random() * 200, easing: 'steps(7)' }).onfinish = () => e.remove();
  }
}
function flashSprite(s) { cvOf(s).parentNode.animate([{ filter: 'none' }, { filter: 'sepia(1) saturate(9) hue-rotate(-35deg)' }, { filter: 'none' }], { duration: 240, easing: 'steps(3)' }); }
function downPose(animate) {
  const W = S.winner, L = W === 'a' ? 'b' : 'a', dir = L === 'b' ? 1 : -1, z = size(), m = mover(L);
  pose(L, 'down'); pose(W, 'win');
  const end = { transform: 'translate(' + dir * z * .12 + 'px,0)' };
  if (!animate) return m.animate([end, end], { duration: 1, fill: 'forwards' });
  m.animate([{ transform: 'none' }, { transform: 'translate(' + dir * z * .1 + 'px,' + (-z * .25) + 'px)', offset: .4 }, end], { duration: 700, easing: 'ease-out', fill: 'forwards' });
}
function makeBeats(a, b) {
  const W = S.winner, L = W === 'a' ? 'b' : 'a', r = rng(strHash(a + '|' + b));
  const tpl = [[W,'hit'],[L,'block'],[L,'hit'],[W,'dodge'],[W,'hit'],[L,'hit'],[W,'block'],[L,'hit'],[W,'hit'],[W,'final']];
  const toL = [22,19,24], toW = [15,17,14]; let iL = 0, iW = 0;
  return tpl.map(([att, out]) => {
    const kind = out === 'final' ? 'final' : r() < .5 ? 'kick' : 'punch'; let dmg = 0;
    if (out === 'hit') dmg = att === W ? toL[iL++] + Math.round(r() * 6 - 3) : toW[iW++] + Math.round(r() * 6 - 3);
    if (out === 'block') dmg = 2; if (out === 'final') dmg = 999;
    return { att, kind, out, dmg };
  });
}
function doBeat({ att, kind, out, dmg }) {
  const def = att === 'a' ? 'b' : 'a', dir = att === 'a' ? 1 : -1, z = size(), m = mover(att);
  const D = Math.max(20, el.wrapB.offsetLeft - el.wrapA.offsetLeft - z * .55), dur = kind === 'final' ? 900 : kind === 'kick' ? 640 : 560;
  const T = (x, y, r = 0, sy = 1) => ({ transform: 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) scaleY(' + sy + ')' });
  let kf;
  if (kind === 'punch') kf = [T(0,0), { ...T(-dir*z*.08,0), offset: .3 }, { ...T(dir*D,0,dir*4), offset: .5 }, { ...T(dir*D,0,dir*4), offset: .62 }, T(0,0)];
  else if (kind === 'kick') kf = [T(0,0), { ...T(-dir*z*.06,z*.02,0,.92), offset: .28 }, { ...T(dir*D*.92,-z*.16,dir*14), offset: .5 }, { ...T(dir*D*.9,-z*.14,dir*12), offset: .62 }, T(0,0)];
  else kf = [T(0,0), { ...T(-dir*z*.12,z*.04,-dir*4,.85), offset: .35 }, { ...T(dir*D*1.02,-z*.22,dir*20), offset: .5 }, { ...T(dir*D,-z*.18,dir*16), offset: .66 }, T(0,0)];
  m.animate(kf, { duration: dur, easing: 'cubic-bezier(.3,0,.2,1)' });
  later(() => pose(att, kind === 'punch' ? 'punch' : 'kick'), dur * .3); later(() => pose(att, 'idle'), dur * .78);
  later(() => play('whoosh'), dur * .28); later(() => impact(att, def, kind, out, dmg, dir), dur * .5);
}
function impact(att, def, kind, out, dmg, dir) {
  const z = size(), wd = def === 'a' ? el.wrapA : el.wrapB, dm = mover(def), x = wd.offsetLeft - dir * z * .22, y = wd.offsetTop + z * (kind === 'punch' ? .45 : .35);
  if (out === 'dodge') { dm.animate([{ transform: 'none' }, { transform: 'translate(' + dir * z * .3 + 'px,' + (-z * .2) + 'px)', offset: .45 }, { transform: 'none' }], { duration: 440, easing: 'ease-out' }); play('whoosh'); return; }
  if (out === 'block') { dm.animate([{ transform: 'none' }, { transform: 'translateX(' + dir * z * .06 + 'px)' }, { transform: 'none' }], { duration: 240, easing: 'steps(4)' }); pose(def, 'block', 320); spark(x, y, 'block'); shake(3, 180); play('block'); S.hp[def] -= dmg; syncHp(); S.excite = .4; return; }
  S.hp[def] -= dmg; syncHp(); S.excite = 1;
  if (kind === 'final') return ko(att, def, x, y);
  dm.animate([{ transform: 'none' }, { transform: 'translate(' + dir * z * .18 + 'px,0) rotate(' + dir * 9 + 'deg)', offset: .3 }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
  pose(def, 'hit', 380); flashSprite(def); spark(x, y, 'hit'); shake(kind === 'kick' ? 11 : 7); play(kind);
}
function ko(att, def, x, y) {
  const anims = mover(att).getAnimations(); anims.forEach((a) => a.pause()); later(() => anims.forEach((a) => a.play()), 160);
  el.flash.animate([{ opacity: .85 }, { opacity: 0 }], { duration: 380, easing: 'steps(4)' });
  flashSprite(def); spark(x, y, 'final'); shake(18, 460); play('final'); play('roar'); later(() => play('gong'), 200);
  (def === 'a' ? el.bobA : el.bobB).getAnimations().forEach((a) => a.cancel());
  downPose(true); later(() => play('fall'), 800); later(() => { S.excite = 1; idle(att, true); }, 600);
  el.ko.textContent = 'K.O.'; el.ko.hidden = false; el.ko.animate([{ transform: 'scale(3)', opacity: 0 }, { transform: 'scale(.9)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: 'steps(6)' });
  later(finish, 2400);
}
function finish() { S.playing = false; cancelAnimationFrame(S.raf); el.controlsSkip.hidden = true; el.ko.hidden = true; el.hud.hidden = true; el.pad.hidden = true; el.keys.hidden = true; if (S.done) { const d = S.done; S.done = null; d({ winner: S.winner }); } }


// ---------- Play mode: you are Fighter I, the AI is Fighter II ----------
const INP = { left: 0, right: 0, punch: 0, kick: 0, block: 0 };
const KEYMAP = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', j: 'punch', z: 'punch', k: 'kick', x: 'kick', l: 'block', c: 'block', ArrowDown: 'block', s: 'block' };
const MOVES = {
  punch: { hitAt: .13, total: .38, range: .62, dmg: 8, kb: .02, stun: .3 },
  kick: { hitAt: .22, total: .58, range: .82, dmg: 13, kb: .045, stun: .42 },
};
let G = null;
function mkF(s, x, dir, max) { return { s, x, dir, hp: max, max, act: null, actT: 0, hitDone: false, stun: 0, blocking: false }; }
function wrapX(f) { (f.s === 'a' ? el.wrapA : el.wrapB).style.left = f.x * 100 + '%'; }
function dist() { return Math.abs(G.a.x - G.b.x) * innerWidth; }
function banner(text, ms) {
  el.ko.textContent = text; el.ko.hidden = false;
  el.ko.animate([{ transform: 'scale(2.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'steps(5)' });
  later(() => { el.ko.hidden = true; el.ko.textContent = 'K.O.'; }, ms);
}
function startAct(f, kind) {
  const m = MOVES[kind], z = size(); f.act = { kind, ...m }; f.actT = 0; f.hitDone = false;
  mover(f.s).animate(kind === 'punch'
    ? [{ transform: 'none' }, { transform: 'translateX(' + f.dir * z * .1 + 'px)', offset: .4 }, { transform: 'none' }]
    : [{ transform: 'none' }, { transform: 'translate(' + f.dir * z * .1 + 'px,' + (-z * .08) + 'px) rotate(' + f.dir * 10 + 'deg)', offset: .45 }, { transform: 'none' }],
    { duration: m.total * 1000, easing: 'ease-out' });
  later(() => play('whoosh'), (m.hitAt - .05) * 1000);
}
function tryHit(f, o) {
  const z = size(), act = f.act; if (dist() > act.range * z) return;
  const wd = o.s === 'a' ? el.wrapA : el.wrapB, x = wd.offsetLeft - f.dir * z * .2, y = wd.offsetTop + z * (act.kind === 'punch' ? .45 : .35);
  const clampX = (v) => Math.min(.94, Math.max(.06, v));
  if (o.blocking && o.stun <= 0) {
    o.hp -= act.dmg * .12; o.x = clampX(o.x + f.dir * act.kb * .4); wrapX(o); syncG(); spark(x, y, 'block'); shake(3, 180); play('block'); S.excite = .4; return;
  }
  o.hp -= act.dmg * (f.s === 'b' ? G.aiDmg : 1); o.stun = act.stun; o.act = null; o.blocking = false;
  o.x = clampX(o.x + f.dir * act.kb); wrapX(o); syncG(); S.excite = 1;
  mover(o.s).animate([{ transform: 'none' }, { transform: 'translate(' + f.dir * z * .12 + 'px,0) rotate(' + f.dir * 8 + 'deg)', offset: .3 }, { transform: 'none' }], { duration: 360, easing: 'ease-out' });
  flashSprite(o.s); spark(x, y, 'hit'); shake(act.kind === 'kick' ? 11 : 7); play(act.kind);
  if (o.hp <= 0) { G.over = true; S.winner = f.s; S.playing = false; syncG(); ko(f.s, o.s, x, y); }
}
function syncG() { S.hp.a = G.a.hp / G.a.max * 100; S.hp.b = G.b.hp / G.b.max * 100; syncHp(); }
function stepF(f, o, inp, dt) {
  if (f.stun > 0) { f.stun -= dt; f.blocking = false; return; }
  if (f.act) { f.actT += dt; if (!f.hitDone && f.actT >= f.act.hitAt) { f.hitDone = true; tryHit(f, o); } if (f.actT >= f.act.total) f.act = null; return; }
  f.blocking = !!inp.block; if (f.blocking) return;
  if (inp.punch) return startAct(f, 'punch');
  if (inp.kick) return startAct(f, 'kick');
  const vx = (inp.right - inp.left) * .22 * dt * (f.s === 'b' ? G.aiSpeed : 1);
  let nx = f.x + vx; const minSep = .42 * size() / innerWidth;
  nx = f.dir > 0 ? Math.min(nx, o.x - minSep) : Math.max(nx, o.x + minSep); f.x = Math.min(.94, Math.max(.06, nx));
}
function aiInput(dt) {
  const b = G.b, a = G.a, d = dist(), z = size(), I = G.ai, df = G.diff;
  I.t -= dt; if (I.hold > 0) I.hold -= dt;
  const out = { left: 0, right: 0, punch: 0, kick: 0, block: 0 };
  if (I.t <= 0) {
    I.t = .1 + (1 - df) * .35 * Math.random(); const r = Math.random();
    if (a.act && d < MOVES.kick.range * z * 1.15 && r < df * .8) { I.mode = 'block'; I.hold = .3 + Math.random() * .25; }
    else if (d > MOVES.punch.range * z * .95) { I.mode = d > MOVES.kick.range * z ? 'approach' : (r < .5 ? 'kick' : 'approach'); I.hold = .25; }
    else if (a.stun > 0 && r < .4 + df * .5) I.mode = Math.random() < .5 ? 'kick' : 'punch';
    else if (r < .18) { I.mode = 'retreat'; I.hold = .25 + Math.random() * .3; }
    else if (r < .28 + df * .2) I.mode = Math.random() < .6 ? 'punch' : 'kick';
    else { I.mode = 'wait'; I.hold = .15; }
  }
  if (I.mode === 'block' && I.hold > 0) out.block = 1;
  else if (I.mode === 'approach' && I.hold > 0) out.left = 1;
  else if (I.mode === 'retreat' && I.hold > 0) out.right = 1;
  else if (I.mode === 'punch' || I.mode === 'kick') { out[I.mode] = 1; I.mode = 'wait'; I.hold = .1; }
  return out;
}
function loop(now) {
  if (!S.playing) return; const dt = Math.min(.05, (now - G.last) / 1000); G.last = now;
  const keyed = { left: INP.left, right: INP.right, punch: INP.punch, kick: INP.kick, block: INP.block };
  INP.punch = INP.kick = 0;
  stepF(G.a, G.b, keyed, dt);
  if (S.playing) stepF(G.b, G.a, aiInput(dt), dt);
  for (const f of [G.a, G.b]) { wrapX(f); if (S.playing || !G.over) { const want = f.stun > 0 ? 'hit' : f.act ? f.act.kind : f.blocking ? 'block' : 'idle'; if (S.poses[f.s] !== want) { S.poses[f.s] = want; drawPose(f.s); } } }
  S.raf = requestAnimationFrame(loop);
}
function startPlay(judge) {
  const diff = judge === 'b' ? .8 : .4, bMax = judge === 'b' ? 130 : 85;
  G = { a: mkF('a', .27, 1, 100), b: mkF('b', .73, -1, bMax), diff, aiDmg: judge === 'b' ? 1.15 : .85, aiSpeed: .8 + diff * .35, ai: { t: .5, hold: 0, mode: 'wait' }, over: false, last: performance.now() };
  S.hp = { a: 100, b: 100 }; syncHp(true); wrapX(G.a); wrapX(G.b);
  S.playing = true; G.last = performance.now(); S.raf = requestAnimationFrame(loop);
}
function press(k, v) { if (!S.playing) return; if (k === 'punch' || k === 'kick') { if (v) INP[k] = 1; } else INP[k] = v; }

const Arena = {
  init() {
    for (const [k, id] of Object.entries({ bg: 'arena-bg', world: 'arena-world', sparks: 'arena-sparks', flash: 'arena-flash', hud: 'arena-hud', ko: 'arena-ko', wrapA: 'wrap-a', wrapB: 'wrap-b', moverA: 'mover-a', moverB: 'mover-b', bobA: 'bob-a', bobB: 'bob-b', cvA: 'cv-a', cvB: 'cv-b', fillA: 'fill-a', fillB: 'fill-b', trailA: 'trail-a', trailB: 'trail-b', nameA: 'name-a', nameB: 'name-b', controls: 'arena-controls', controlsSkip: 'arena-skip', soundBtn: 'arena-sound', pad: 'arena-pad', keys: 'arena-keys' })) el[k] = $(id);
    initBg(); addEventListener('resize', initBg); setInterval(drawBg, 90);
    el.soundBtn.addEventListener('click', () => { S.soundOn = !S.soundOn; el.soundBtn.textContent = 'SOUND: ' + (S.soundOn ? 'ON' : 'OFF'); if (S.soundOn) { sfx.init(); sfx.ambStart(); } else sfx.ambStop(); });
    el.controlsSkip.addEventListener('click', () => Arena.skip());
    addEventListener('keydown', (e) => { const k = KEYMAP[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (!k || !S.playing) return; e.preventDefault(); if (!e.repeat || k === 'left' || k === 'right' || k === 'block') press(k, 1); });
    addEventListener('keyup', (e) => { const k = KEYMAP[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (k && (k === 'left' || k === 'right' || k === 'block')) press(k, 0); });
    el.pad.querySelectorAll('[data-k]').forEach((b) => {
      const k = b.dataset.k, up = () => { press(k, 0); b.classList.remove('on'); };
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('on'); press(k, 1); });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, up);
    });
    this.reset();
  },
  unlockAudio() { sfx.init(); },
  reset() {
    S.timers.forEach(clearTimeout); S.timers = []; S.done = null; S.playing = false; cancelAnimationFrame(S.raf); INP.left = INP.right = INP.block = 0; sfx.ambStop();
    for (const e of [el.bobA, el.bobB, el.moverA, el.moverB]) e.getAnimations().forEach((a) => a.cancel());
    S.poses = { a: 'idle', b: 'idle' }; S.imgs = { a: null, b: null };
    for (const s of ['a', 'b']) { cvOf(s).dataset.p = ''; drawPose(s); }
    el.wrapA.hidden = el.wrapB.hidden = el.hud.hidden = el.ko.hidden = el.controls.hidden = true; el.controlsSkip.hidden = true; el.pad.hidden = el.keys.hidden = true; el.ko.textContent = 'K.O.'; el.wrapA.style.left = '27%'; el.wrapB.style.left = '73%';
  },
  // Loading phase: empty sea while the verdict and art are generated (no placeholder fighters).
  intro() {
    this.reset(); el.controls.hidden = false; el.soundBtn.textContent = 'SOUND: ' + (S.soundOn ? 'ON' : 'OFF');
    sfx.init(); if (S.soundOn) { sfx.whoosh(); sfx.ambStart(); }
  },
  // Verdict + art arrived: fighters enter already wearing their art. mode 'play' = you control Fighter I; 'watch' = scripted.
  // Resolves { winner: 'a' | 'b' } after the K.O.
  async fight({ fighterA, fighterB, winner, imageA, imageB, mode }) {
    const judge = winner === fighterB && winner !== fighterA ? 'b' : 'a'; S.winner = judge; S.mode = mode === 'watch' ? 'watch' : 'play';
    await Promise.all([setImg('a', imageA), setImg('b', imageB)]);
    S.hp = { a: 100, b: 100 }; el.nameA.textContent = fighterA + (S.mode === 'play' ? ' · YOU' : ''); el.nameB.textContent = fighterB; syncHp(true);
    el.wrapA.hidden = el.wrapB.hidden = el.hud.hidden = false;
    const w = innerWidth;
    for (const s of ['a', 'b']) { mover(s).animate([{ transform: 'translateX(' + (s === 'a' ? -1 : 1) * w * .5 + 'px)' }, { transform: 'none' }], { duration: 700, easing: 'steps(10)' }); idle(s); }
    play('whoosh');
    return new Promise((resolve) => {
      S.done = resolve;
      if (S.mode === 'watch') {
        el.controlsSkip.hidden = false; later(() => play('gong'), 700);
        let t = 1200; makeBeats(fighterA, fighterB).forEach((b) => { later(() => doBeat(b), t); t += 950; });
      } else {
        later(() => { banner('FIGHT!', 800); play('gong'); el.pad.hidden = false; el.keys.hidden = false; }, 900);
        later(() => startPlay(judge), 1400);
      }
    });
  },
  skip() {
    if (!S.done) return; S.timers.forEach(clearTimeout); S.timers = [];
    for (const e of [el.moverA, el.moverB, el.bobA, el.bobB]) e.getAnimations().forEach((a) => a.cancel());
    const W = S.winner; S.hp = { a: W === 'a' ? 40 : 0, b: W === 'b' ? 40 : 0 }; syncHp(true); downPose(false); idle(W, true); play('gong'); finish();
  },
  // Result view is showing: keep the K.O. tableau behind the panel.
  hold() { el.pad.hidden = el.keys.hidden = true; el.hud.hidden = true; el.controls.hidden = true; sfx.ambStop(); },
};
window.Arena = Arena;
})();
