// ===== Biblioteka kształtów =====
// Każdy kształt to JEDNA ciągła linia (oś Y w górę = północ). Detale wewnątrz są rysowane
// jako odnogi "tam i z powrotem", bo tak da się je przejechać bez pauzowania zapisu.
// detail: 1 = prosta sylwetka (dobra na długie dystanse), 2 = kilka detali, 3 = dużo detali.

function pen(x, y) {
  const p = [[x, y]];
  const api = {
    to(...a) { for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]); return api; },
    // łuk elipsy od kąta a0 do a1 (stopnie); bieżący punkt powinien leżeć na kącie a0
    arc(cx, cy, rx, ry, a0, a1, n) {
      n = n || Math.max(4, Math.ceil(Math.abs(a1 - a0) / 12));
      for (let i = 1; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
      return api;
    },
    // odnoga: rysuje fn, potem wraca po własnym śladzie do punktu wyjścia
    spur(fn) { const i = p.length - 1; fn(api); const back = p.slice(i, p.length - 1).reverse(); p.push(...back); return api; },
    pts: p,
  };
  return api;
}
// obrys sumy okręgów, widziany promieniście ze środka (0,0); start pod kątem a0 stopni
function radialUnion(circles, a0, n) {
  n = n || 120; const out = [];
  for (let i = 0; i < n; i++) {
    const a = (a0 + 360 * i / n) * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
    let best = 0;
    for (const [cx, cy, r] of circles) {
      const b = dx * cx + dy * cy, disc = b * b - (cx * cx + cy * cy) + r * r;
      if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
    }
    out.push([best * dx, best * dy]);
  }
  return out;
}
function circlePts(cx, cy, r, a0, n) { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + 360 * i / n) * Math.PI / 180; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }

