// ===== Rdzeń: kształty, graf dróg, dopasowanie, trasowanie =====
const EARTH = 6371000;
function makeProj(lat0, lon0) {
  const ky = Math.PI / 180 * EARTH, kx = ky * Math.cos(lat0 * Math.PI / 180);
  return { fwd: (lat, lon) => [(lon - lon0) * kx, (lat - lat0) * ky], inv: (x, y) => [lat0 + y / ky, lon0 + x / kx] };
}
const hyp = Math.hypot;
function polyLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += hyp(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
function resample(p, n) {
  const cum = [0];
  for (let k = 1; k < p.length; k++) cum.push(cum[k - 1] + hyp(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]));
  const L = cum[cum.length - 1], out = [p[0].slice()];
  if (L === 0 || n < 2) return out;
  let i = 1;
  for (let j = 1; j < n; j++) {
    const t = L * j / (n - 1);
    while (i < p.length - 1 && cum[i] < t) i++;
    const sl = cum[i] - cum[i - 1], f = sl ? (t - cum[i - 1]) / sl : 0;
    out.push([p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f]);
  }
  return out;
}
// zagęszcza polilinię, zachowując wierzchołki
function densify(p, maxStep) {
  const out = [p[0]];
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i], d = hyp(b[0] - a[0], b[1] - a[1]), k = Math.ceil(d / maxStep);
    for (let j = 1; j <= k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  return out;
}

// ---------- Kształty (oś Y w górę = północ) ----------
function arc(cx, cy, rx, ry, a0, a1, n) { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; }
const POLSKA = [[3.05,-0.07],[3.35,-0.72],[3.28,-0.81],[3.35,-1.06],[2.5,-1.99],[2.56,-2.57],[1.84,-2.18],[1.5,-2.17],[1.37,-2.28],[1.06,-2.21],[0.87,-2.41],[0.68,-2.39],[0.69,-2.22],[0.49,-1.99],[0.2,-2.2],[-0.05,-1.71],[-0.38,-1.56],[-0.5,-1.61],[-0.63,-1.48],[-0.58,-1.28],[-0.76,-1.34],[-1.09,-1.16],[-1.02,-1.35],[-1.24,-1.49],[-1.5,-1.17],[-1.37,-1.02],[-1.46,-0.94],[-1.63,-0.98],[-2.25,-0.58],[-2.36,-0.73],[-2.24,-0.34],[-2.49,0.24],[-2.4,0.49],[-2.48,0.94],[-2.78,1.29],[-2.61,1.61],[-2.7,2.14],[-2.5,2.05],[-2.52,2.23],[-2.73,2.36],[-1.52,2.7],[-1.29,2.96],[-0.35,3.24],[0.07,3.09],[-0.13,3.15],[0.01,2.84],[0.2,2.76],[0.59,2.87],[2.61,2.8],[2.96,2.55],[3.23,1.44],[3.23,1.11],[2.79,0.69],[3.08,0.45]];
function heart() { const o = []; for (let i = 0; i < 48; i++) { const t = Math.PI + 2 * Math.PI * i / 48; o.push([16 * Math.sin(t) ** 3 / 16, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]); } return o; }
function star() { const o = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 1; o.push([r * Math.cos(a), r * Math.sin(a)]); } return o; }
function snail() {
  const o = [], T = 5 * Math.PI;
  for (let i = 0; i <= 60; i++) { const t = T * i / 60, r = 0.08 + 0.92 * t / T; o.push([r * Math.cos(t), r * Math.sin(t)]); }
  return o.concat([[-1.2, -1.0], [1.4, -1.0], [1.8, -0.6], [1.75, 0.3], [1.5, 0.9], [1.75, 0.3], [2.0, 0.85]]);
}
const SHAPES = [
  { id: 'serce', name: 'Serce', fun: 'Klasyk. Działa zawsze.', pts: heart(), closed: true, maxRot: 20 },
  { id: 'polska', name: 'Polska', fun: 'Patriotyczny trening, Hel w cenie.', pts: POLSKA, closed: true, maxRot: 10 },
  { id: 'gwiazda', name: 'Gwiazda', fun: 'Pięć ramion, dużo zakrętów.', pts: star(), closed: true, maxRot: 36 },
  { id: 'kot', name: 'Kot', fun: 'Uszy wychodzą najlepiej na prostych ulicach.', pts: [[-1, 0.3], [-0.95, 1.35], [-0.4, 0.78], [0.4, 0.78], [0.95, 1.35], [1, 0.3]].concat(arc(0, 0.3, 1, 0.95, 0, -180, 14).slice(1, -1)), closed: true, maxRot: 15 },
  { id: 'ryba', name: 'Ryba', fun: 'Bo czemu nie.', pts: arc(0.2, 0, 0.8, 0.5, 0, 160, 10).concat([[-1.15, 0.45], [-1.15, -0.45]], arc(0.2, 0, 0.8, 0.5, 200, 360, 10).slice(0, -1)), closed: true, maxRot: 30 },
  { id: 'duszek', name: 'Duszek', fun: 'Buu! Falbanka na dole to wyzwanie.', pts: arc(0, 0.2, 1, 1, 0, 180, 12).concat([[-1, -1], [-0.66, -0.7], [-0.33, -1], [0, -0.7], [0.33, -1], [0.66, -0.7], [1, -1]]), closed: true, maxRot: 15 },
  { id: 'grzyb', name: 'Grzyb', fun: 'Grzybobranie bez koszyka.', pts: arc(0, 0.2, 1.1, 0.9, 180, 0, 12).concat([[0.35, 0.2], [0.42, -1], [-0.42, -1], [-0.35, 0.2]]), closed: true, maxRot: 15 },
  { id: 'choinka', name: 'Choinka', fun: 'Świąteczny trening w trzech piętrach.', pts: [[0, 1.5], [0.6, 0.6], [0.3, 0.6], [0.8, -0.2], [0.4, -0.2], [1, -1], [0.15, -1], [0.15, -1.4], [-0.15, -1.4], [-0.15, -1], [-1, -1], [-0.4, -0.2], [-0.8, -0.2], [-0.3, 0.6], [-0.6, 0.6]], closed: true, maxRot: 10 },
  { id: 'domek', name: 'Domek', fun: 'Najłatwiejszy kształt dla miast z kratką ulic.', pts: [[-1, -1], [1, -1], [1, 0.4], [0, 1.3], [-1, 0.4]], closed: true, maxRot: 10 },
  { id: 'blyskawica', name: 'Błyskawica', fun: 'Dla tych, co biegną szybko.', pts: [[0.25, 1.5], [-0.6, -0.1], [0, -0.1], [-0.35, -1.5], [0.7, 0.3], [0.1, 0.3], [0.6, 1.5]], closed: true, maxRot: 20 },
  { id: 'strzalka', name: 'Strzałka', fun: 'Wskazuje drogę. Dosłownie.', pts: [[-0.25, -1], [0.25, -1], [0.25, 0.3], [0.6, 0.3], [0, 1], [-0.6, 0.3], [-0.25, 0.3]], closed: true, maxRot: 45 },
  { id: 'slimak', name: 'Ślimak', fun: 'Tempo opcjonalne.', pts: snail(), closed: false, maxRot: 20 },
];
const FUN_WORDS = ['XD', 'OK', 'LOL', 'HEJ'];

// Czcionka jednokreskowa: x 0..2, y 0..4, start przy linii bazowej
const FONT = {
  A: [[0, 0], [1, 4], [2, 0], [1.5, 2], [0.5, 2], [1.5, 2], [2, 0]],
  B: [[0, 0], [0, 4], [1.5, 4], [2, 3.5], [2, 2.5], [1.5, 2], [0, 2], [1.5, 2], [2, 1.5], [2, 0.5], [1.5, 0], [0, 0], [1.5, 0]],
  C: [[2, 0], [0.5, 0], [0, 0.5], [0, 3.5], [0.5, 4], [2, 4], [0.5, 4], [0, 3.5], [0, 0.5], [0.5, 0], [2, 0]],
  D: [[0, 0], [0, 4], [1.2, 4], [2, 3], [2, 1], [1.2, 0], [0, 0], [1.2, 0]],
  E: [[2, 0], [0, 0], [0, 2], [1.5, 2], [0, 2], [0, 4], [2, 4], [0, 4], [0, 0], [2, 0]],
  F: [[0, 0], [0, 2], [1.5, 2], [0, 2], [0, 4], [2, 4], [0, 4], [0, 0]],
  G: [[2, 0], [2, 2], [1, 2], [2, 2], [2, 0.5], [1.5, 0], [0.5, 0], [0, 0.5], [0, 3.5], [0.5, 4], [2, 4], [0.5, 4], [0, 3.5], [0, 0.5], [0.5, 0], [2, 0]],
  H: [[0, 0], [0, 4], [0, 2], [2, 2], [2, 4], [2, 0]],
  I: [[0, 0], [0, 4], [0, 0]],
  J: [[0, 1], [0, 0.5], [0.5, 0], [1.5, 0], [2, 0.5], [2, 4], [2, 0.5], [1.5, 0], [2, 0]],
  K: [[0, 0], [0, 4], [0, 2], [2, 4], [0, 2], [2, 0]],
  L: [[0, 0], [0, 4], [0, 0], [2, 0]],
  M: [[0, 0], [0, 4], [1, 2], [2, 4], [2, 0]],
  N: [[0, 0], [0, 4], [2, 0], [2, 4], [2, 0]],
  O: [[0.5, 0], [0, 0.5], [0, 3.5], [0.5, 4], [1.5, 4], [2, 3.5], [2, 0.5], [1.5, 0], [0.5, 0], [1.5, 0]],
  P: [[0, 0], [0, 4], [1.5, 4], [2, 3.5], [2, 2.5], [1.5, 2], [0, 2], [0, 0]],
  Q: [[1.5, 0], [0.5, 0], [0, 0.5], [0, 3.5], [0.5, 4], [1.5, 4], [2, 3.5], [2, 0.5], [1.5, 0], [1, 1], [1.5, 0], [2, 0]],
  R: [[0, 0], [0, 4], [1.5, 4], [2, 3.5], [2, 2.5], [1.5, 2], [0, 2], [2, 0]],
  S: [[0, 0], [1.5, 0], [2, 0.5], [2, 1.5], [1.5, 2], [0.5, 2], [0, 2.5], [0, 3.5], [0.5, 4], [2, 4]],
  T: [[1, 0], [1, 4], [0, 4], [2, 4], [1, 4], [1, 0]],
  U: [[0.5, 0], [0, 0.5], [0, 4], [0, 0.5], [0.5, 0], [1.5, 0], [2, 0.5], [2, 4], [2, 0.5], [1.5, 0]],
  V: [[1, 0], [0, 4], [1, 0], [2, 4], [1, 0]],
  W: [[0.5, 0], [0, 4], [0.5, 0], [1, 2], [1.5, 0], [2, 4], [1.5, 0]],
  X: [[0, 0], [2, 4], [1, 2], [0, 4], [2, 0]],
  Y: [[1, 0], [1, 2], [0, 4], [1, 2], [2, 4], [1, 2], [1, 0]],
  Z: [[2, 0], [0, 0], [2, 4], [0, 4], [2, 4], [0, 0], [2, 0]],
  0: [[0.5, 0], [0, 0.5], [0, 3.5], [0.5, 4], [1.5, 4], [2, 3.5], [2, 0.5], [1.5, 0], [0.5, 0], [1.5, 0]],
  1: [[1, 0], [1, 4], [0.3, 3.3], [1, 4], [1, 0]],
  2: [[2, 0], [0, 0], [2, 2.5], [2, 3.5], [1.5, 4], [0.5, 4], [0, 3.5]],
  3: [[0, 0], [1.5, 0], [2, 0.5], [2, 1.5], [1.5, 2], [0.7, 2], [1.5, 2], [2, 2.5], [2, 3.5], [1.5, 4], [0, 4]],
  4: [[1.5, 0], [1.5, 4], [0, 1.3], [2, 1.3], [1.5, 1.3], [1.5, 0]],
  5: [[0, 0], [1.5, 0], [2, 0.5], [2, 2], [1.5, 2.5], [0, 2.5], [0, 4], [2, 4]],
  6: [[1.5, 0], [0.5, 0], [0, 0.5], [0, 3.5], [0.5, 4], [2, 4], [0.5, 4], [0, 3.5], [0, 2.3], [1.5, 2.3], [2, 1.8], [2, 0.5], [1.5, 0]],
  7: [[0.5, 0], [2, 4], [0, 4]],
  8: [[0.5, 0], [1.5, 0], [2, 0.5], [2, 1.5], [1.5, 2], [0.5, 2], [0, 2.5], [0, 3.5], [0.5, 4], [1.5, 4], [2, 3.5], [2, 2.5], [1.5, 2], [0.5, 2], [0, 1.5], [0, 0.5], [0.5, 0]],
  9: [[0.5, 0], [1.5, 0], [2, 0.5], [2, 3.5], [1.5, 4], [0.5, 4], [0, 3.5], [0, 2.2], [0.5, 1.7], [2, 1.7], [2, 0.5], [1.5, 0]],
};
const DIAK = { 'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z' };
function textShape(str) {
  const out = []; let x = 0;
  for (let ch of str.toUpperCase()) {
    ch = DIAK[ch] || ch;
    if (ch === ' ') { x += 1.5; continue; }
    let g = FONT[ch]; if (!g) continue;
    g = g.slice();
    if (g[g.length - 1][1] > 0.3) g = g.concat(g.slice(0, -1).reverse()); // wróć po własnym śladzie do linii bazowej
    const w = Math.max(...g.map(p => p[0]));
    for (const p of g) out.push([x + p[0], p[1]]);
    x += w + 0.9;
  }
  if (out.length < 2) return null;
  return { id: 'napis-' + str, name: '„' + str.toUpperCase() + '”', fun: 'Napis widoczny na mapie aktywności.', pts: out, closed: false, maxRot: 10, isText: true };
}
function prepShape(sh) {
  let p = sh.pts.map(q => q.slice());
  const xs = p.map(q => q[0]), ys = p.map(q => q[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  p = p.map(q => [q[0] - cx, q[1] - cy]);
  const path = sh.closed ? p.concat([p[0]]) : p;
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  return Object.assign({}, sh, { verts: p, path, L: polyLen(path), ext: Math.max(w, h), lenFactor: sh.closed ? 0.82 : 0.8 });
}
function placeFn(pl) { const c = Math.cos(pl.rot), s = Math.sin(pl.rot); return q => [pl.cx + pl.s * (q[0] * c - q[1] * s), pl.cy + pl.s * (q[0] * s + q[1] * c)]; }

// ---------- Siatka i transformata odległości ----------
function makeGrid(x0, y0, x1, y1, cs) {
  const W = Math.ceil((x1 - x0) / cs) + 1, H = Math.ceil((y1 - y0) / cs) + 1;
  return { x0, y0, cs, W, H };
}
function newField(g) { const f = new Float32Array(g.W * g.H); f.fill(1e9); return f; }
function rasterSeg(g, f, ax, ay, bx, by) {
  const d = hyp(bx - ax, by - ay), k = Math.max(1, Math.ceil(d / (g.cs * 0.5)));
  for (let j = 0; j <= k; j++) {
    const X = ax + (bx - ax) * j / k, Y = ay + (by - ay) * j / k;
    const gx = Math.round((X - g.x0) / g.cs), gy = Math.round((Y - g.y0) / g.cs);
    if (gx >= 0 && gy >= 0 && gx < g.W && gy < g.H) f[gy * g.W + gx] = 0;
  }
}
function chamfer(g, f) {
  const W = g.W, H = g.H, a = g.cs, b = g.cs * Math.SQRT2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; let v = f[i];
    if (x > 0 && f[i - 1] + a < v) v = f[i - 1] + a;
    if (y > 0) {
      const u = i - W;
      if (f[u] + a < v) v = f[u] + a;
      if (x > 0 && f[u - 1] + b < v) v = f[u - 1] + b;
      if (x < W - 1 && f[u + 1] + b < v) v = f[u + 1] + b;
    }
    f[i] = v;
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x; let v = f[i];
    if (x < W - 1 && f[i + 1] + a < v) v = f[i + 1] + a;
    if (y < H - 1) {
      const d = i + W;
      if (f[d] + a < v) v = f[d] + a;
      if (x < W - 1 && f[d + 1] + b < v) v = f[d + 1] + b;
      if (x > 0 && f[d - 1] + b < v) v = f[d - 1] + b;
    }
    f[i] = v;
  }
  return f;
}
function fieldAt(g, f, X, Y, cap) {
  const gx = Math.round((X - g.x0) / g.cs), gy = Math.round((Y - g.y0) / g.cs);
  if (gx < 0 || gy < 0 || gx >= g.W || gy >= g.H) return cap;
  const v = f[gy * g.W + gx]; return v < cap ? v : cap;
}
function rasterPolyField(g, pts) { const f = newField(g); for (let i = 1; i < pts.length; i++) rasterSeg(g, f, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); return chamfer(g, f); }

// ---------- Profile aktywności: waga krawędzi (0 = wykluczona) ----------
const UNPAVED = /^(unpaved|gravel|fine_gravel|dirt|earth|ground|grass|sand|mud|compacted|pebblestone|woodchips|grass_paver|rock|stone|soil|clay)$/;
const BAD_SMOOTH = /^(bad|very_bad|horrible|very_horrible|impassable)$/;
const PROFILES = {
  run: { name: 'Bieg', oneway: false, w(t) {
    const h = t.highway;
    return { primary: 2.2, primary_link: 2.2, secondary: 1.6, secondary_link: 1.6, tertiary: 1.2, tertiary_link: 1.2, steps: 3, service: 1.3 }[h] || 1;
  } },
  road: { name: 'Szosa', oneway: true, w(t) {
    const h = t.highway, s = t.surface || '';
    if (UNPAVED.test(s) || t.tracktype || BAD_SMOOTH.test(t.smoothness || '')) return 0;
    let w = { primary: 1.8, primary_link: 1.8, secondary: 1.2, secondary_link: 1.2, tertiary: 1, tertiary_link: 1, unclassified: 1.05, residential: 1.3, living_street: 1.6, service: 2, cycleway: 1 }[h];
    if (!w) return 0;
    if (/^(sett|cobblestone|unhewn_cobblestone)$/.test(s)) w *= 3;
    else if (s === 'paving_stones') w *= 1.3;
    if (!s && /^(unclassified|residential|service|living_street)$/.test(h)) w *= 1.6; // brak informacji o nawierzchni
    return w;
  } },
  touring: { name: 'Turystyczny', oneway: true, w(t) {
    const h = t.highway, s = t.surface || '';
    if (/^(sand|mud|grass|dirt|earth|ground|rock|woodchips|soil|clay)$/.test(s) || /grade[345]/.test(t.tracktype || '') || BAD_SMOOTH.test(t.smoothness || '')) return 0;
    if (h === 'path' && !/^(designated|yes)$/.test(t.bicycle || '')) return 0;
    let w = { primary: 2, primary_link: 2, secondary: 1.4, secondary_link: 1.4, tertiary: 1.1, tertiary_link: 1.1, unclassified: 1, residential: 1.2, living_street: 1.4, service: 1.8, cycleway: 0.9, track: 1.15, path: 1.1 }[h];
    if (!w) return 0;
    if (/^(sett|cobblestone|unhewn_cobblestone)$/.test(s)) w *= 2.5;
    return w;
  } },
  gravel: { name: 'Gravel/MTB', oneway: true, w(t) {
    const h = t.highway, s = t.surface || '';
    if (s === 'mud') return 0;
    let w = { primary: 2.5, primary_link: 2.5, secondary: 1.8, secondary_link: 1.8, tertiary: 1.3, tertiary_link: 1.3, unclassified: 1, residential: 1.2, living_street: 1.4, service: 1.6, cycleway: 1, track: 0.85, path: 0.95, bridleway: 1.2, footway: 1.8 }[h];
    if (!w) return 0;
    if (s === 'sand') w *= 2;
    return w;
  } },
};

// ---------- Graf dróg z odpowiedzi Overpass ----------
function buildGraph(osm, proj, prof) {
  const idx = new Map(), xs = [], ys = [];
  const eA = [], eB = [], eDir = [], eW = []; // eDir: 0 obie strony, 1 tylko A->B
  function nodeId(key, lat, lon) { let i = idx.get(key); if (i === undefined) { i = xs.length; idx.set(key, i); const p = proj.fwd(lat, lon); xs.push(p[0]); ys.push(p[1]); } return i; }
  for (const el of osm.elements || []) {
    if (el.type !== 'way' || !el.geometry) continue;
    const t = el.tags || {};
    const wt = prof.w(t); if (!wt) continue;
    let dir = 0;
    if (prof.oneway) {
      const ow = t.oneway, obn = t['oneway:bicycle'] === 'no' || t['cycleway'] === 'opposite' || t['cycleway'] === 'opposite_lane';
      if (!obn && (ow === 'yes' || ow === '1' || t.junction === 'roundabout')) dir = 1;
      if (!obn && ow === '-1') dir = -1;
    }
    let prev = -1;
    for (let k = 0; k < el.geometry.length; k++) {
      const gpt = el.geometry[k]; if (!gpt) { prev = -1; continue; }
      const key = el.nodes ? el.nodes[k] : (gpt.lat.toFixed(7) + ',' + gpt.lon.toFixed(7));
      const i = nodeId(key, gpt.lat, gpt.lon);
      if (prev >= 0 && prev !== i) {
        if (dir === -1) { eA.push(i); eB.push(prev); eDir.push(1); } else { eA.push(prev); eB.push(i); eDir.push(dir); }
        eW.push(wt);
      }
      prev = i;
    }
  }
  const n = xs.length, deg = new Int32Array(n + 1);
  for (let e = 0; e < eA.length; e++) { deg[eA[e]]++; deg[eB[e]]++; }
  const start = new Int32Array(n + 1); for (let i = 0; i < n; i++) start[i + 1] = start[i] + deg[i];
  const m = start[n], to = new Int32Array(m), len = new Float32Array(m), wrong = new Uint8Array(m), base = new Float32Array(m), fill = start.slice(0, n);
  const X = Float64Array.from(xs), Y = Float64Array.from(ys);
  for (let e = 0; e < eA.length; e++) {
    const a = eA[e], b = eB[e], L = hyp(X[a] - X[b], Y[a] - Y[b]);
    to[fill[a]] = b; len[fill[a]] = L; base[fill[a]++] = L * eW[e];
    if (!eDir[e]) { to[fill[b]] = a; len[fill[b]] = L; base[fill[b]++] = L * eW[e]; }
    else { to[fill[b]] = a; wrong[fill[b]] = 1; len[fill[b]] = L; base[fill[b]++] = L * eW[e] * 15; } // pod prąd: tylko awaryjnie
  }
  // największa składowa spójności (nieskierowana)
  const und = new Map();
  const nb = Array.from({ length: n }, () => []);
  for (let e = 0; e < eA.length; e++) { nb[eA[e]].push(eB[e]); nb[eB[e]].push(eA[e]); }
  const comp = new Int32Array(n).fill(-1); let best = -1, bestSize = 0, cid = 0;
  for (let s = 0; s < n; s++) {
    if (comp[s] >= 0) continue;
    const st = [s]; comp[s] = cid; let size = 0;
    while (st.length) { const u = st.pop(); size++; for (const v of nb[u]) if (comp[v] < 0) { comp[v] = cid; st.push(v); } }
    if (size > bestSize) { bestSize = size; best = cid; }
    cid++;
  }
  const inMain = new Uint8Array(n); for (let i = 0; i < n; i++) inMain[i] = comp[i] === best ? 1 : 0;
  return { n, X, Y, start, to, len, base, wrong, inMain, edges: { eA, eB }, mainSize: bestSize };
}
function buildNodeIndex(G, cell) {
  const map = new Map();
  for (let i = 0; i < G.n; i++) {
    if (!G.inMain[i]) continue;
    const k = Math.floor(G.X[i] / cell) + ',' + Math.floor(G.Y[i] / cell);
    let a = map.get(k); if (!a) map.set(k, a = []); a.push(i);
  }
  return { cell, map };
}
function nearestNode(G, NI, x, y, maxR) {
  const c = NI.cell, cx = Math.floor(x / c), cy = Math.floor(y / c);
  let best = -1, bd = Infinity;
  const maxRing = Math.ceil((maxR || 5000) / c);
  for (let r = 0; r <= maxRing; r++) {
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const a = NI.map.get((cx + dx) + ',' + (cy + dy)); if (!a) continue;
      for (const i of a) { const d = hyp(G.X[i] - x, G.Y[i] - y); if (d < bd) { bd = d; best = i; } }
    }
    if (best >= 0 && bd < r * c) break;
  }
  return { i: best, d: bd };
}