function buildShapes() {
  const S = [];
  const add = (id, name, fun, pts, opt) => S.push(Object.assign({ id, name, fun, pts, closed: true, maxRot: 15, detail: 1, cat: 'inne' }, opt || {}));

  // --- proste sylwetki
  { const o = []; for (let i = 0; i < 48; i++) { const t = Math.PI + 2 * Math.PI * i / 48; o.push([Math.sin(t) ** 3, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]); }
    add('serce', 'Serce', 'Klasyk. Działa zawsze.', o, { maxRot: 20, cat: 'proste' }); }
  { const o = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 1; o.push([r * Math.cos(a), r * Math.sin(a)]); }
    add('gwiazda', 'Gwiazda', 'Pięć ramion, dużo zakrętów.', o, { maxRot: 36, cat: 'proste' }); }
  add('polska', 'Polska', 'Patriotyczny trening, Hel w cenie.', [[3.05,-0.07],[3.35,-0.72],[3.28,-0.81],[3.35,-1.06],[2.5,-1.99],[2.56,-2.57],[1.84,-2.18],[1.5,-2.17],[1.37,-2.28],[1.06,-2.21],[0.87,-2.41],[0.68,-2.39],[0.69,-2.22],[0.49,-1.99],[0.2,-2.2],[-0.05,-1.71],[-0.38,-1.56],[-0.5,-1.61],[-0.63,-1.48],[-0.58,-1.28],[-0.76,-1.34],[-1.09,-1.16],[-1.02,-1.35],[-1.24,-1.49],[-1.5,-1.17],[-1.37,-1.02],[-1.46,-0.94],[-1.63,-0.98],[-2.25,-0.58],[-2.36,-0.73],[-2.24,-0.34],[-2.49,0.24],[-2.4,0.49],[-2.48,0.94],[-2.78,1.29],[-2.61,1.61],[-2.7,2.14],[-2.5,2.05],[-2.52,2.23],[-2.73,2.36],[-1.52,2.7],[-1.29,2.96],[-0.35,3.24],[0.07,3.09],[-0.13,3.15],[0.01,2.84],[0.2,2.76],[0.59,2.87],[2.61,2.8],[2.96,2.55],[3.23,1.44],[3.23,1.11],[2.79,0.69],[3.08,0.45]], { maxRot: 8, cat: 'proste' });
  add('blyskawica', 'Błyskawica', 'Dla tych, co jadą szybko.', [[0.25, 1.5], [-0.6, -0.1], [0, -0.1], [-0.35, -1.5], [0.7, 0.3], [0.1, 0.3], [0.6, 1.5]], { maxRot: 20, cat: 'proste' });
  add('strzalka', 'Strzałka', 'Wskazuje drogę. Dosłownie.', [[-0.25, -1], [0.25, -1], [0.25, 0.3], [0.6, 0.3], [0, 1], [-0.6, 0.3], [-0.25, 0.3]], { maxRot: 45, cat: 'proste' });
  { const o = []; for (let i = 0; i < 64; i++) { const t = 2 * Math.PI * i / 64, d = 1 + Math.sin(t) ** 2; o.push([1.4 * Math.cos(t) / d, 1.4 * Math.sin(t) * Math.cos(t) / d]); }
    add('nieskonczonosc', 'Nieskończoność', 'Trening bez końca. Prawie.', o, { maxRot: 30, cat: 'proste' }); }
  add('ksiezyc', 'Księżyc', 'Na nocną jazdę z lampką.', pen(0.5, 0.866).arc(0, 0, 1, 1, 60, 300).arc(0.5, 0, 0.866, 0.866, 270, 90).pts, { maxRot: 30, cat: 'proste' });
  add('choinka', 'Choinka', 'Świąteczny trening w trzech piętrach.', [[0, 1.5], [0.6, 0.6], [0.3, 0.6], [0.8, -0.2], [0.4, -0.2], [1, -1], [0.15, -1], [0.15, -1.4], [-0.15, -1.4], [-0.15, -1], [-1, -1], [-0.4, -0.2], [-0.8, -0.2], [-0.3, 0.6], [-0.6, 0.6]], { maxRot: 10, cat: 'proste' });
  add('diament', 'Diament', 'Twardy jak Twoje łydki.',
    pen(-1, 0.4).to(-0.6, 0.85).spur(p => p.to(-0.35, 0.4)).to(0, 0.85).spur(p => p.to(-0.35, 0.4).to(0, -1)).spur(p => p.to(0.35, 0.4).to(0, -1)).to(0.6, 0.85).spur(p => p.to(0.35, 0.4)).to(1, 0.4).to(0, -1).to(-1, 0.4).to(1, 0.4).to(0, -1).to(-1, 0.4).pts,
    { maxRot: 15, cat: 'proste', detail: 2 });
  { const o = []; const n = 120, bumps = 9; for (let i = 0; i <= n; i++) { const a = Math.PI * (1 - i / n), r = 1 + 0.07 * Math.abs(Math.sin(bumps * Math.PI * i / n)); o.push([r * Math.cos(a), r * Math.sin(a) * 0.8]); }
    add('pierog', 'Pieróg', 'Kulinarnie i patriotycznie. Z karbowanym brzegiem.', o, { maxRot: 20, cat: 'jedzenie', detail: 2 }); }

  // --- zwierzęta
  add('duszek', 'Duszek', 'Buu! Z oczami, żeby nikt nie wziął go za worek.',
    pen(-1, -1).to(-1, 0.2).arc(0, 0.2, 1, 1, 180, 90)
      .to(0, 0.5, -0.18, 0.5).arc(-0.38, 0.5, 0.2, 0.28, 0, 360).to(0, 0.5, 0.18, 0.5).arc(0.38, 0.5, 0.2, 0.28, 180, -180).to(0, 0.5, 0, 1.2)
      .arc(0, 0.2, 1, 1, 90, 0).to(1, -1, 0.66, -0.7, 0.33, -1, 0, -0.7, -0.33, -1, -0.66, -0.7).pts,
    { cat: 'zwierzęta i postacie', detail: 3 });
  add('kot', 'Kot', 'Uszy, oczy, wąsy. Miau.',
    pen(-1, 0.2).to(-0.95, 1.35, -0.45, 0.8, 0, 0.8)
      .to(0, 0.42, -0.15, 0.42).arc(-0.38, 0.42, 0.23, 0.2, 0, 360).to(0, 0.42, 0.15, 0.42).arc(0.38, 0.42, 0.23, 0.2, 180, -180).to(0, 0.42)
      .to(0, 0.16, -0.14, 0.16, 0, -0.02, 0.14, 0.16, 0, 0.16, 0, 0.8)
      .to(0.45, 0.8, 0.95, 1.35, 1, 0.2).spur(p => p.to(1.6, 0.35)).spur(p => p.to(1.6, 0.0))
      .arc(0, 0.2, 1, 0.95, 0, -180).spur(p => p.to(-1.6, 0.35)).spur(p => p.to(-1.6, 0.0)).pts,
    { cat: 'zwierzęta i postacie', detail: 3 });
  add('ryba', 'Ryba', 'Z okiem i skrzelami. Bo czemu nie.',
    pen(1, 0).spur(p => p.to(0.72, 0.12).arc(0.6, 0.12, 0.12, 0.12, 0, 360))
      .arc(0.15, 0, 0.85, 0.5, 0, 60).spur(p => p.to(0.47, 0.2, 0.44, 0, 0.47, -0.25))
      .arc(0.15, 0, 0.85, 0.5, 60, 160).to(-1.25, 0.5, -1.05, 0, -1.25, -0.5).to(...[0.15 + 0.85 * Math.cos(200 * Math.PI / 180), 0.5 * Math.sin(200 * Math.PI / 180)])
      .arc(0.15, 0, 0.85, 0.5, 200, 360).pts,
    { maxRot: 30, cat: 'zwierzęta i postacie', detail: 2 });
  add('mis', 'Miś', 'Okrągła głowa, uszy, oczy i nos.',
    (() => { const o = radialUnion([[0, 0, 1], [-0.78, 0.8, 0.38], [0.78, 0.8, 0.38]], 90, 96);
      const p = pen(...o[0]).spur(q => q.to(0, 0.3, -0.25, 0.3).arc(-0.35, 0.3, 0.1, 0.1, 0, 360).to(0, 0.3, 0.25, 0.3).arc(0.35, 0.3, 0.1, 0.1, 180, -180).to(0, 0.3, 0, -0.11).arc(0, -0.25, 0.22, 0.14, 90, 450).to(0, -0.39, -0.2, -0.55).to(0, -0.39, 0.2, -0.55));
      for (const q of o.slice(1)) p.to(...q); return p.pts; })(),
    { maxRot: 10, cat: 'zwierzęta i postacie', detail: 3 });
  add('krolik', 'Królik', 'Długie uszy załatwiają sprawę.',
    pen(-0.25, 0.655).to(-0.45, 1.8, -0.28, 2.05, -0.08, 1.85, -0.08, 0.695).to(0.08, 0.695, 0.08, 1.85, 0.28, 2.05, 0.45, 1.8, 0.25, 0.655)
      .arc(0, 0, 0.7, 0.7, 69, -90).spur(p => p.to(0, -0.35, -0.12, -0.25, 0.12, -0.25, 0, -0.35)).arc(0, 0, 0.7, 0.7, -90, -249).pts,
    { maxRot: 10, cat: 'zwierzęta i postacie', detail: 2 });
  add('kaczka', 'Kaczka', 'Kwa. Ze skrzydłem i dziobem.',
    pen(-1.2, 0.4).to(-0.9, 0.05, -0.2, 0.1).spur(p => p.to(-0.45, -0.2, -0.95, -0.15)).to(0.4, 0.27).arc(0.65, 0.62, 0.36, 0.36, 234, -10).to(1.38, 0.52, 1.0, 0.42).to(0.85, 0.28, 1.0, -0.15, 0.75, -0.6, 0.2, -0.8, -0.5, -0.75, -1.0, -0.35).pts,
    { maxRot: 15, cat: 'zwierzęta i postacie', detail: 2 });
  add('dinozaur', 'Dinozaur', 'Długa szyja, długi ogon, długi trening.',
    [[-2.2, -0.6], [-1.2, 0.0], [-0.4, 0.55], [0.4, 0.5], [0.9, 0.7], [1.3, 1.3], [1.45, 1.5], [1.8, 1.5], [1.85, 1.35], [1.5, 1.28], [1.05, 0.4], [0.9, 0], [0.85, -1], [0.55, -1], [0.55, -0.4], [-0.4, -0.4], [-0.4, -1], [-0.75, -1], [-0.8, -0.35], [-1.3, -0.4]],
    { maxRot: 10, cat: 'zwierzęta i postacie', detail: 2 });
  add('slon', 'Słoń', 'Z trąbą, uchem i ciosem.',
    pen(-1.2, 0.6).to(-0.4, 0.85, 0.4, 0.8, 0.9, 0.75).spur(p => p.to(0.55, 0.6, 0.5, 0.0, 0.85, -0.05, 0.95, 0.4, 0.9, 0.75)).to(1.25, 0.6, 1.4, 0.1, 1.45, -0.6, 1.62, -0.78, 1.52, -0.88, 1.3, -0.65, 1.2, -0.1).spur(p => p.to(1.5, -0.3)).to(0.95, -0.1, 0.9, -1, 0.55, -1, 0.55, -0.45, -0.45, -0.45, -0.5, -1, -0.9, -1, -1.0, -0.2).spur(p => p.to(-1.35, -0.35)).pts,
    { maxRot: 10, cat: 'zwierzęta i postacie', detail: 3 });
  add('zolw', 'Żółw', 'Wolno, ale do celu.',
    pen(-1.1, -0.2).arc(0, -0.2, 1.1, 0.9, 180, 90).spur(p => p.to(0, 0.3).spur(q => q.to(-0.5, 0.05)).spur(q => q.to(0.5, 0.05))).arc(0, -0.2, 1.1, 0.9, 90, 0).to(1.2, 0.05, 1.6, 0.1, 1.75, -0.15, 1.55, -0.35, 1.1, -0.3, 0.75, -0.3, 0.8, -0.75, 0.45, -0.75, 0.45, -0.3, -0.4, -0.3, -0.45, -0.75, -0.8, -0.75, -0.75, -0.3, -1.1, -0.3, -1.4, -0.45).pts,
    { maxRot: 15, cat: 'zwierzęta i postacie', detail: 2 });
  add('wieloryb', 'Wieloryb', 'Z fontanną nad głową.',
    pen(1.25, -0.1).to(1.05, 0.4, 0.6, 0.57).spur(p => p.to(0.6, 0.95).spur(q => q.to(0.4, 1.2)).spur(q => q.to(0.8, 1.2))).to(0.0, 0.5, -0.6, 0.25, -1.1, 0.05, -1.45, 0.55, -1.25, 0.42, -1.05, 0.7, -0.95, 0.0, -0.5, -0.45, 0.5, -0.55, 1.1, -0.35).pts,
    { maxRot: 15, cat: 'zwierzęta i postacie', detail: 2 });
  add('osmiornica', 'Ośmiornica', 'Osiem nóg to za dużo, cztery wystarczą.',
    pen(-0.75, 0.23).arc(0, 0.5, 0.8, 0.8, 200, 90).spur(p => p.to(0, 0.45, -0.18, 0.45).arc(-0.3, 0.45, 0.12, 0.12, 0, 360).to(0, 0.45, 0.18, 0.45).arc(0.3, 0.45, 0.12, 0.12, 180, -180)).arc(0, 0.5, 0.8, 0.8, 90, -20)
      .to(0.9, -0.35, 1.1, -0.95, 0.85, -1.2, 0.72, -0.6, 0.48, -0.15, 0.35, -0.8, 0.45, -1.25, 0.15, -1.05, 0.1, -0.2, -0.1, -0.2, -0.15, -1.05, -0.45, -1.25, -0.35, -0.8, -0.48, -0.15, -0.72, -0.6, -0.85, -1.2, -1.1, -0.95, -0.9, -0.35).pts,
    { maxRot: 10, cat: 'zwierzęta i postacie', detail: 3 });
  add('slimak', 'Ślimak', 'Tempo opcjonalne.',
    (() => { const o = []; const T = 5 * Math.PI; for (let i = 0; i <= 60; i++) { const t = T * i / 60, r = 0.08 + 0.92 * t / T; o.push([r * Math.cos(t), r * Math.sin(t)]); } return o.concat([[-1.2, -1.0], [1.4, -1.0], [1.8, -0.6], [1.75, 0.3], [1.5, 0.9], [1.75, 0.3], [2.0, 0.85]]); })(),
    { closed: false, maxRot: 20, cat: 'zwierzęta i postacie', detail: 2 });
  add('motyl', 'Motyl', 'Cztery skrzydła i czułki.',
    (() => { const o = radialUnion([[0, 0, 0.22], [0, 0.42, 0.14], [-0.62, 0.42, 0.55], [0.62, 0.42, 0.55], [-0.48, -0.45, 0.4], [0.48, -0.45, 0.4]], 90, 120);
      const p = pen(...o[0]).spur(q => q.to(-0.25, 0.95)).spur(q => q.to(0.25, 0.95)); for (const q of o.slice(1)) p.to(...q); return p.pts; })(),
    { maxRot: 15, cat: 'zwierzęta i postacie', detail: 2 });
  add('mewa', 'Mewa', 'Dwa łuki i lecimy.', pen(-1.2, 0).arc(-0.6, -0.1, 0.6, 0.5, 170, 10).arc(0.6, -0.1, 0.6, 0.5, 170, 10).pts,
    { closed: false, maxRot: 20, cat: 'proste' });
  add('ludzik', 'Ludzik', 'Biegnący ludzik z głową, rękami i nogami.',
    pen(0, 1.2).arc(0, 1.5, 0.3, 0.3, 270, 630).to(0, 0.9).spur(p => p.to(-0.45, 0.55, -0.75, 0.75)).spur(p => p.to(0.45, 0.7, 0.6, 1.05)).to(0, 0.1).spur(p => p.to(-0.4, -0.4, -0.3, -0.95)).spur(p => p.to(0.45, -0.3, 0.75, -0.8)).to(0, 0.9).pts,
    { maxRot: 10, cat: 'zwierzęta i postacie', detail: 2 });
  add('balwan', 'Bałwan', 'Trzy kule, ręce z patyków.',
    (() => { const o = radialUnion([[0, 0, 0.55], [0, -0.95, 0.75], [0, 0.85, 0.38]], 0, 120);
      const p = pen(...o[0]).spur(q => q.to(1.1, 0.35).spur(r => r.to(1.25, 0.6)));
      for (let i = 1; i < o.length; i++) { p.to(...o[i]); if (i === 60) p.spur(q => q.to(-1.1, 0.35).spur(r => r.to(-1.25, 0.6))); }
      return p.pts; })(),
    { maxRot: 5, cat: 'zwierzęta i postacie', detail: 2 });

  // --- przedmioty i jedzenie
  add('domek', 'Domek', 'Z drzwiami, oknem i kominem.',
    [[-1, -1], [-0.25, -1], [-0.25, -0.3], [0.25, -0.3], [0.25, -1], [1, -1], [1, 0.4], [0.6, 0.76], [0.6, 1.1], [0.35, 1.1], [0.35, 0.985], [0, 1.3], [-1, 0.4], [-1, 0.05], [-0.7, 0.05], [-0.7, 0.25], [-0.35, 0.25], [-0.35, -0.15], [-0.7, -0.15], [-0.7, 0.05], [-1, 0.05]],
    { maxRot: 10, cat: 'przedmioty', detail: 2 });
  add('rower', 'Rower', 'Rysujesz rower, jadąc rowerem.',
    pen(-0.4, 0).arc(-1, 0, 0.6, 0.6, 0, 360).to(0, 0, -0.35, 0.85).spur(p => p.to(-0.42, 1.0, -0.62, 1.0)).to(0.65, 0.85).spur(p => p.to(0.62, 1.1, 0.85, 1.15)).to(0.718, 0.53).arc(1, 0, 0.6, 0.6, 118, 478).to(0.65, 0.85, 0, 0).pts,
    { maxRot: 10, cat: 'przedmioty', detail: 2 });
  add('rakieta', 'Rakieta', 'Z okienkiem i płomieniem.',
    pen(0, 1.6).spur(p => p.to(0, 0.75).arc(0, 0.55, 0.2, 0.2, 90, 450)).to(0.35, 1.0, 0.38, -0.5, 0.8, -1.1, 0.38, -0.9, 0, -0.9).spur(p => p.to(-0.15, -1.25, 0, -1.12, 0.15, -1.45)).to(-0.38, -0.9, -0.8, -1.1, -0.38, -0.5, -0.35, 1.0).pts,
    { maxRot: 20, cat: 'przedmioty', detail: 2 });
  add('kubek', 'Kubek kawy', 'Z parującą kawą. Przerwa w połowie dozwolona.',
    [[-0.7, 0.6], [-0.7, -1], [0.5, -1], [0.5, -0.6], [0.85, -0.6], [0.98, -0.3], [0.85, 0.2], [0.5, 0.2], [0.5, 0.6], [0.1, 0.6], [0.0, 0.85], [0.15, 1.05], [0.05, 1.3], [0.15, 1.05], [0.0, 0.85], [0.1, 0.6], [-0.3, 0.6], [-0.4, 0.85], [-0.25, 1.05], [-0.35, 1.3], [-0.25, 1.05], [-0.4, 0.85], [-0.3, 0.6]],
    { maxRot: 10, cat: 'przedmioty', detail: 2 });
  add('kotwica', 'Kotwica', 'Dla wodniaków na lądzie.',
    pen(0, 1.0).arc(0, 1.2, 0.2, 0.2, 270, 630).to(0, 0.7).spur(p => p.to(-0.45, 0.7)).spur(p => p.to(0.45, 0.7)).to(0, -1).arc(0, -0.4, 0.6, 0.6, 270, 180).spur(p => p.to(-0.4, -0.55)).arc(0, -0.4, 0.6, 0.6, 180, 270).arc(0, -0.4, 0.6, 0.6, 270, 360).spur(p => p.to(0.4, -0.55)).arc(0, -0.4, 0.6, 0.6, 360, 270).to(0, 0.7, 0, 1.0).pts,
    { maxRot: 10, cat: 'przedmioty', detail: 2 });
  add('nuta', 'Nuta', 'Rytm pedałowania.',
    pen(0.05, -0.85).arc(-0.3, -0.95, 0.35, 0.25, 15, 375).to(0.05, 1.2, 0.5, 0.75, 0.6, 0.25, 0.45, -0.05).pts,
    { maxRot: 10, cat: 'przedmioty', detail: 2 });
  add('parasol', 'Parasol', 'Na jesienne treningi.',
    (() => { const p = pen(-1.2, 0).arc(0, 0, 1.2, 1.0, 180, 0); const xs = [1.2, 0.6, 0, -0.6, -1.2]; for (let i = 1; i < xs.length; i++) { const cx = (xs[i - 1] + xs[i]) / 2; p.arc(cx, 0, 0.3, 0.18, 0, 180, 5); if (i === 3) p.spur(q => q.to(0, -1.1).arc(0.2, -1.1, 0.2, 0.2, 180, 360)); } return p.pts; })(),
    { maxRot: 10, cat: 'przedmioty', detail: 2 });
  add('lody', 'Lody', 'Nagroda po treningu.',
    pen(0, -1.5).to(-0.55, 0.1, 0.55, 0.1).arc(0, 0.4, 0.62, 0.62, -29, 209).to(0.55, 0.1, 0, -1.5).pts,
    { maxRot: 10, cat: 'jedzenie', detail: 1 });
  add('jablko', 'Jabłko', 'Z ogonkiem i listkiem.',
    pen(0, 0.7).spur(p => p.to(0.05, 1.0).spur(q => q.to(0.4, 1.2, 0.65, 1.15, 0.4, 1.0, 0.05, 1.0)).to(0.1, 1.25)).to(0.35, 0.9, 0.8, 0.75, 1.0, 0.3, 0.95, -0.3, 0.7, -0.8, 0.35, -0.95, 0, -0.85, -0.35, -0.95, -0.7, -0.8, -0.95, -0.3, -1, 0.3, -0.8, 0.75, -0.35, 0.9).pts,
    { maxRot: 10, cat: 'jedzenie', detail: 2 });
  add('grzyb', 'Grzyb', 'Kapelusz w kropki i nóżka.',
    pen(-1.1, 0.2).arc(0, 0.2, 1.1, 0.9, 180, 125).spur(p => p.to(-0.45, 0.78).arc(-0.45, 0.63, 0.15, 0.15, 90, 450)).arc(0, 0.2, 1.1, 0.9, 125, 60).spur(p => p.to(0.45, 0.88).arc(0.45, 0.73, 0.15, 0.15, 90, 450)).arc(0, 0.2, 1.1, 0.9, 60, 0).to(0.35, 0.2, 0.42, -1, -0.42, -1, -0.35, 0.2).pts,
    { maxRot: 15, cat: 'jedzenie', detail: 3 });
  add('kielbasa', 'Kiełbaska', 'Na ognisko po treningu.',
    pen(-1.414, -0.086).arc(0, -1.5, 2.0, 2.0, 135, 45).arc(1.237, -0.263, 0.25, 0.25, 45, -45).spur(p => p.to(1.6, -0.62)).arc(1.237, -0.263, 0.25, 0.25, -45, -135).arc(0, -1.5, 1.5, 1.5, 45, 135).arc(-1.237, -0.263, 0.25, 0.25, -45, -135).spur(p => p.to(-1.6, -0.62)).arc(-1.237, -0.263, 0.25, 0.25, -135, -225).pts,
    { maxRot: 20, cat: 'jedzenie', detail: 1 });

  // --- natura
  add('slonce', 'Słońce', 'Okrąg z promieniami.',
    (() => { const p = pen(0.7, 0); for (let k = 0; k < 8; k++) { const a = k * 45; p.spur(q => q.to(1.3 * Math.cos(a * Math.PI / 180), 1.3 * Math.sin(a * Math.PI / 180))); p.arc(0, 0, 0.7, 0.7, a, a + 45, 4); } return p.pts; })(),
    { maxRot: 22, cat: 'natura', detail: 2 });
  add('kwiatek', 'Kwiatek', 'Sześć płatków, łodyga i listek.',
    (() => { const c = [[0, 0, 0.35]]; for (let k = 0; k < 6; k++) { const a = (90 + 30 + k * 60) * Math.PI / 180; c.push([0.6 * Math.cos(a), 0.6 * Math.sin(a), 0.36]); }
      const o = radialUnion(c, 270, 120); const p = pen(...o[0]).spur(q => q.to(0, -1.3).spur(r => r.to(0.3, -1.05, 0.65, -0.95, 0.4, -1.3, 0, -1.45)).to(0, -2.0)); for (const q of o.slice(1)) p.to(...q); return p.pts; })(),
    { maxRot: 10, cat: 'natura', detail: 2 });
  add('lisc', 'Liść', 'Z żyłkami i ogonkiem.',
    pen(0, -1.0).spur(p => p.to(0, -1.4)).arc(-0.9, -0.0, 1.35, 1.35, -48, 48).arc(0.9, -0.0, 1.35, 1.35, 132, 228).spur(p => p.to(0, 0.75)).pts.concat([]),
    { maxRot: 30, cat: 'natura', detail: 2 });
  add('kaktus', 'Kaktus', 'Dwa ramiona, zero kolców.',
    [[-0.3, -1.5], [-0.3, -0.1], [-0.8, -0.1], [-0.8, 0.6], [-0.55, 0.6], [-0.55, 0.15], [-0.3, 0.15], [-0.3, 1.2], [0, 1.45], [0.3, 1.2], [0.3, 0.5], [0.75, 0.5], [0.75, 1.0], [1.0, 1.0], [1.0, 0.25], [0.3, 0.25], [0.3, -1.5]],
    { maxRot: 10, cat: 'natura', detail: 2 });
  return S;
}
const SHAPES = buildShapes();