// ---------- Kontekst analizy ----------
function buildContext(osm, proj, profName, bboxM) {
  const prof = PROFILES[profName] || PROFILES.run;
  const G = buildGraph(osm, proj, prof);
  if (!G.mainSize) throw new Error('Brak dróg w tym obszarze.');
  const side = Math.max(bboxM[2] - bboxM[0], bboxM[3] - bboxM[1]);
  const cs = Math.max(12, side / 1100);
  const grid = makeGrid(bboxM[0], bboxM[1], bboxM[2], bboxM[3], cs);
  const road = newField(grid);
  for (let a = 0; a < G.n; a++) {
    if (!G.inMain[a]) continue;
    for (let k = G.start[a]; k < G.start[a + 1]; k++) { const b = G.to[k]; if (b > a || true) rasterSeg(grid, road, G.X[a], G.Y[a], G.X[b], G.Y[b]); }
  }
  chamfer(grid, road);
  const NI = buildNodeIndex(G, 150);
  return { G, grid, road, NI, profName };
}

// ---------- Szukanie położenia kształtu ----------
function tauFor(sp, s) { return Math.max(40, 0.022 * sp.ext * s); }
function evalPlacement(sp, samp, pl, ctx, start, tol) {
  const c = Math.cos(pl.rot), s = Math.sin(pl.rot), tau = tauFor(sp, pl.s), cap = 3 * tau, E = sp.ext * pl.s;
  let sum = 0, dmin = Infinity;
  for (const q of samp) {
    const X = pl.cx + pl.s * (q[0] * c - q[1] * s), Y = pl.cy + pl.s * (q[0] * s + q[1] * c);
    const v = fieldAt(ctx.grid, ctx.road, X, Y, cap);
    sum += v * v;
    const d = (X - start[0]) ** 2 + (Y - start[1]) ** 2; if (d < dmin) dmin = d;
  }
  const dm = Math.sqrt(dmin);
  return Math.sqrt(sum / samp.length) / tau + 1.2 * dm / E + Math.max(0, dm - tol) / tau;
}
function dirOk(dx, dy, dir, E) {
  if (dir == null) return true;
  const r = hyp(dx, dy); if (r < 0.2 * E) return false;
  let a = Math.atan2(dy, dx) - dir; a = Math.atan2(Math.sin(a), Math.cos(a));
  return Math.abs(a) <= 50 * Math.PI / 180;
}
function searchShape(sp, ctx, start, D, tol, dir) {
  const samp = resample(sp.path, 110);
  const s0 = D * sp.lenFactor / sp.L;
  const cands = [];
  const rotStep = sp.isText ? 5 : 10;
  for (const k of [0.88, 1, 1.12]) {
    const s = s0 * k, E = sp.ext * s, rc = E * 0.6 + tol, step = Math.max(E / 14, ctx.grid.cs * 2);
    for (let rd = -sp.maxRot; rd <= sp.maxRot + 1e-9; rd += rotStep) {
      const rot = rd * Math.PI / 180;
      for (let dx = -rc; dx <= rc; dx += step) for (let dy = -rc; dy <= rc; dy += step) {
        if (dx * dx + dy * dy > rc * rc || !dirOk(dx, dy, dir, E)) continue;
        const pl = { s, rot, cx: start[0] + dx, cy: start[1] + dy };
        pl.score = evalPlacement(sp, samp, pl, ctx, start, tol);
        cands.push(pl);
      }
    }
  }
  cands.sort((a, b) => a.score - b.score);
  const top = [];
  for (const c of cands) {
    if (top.every(t => hyp(t.cx - c.cx, t.cy - c.cy) > sp.ext * c.s / 3 || Math.abs(t.rot - c.rot) > 0.25)) top.push(c);
    if (top.length >= 3) break;
  }
  return top.map(pl => refine(sp, samp, pl, ctx, start, tol)).sort((a, b) => a.score - b.score);
}
function refine(sp, samp, pl, ctx, start, tol) {
  let best = pl, E = sp.ext * pl.s, step = Math.max(E / 24, ctx.grid.cs);
  for (let it = 0; it < 3; it++) {
    const base = best;
    for (const ds of [0.96, 1, 1.04]) for (const dr of [-3, 0, 3]) for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const c = { s: base.s * ds, rot: base.rot + dr * Math.PI / 180, cx: base.cx + i * step, cy: base.cy + j * step };
      c.score = evalPlacement(sp, samp, c, ctx, start, tol);
      if (c.score < best.score) best = c;
    }
    step /= 2;
  }
  return best;
}

// ---------- Trasowanie (A*) ----------
function makeRouter(G) {
  const n = G.n, gs = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), closed = new Uint8Array(n);
  let touched = [];
  const heapN = [], heapK = [];
  function push(node, key) { heapN.push(node); heapK.push(key); let i = heapN.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heapK[p] <= key) break; heapN[i] = heapN[p]; heapK[i] = heapK[p]; i = p; } heapN[i] = node; heapK[i] = key; }
  function pop() { const top = heapN[0], ln = heapN.pop(), lk = heapK.pop(); if (heapN.length) { let i = 0; const L = heapN.length; while (true) { let c = 2 * i + 1; if (c >= L) break; if (c + 1 < L && heapK[c + 1] < heapK[c]) c++; if (heapK[c] >= lk) break; heapN[i] = heapN[c]; heapK[i] = heapK[c]; i = c; } heapN[i] = ln; heapK[i] = lk; } return top; }
  // cel: punkt (tx,ty) i promień r — dowolny węzeł w promieniu kończy szukanie; exact>=0 wymusza konkretny węzeł
  return function route(src, tx, ty, r, exact, cost, maxVisit) {
    for (const t of touched) { gs[t] = Infinity; prev[t] = -1; closed[t] = 0; }
    touched = [src]; heapN.length = 0; heapK.length = 0;
    gs[src] = 0; push(src, 0);
    let visits = 0, found = -1;
    while (heapN.length) {
      const u = pop(); if (closed[u]) continue; closed[u] = 1;
      const du = hyp(G.X[u] - tx, G.Y[u] - ty);
      if (exact >= 0 ? u === exact : du <= r) { found = u; break; }
      if (++visits > maxVisit) break;
      for (let k = G.start[u]; k < G.start[u + 1]; k++) {
        const v = G.to[k]; if (!G.inMain[v]) continue;
        const nd = gs[u] + (cost ? cost[k] : G.base[k]);
        if (nd < gs[v]) {
          if (gs[v] === Infinity) touched.push(v);
          gs[v] = nd; prev[v] = u;
          const h = exact >= 0 ? hyp(G.X[v] - G.X[exact], G.Y[v] - G.Y[exact]) : Math.max(0, hyp(G.X[v] - tx, G.Y[v] - ty) - r);
          push(v, nd + h);
        }
      }
    }
    if (found < 0) return null;
    const p = []; for (let u = found; u >= 0; u = prev[u]) p.push(u);
    return p.reverse();
  };
}
function wrongLen(G, p) { let L = 0; for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i]; let ok = false, wr = false; for (let k = G.start[a]; k < G.start[a + 1]; k++) if (G.to[k] === b) { if (G.wrong[k]) wr = true; else ok = true; } if (wr && !ok) L += hyp(G.X[a] - G.X[b], G.Y[a] - G.Y[b]); } return L; }
function pathLen(G, p) { let L = 0; for (let i = 1; i < p.length; i++) L += hyp(G.X[p[i]] - G.X[p[i - 1]], G.Y[p[i]] - G.Y[p[i - 1]]); return L; }

function routePlacement(sp, pl, ctx, start) {
  const G = ctx.G, g = ctx.grid;
  if (!ctx.router) ctx.router = makeRouter(G);
  const route = ctx.router;
  const tf = placeFn(pl);
  const placedPath = sp.path.map(tf);
  const shapeLen = polyLen(placedPath);
  // punkty kontrolne: wierzchołki + zagęszczenie
  const E = sp.ext * pl.s, tau = tauFor(sp, pl.s);
  let wpStep = Math.max(120, E / 9);
  if (sp.isText) wpStep = Math.min(wpStep, Math.max(100, 4 * pl.s / 3));
  let W = densify(placedPath, wpStep);
  if (sp.closed) {
    W = W.slice(0, -1);
    let bi = 0, bd = Infinity; W.forEach((q, i) => { const d = hyp(q[0] - start[0], q[1] - start[1]); if (d < bd) { bd = d; bi = i; } });
    W = W.slice(bi).concat(W.slice(0, bi)); W.push(W[0]);
  } else {
    const d0 = hyp(W[0][0] - start[0], W[0][1] - start[1]), d1 = hyp(W[W.length - 1][0] - start[0], W[W.length - 1][1] - start[1]);
    if (d1 < d0) W.reverse();
  }
  // pole odległości od kształtu -> koszt krawędzi
  const sf = rasterPolyField(g, placedPath);
  const m = G.to.length, cost = new Float32Array(m), fcap = 4 * tau;
  for (let a = 0; a < G.n; a++) {
    if (!G.inMain[a]) continue;
    const fa = fieldAt(g, sf, G.X[a], G.Y[a], fcap);
    for (let k = G.start[a]; k < G.start[a + 1]; k++) {
      const b = G.to[k];
      const fb = fieldAt(g, sf, G.X[b], G.Y[b], fcap), fm = fieldAt(g, sf, (G.X[a] + G.X[b]) / 2, (G.Y[a] + G.Y[b]) / 2, fcap);
      const d = (fa + fb + 2 * fm) / 4;
      cost[k] = G.base[k] * (1 + Math.min(8, (d / tau) ** 2));
    }
  }
  const first = nearestNode(G, ctx.NI, W[0][0], W[0][1]).i;
  let path = [first], cur = first, failed = 0;
  const maxVisit = 1500000;
  for (let i = 1; i < W.length; i++) {
    const isLast = i === W.length - 1;
    const nn = nearestNode(G, ctx.NI, W[i][0], W[i][1]);
    const r = Math.max(70, nn.d + 60, wpStep * 0.35);
    const exact = (isLast && sp.closed) ? first : -1;
    if (exact < 0 && hyp(G.X[cur] - W[i][0], G.Y[cur] - W[i][1]) <= r) continue;
    let seg = route(cur, W[i][0], W[i][1], r, exact, cost, maxVisit);
    if (!seg) seg = route(cur, W[i][0], W[i][1], r + 300, exact, null, 3000000);
    if (!seg) { failed++; continue; }
    for (let j = 1; j < seg.length; j++) path.push(seg[j]);
    cur = seg[seg.length - 1];
  }
  path = removeTinySpurs(G, path, Math.max(40, Math.min(1500, wpStep * 0.7)));
  const drawLen = pathLen(G, path);
  // dojazd z miejsca startu
  const sNode = nearestNode(G, ctx.NI, start[0], start[1]).i;
  let toPath = route(sNode, 0, 0, 0, path[0], null, maxVisit) || [sNode];
  let backPath = sp.closed ? toPath.slice().reverse() : (route(path[path.length - 1], 0, 0, 0, sNode, null, maxVisit) || [path[path.length - 1]]);
  const apprLen = pathLen(G, toPath) + pathLen(G, backPath);
  // dopasowanie
  const rc = path.map(i => [G.X[i], G.Y[i]]);
  const rDense = densify(rc, Math.max(g.cs * 2, tau / 4));
  let a = 0; for (const q of rDense) a += fieldAt(g, sf, q[0], q[1], 6 * tau); a /= rDense.length;
  const rf = rasterPolyField(g, rc);
  const sDense = densify(placedPath, Math.max(g.cs * 2, tau / 4));
  let b = 0; for (const q of sDense) b += fieldAt(g, rf, q[0], q[1], 6 * tau); b /= sDense.length;
  const sym = (a + b) / 2;
  const ref = Math.max(40, 0.015 * E);
  const fit = Math.round(100 * Math.exp(-sym / (2.5 * ref)) * (failed ? 0.5 : 1));
  return { sp, pl, path, coords: rc, toCoords: toPath.map(i => [G.X[i], G.Y[i]]), backCoords: backPath.map(i => [G.X[i], G.Y[i]]), placedPath, drawLen, apprLen, total: drawLen + apprLen, fit, failed, wrongM: wrongLen(G, toPath) + wrongLen(G, path) + wrongLen(G, backPath), devRoute: a, devShape: b };
}
// usuwa krótkie "wypady i powroty" powstałe przy przyciąganiu punktów do węzłów
function removeTinySpurs(G, p, maxLen) {
  const st = [], acc = [];
  for (const v of p) {
    if (st.length >= 2 && st[st.length - 2] === v) {
      const l = hyp(G.X[v] - G.X[st[st.length - 1]], G.Y[v] - G.Y[st[st.length - 1]]);
      const spur = acc[acc.length - 1] + l;
      if (spur <= maxLen) { st.pop(); acc.pop(); acc[acc.length - 1] = Math.max(acc[acc.length - 1], spur); continue; }
    }
    if (st.length && st[st.length - 1] === v) continue;
    st.push(v); acc.push(0);
  }
  return st;
}
function planRoute(sp, ctx, start, D, tol, dir) {
  const tops = searchShape(sp, ctx, start, D, tol, dir);
  let best = null;
  for (const pl of tops.slice(0, 2)) {
    let r = routePlacement(sp, pl, ctx, start), curPl = pl;
    const samp = resample(sp.path, 110);
    for (let it = 0; it < 4 && Math.abs(r.total - D) / D > 0.07 && r.drawLen > 0; it++) {
      const k = Math.min(1.6, Math.max(0.45, (D - r.apprLen) / r.drawLen));
      const pl2 = refine(sp, samp, Object.assign({}, curPl, { s: curPl.s * k, score: Infinity }), ctx, start, tol);
      pl2.s = curPl.s * k; // skala ma trzymać dystans; refine poprawia tylko położenie i obrót
      const r2 = routePlacement(sp, pl2, ctx, start);
      if (typeof DEBUG !== 'undefined') console.log('  it', it, 'k', k.toFixed(2), 'tot', (r.total/1000).toFixed(1), '->', (r2.total/1000).toFixed(1), 'fit', r.fit, '->', r2.fit, 'failed', r2.failed);
      if (Math.abs(r2.total - D) < Math.abs(r.total - D) && !r2.failed) { r = r2; curPl = pl2; } else break;
    }
    r.rank = r.fit - 80 * Math.abs(r.total - D) / D - 30 * r.apprLen / Math.max(1, r.total) - (r.failed ? 30 : 0);
    if (!best || r.rank > best.rank) best = r;
  }
  return best;
}
if (typeof module !== 'undefined') module.exports = { PROFILES, makeProj, SHAPES, FUN_WORDS, textShape, prepShape, buildContext, searchShape, routePlacement, planRoute, resample, polyLen };
