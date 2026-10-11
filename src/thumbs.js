/* Carnet On Air : miniatures dessinées de chaque exercice (silhouette de profil + machine ou matériel).
   Pose : bassin [x, y], buste t (0 = droit, + = penché en avant), bras a/b et jambes c/d en degrés
   depuis la verticale basse (+ = vers l'avant). a2… = membre du fond. Sol à y = 84. */
const TL = { torso: 24, neck: 10, ua: 13, fa: 12, th: 18, sh: 17 };
const rad = d => d * Math.PI / 180;
const fk = (p, ang, len) => [p[0] + len * Math.sin(rad(ang)), p[1] + len * Math.cos(rad(ang))];
function pose(o) {
  const P = o.p, S = [P[0] + TL.torso * Math.sin(rad(o.t || 0)), P[1] - TL.torso * Math.cos(rad(o.t || 0))];
  const ht = o.ht == null ? (o.t || 0) : o.ht;
  const H = [S[0] + TL.neck * Math.sin(rad(ht)), S[1] - TL.neck * Math.cos(rad(ht))];
  const arm = (a, b) => { const E = fk(S, a, TL.ua); return [E, fk(E, b, TL.fa)]; };
  const leg = (c, d) => { const K = fk(P, c, TL.th); return [K, fk(K, d, TL.sh)]; };
  const [E, W] = arm(o.a || 0, o.b == null ? (o.a || 0) : o.b);
  const [K, A] = leg(o.c || 0, o.d == null ? (o.c || 0) : o.d);
  const E2 = o.a2 != null ? arm(o.a2, o.b2 == null ? o.a2 : o.b2) : null;
  const K2 = o.c2 != null ? leg(o.c2, o.d2 == null ? o.c2 : o.d2) : null;
  return { P, S, H, E, W, K, A, E2, K2 };
}
const pt = q => q.map(n => Math.round(n * 10) / 10).join(',');
function figSvg(J, o) {
  const ln = (a, b) => `M${pt(a)}L${pt(b)}`;
  const foot = (A, c, d) => { const dir = o.toes == null ? 1 : o.toes; return `M${pt(A)}l${4.5 * dir},0`; };
  let back = '';
  if (J.K2) back += `<path d="${ln(J.P, J.K2[0])}${ln(J.K2[0], J.K2[1])}${o.nofoot ? '' : foot(J.K2[1])}"/>`;
  if (J.E2) back += `<path d="${ln(J.S, J.E2[0])}${ln(J.E2[0], J.E2[1])}"/>`;
  const front = `<path d="${ln(J.P, J.K)}${ln(J.K, J.A)}${o.nofoot ? '' : foot(J.A)}${ln(J.P, J.S)}${ln(J.S, J.E)}${ln(J.E, J.W)}"/>`;
  return `<g class="tb-back">${back}</g><g class="tb-fig">${front}<circle cx="${pt([J.H[0]])}" cy="${pt([J.H[1]])}" r="5.6"/></g>`;
}
/* Matériel tenu en main */
function heldSvg(J, h) {
  if (!h) return '';
  const hands = [J.W].concat(J.E2 ? [J.E2[1]] : []);
  const out = [];
  if (h === 'db') hands.forEach(w => out.push(`<rect x="${w[0] - 4.5}" y="${w[1] - 2.2}" width="9" height="4.4" rx="1.5" class="tb-iron"/>`));
  if (h === 'kb') out.push(`<path d="M${J.W[0] - 3},${J.W[1]} a3,3 0 0 1 6,0" class="tb-line"/><circle cx="${J.W[0]}" cy="${J.W[1] + 5}" r="4.6" class="tb-iron"/>`);
  if (h === 'db1') out.push(`<rect x="${J.W[0] - 4.5}" y="${J.W[1] - 2.2}" width="9" height="4.4" rx="1.5" class="tb-iron"/>`);
  if (h === 'kb1') hands.slice(0, 1).forEach(w => out.push(`<circle cx="${w[0]}" cy="${w[1] + 3}" r="4" class="tb-iron"/>`));
  if (h === 'bb') out.push(`<circle cx="${J.W[0]}" cy="${J.W[1]}" r="8.5" class="tb-plate"/><circle cx="${J.W[0]}" cy="${J.W[1]}" r="1.6" class="tb-iron"/>`);
  if (h === 'bbS') out.push(`<circle cx="${J.S[0] - 2}" cy="${J.S[1] - 1}" r="8.5" class="tb-plate"/><circle cx="${J.S[0] - 2}" cy="${J.S[1] - 1}" r="1.6" class="tb-iron"/>`);
  if (h === 'bbF') out.push(`<circle cx="${J.S[0] + 4}" cy="${J.S[1]}" r="8.5" class="tb-plate"/><circle cx="${J.S[0] + 4}" cy="${J.S[1]}" r="1.6" class="tb-iron"/>`);
  if (h === 'plate') out.push(`<circle cx="${J.W[0]}" cy="${J.W[1]}" r="6" class="tb-plate"/>`);
  if (h === 'ball') out.push(`<circle cx="${J.W[0]}" cy="${J.W[1] - 4}" r="6.5" class="tb-ball"/>`);
  if (h === 'bar') out.push(`<path d="M${J.W[0] - 8},${J.W[1]}h16" class="tb-line"/>`);
  return out.join('');
}
/* Éléments de décor : l = ligne, r = rectangle, c = disque, s = pile de poids, p = disques Hammer */
function eqSvg(eq) {
  return (eq || []).map(e => {
    const [k, ...v] = e;
    if (k === 'l') return `<path d="M${v[0]},${v[1]}L${v[2]},${v[3]}" class="tb-eq" style="stroke-width:${v[4] || 3}"/>`;
    if (k === 'r') return `<rect x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" rx="${v[4] || 1.5}" class="tb-pad"/>`;
    if (k === 'b') return `<rect x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" rx="1" class="tb-box"/>`;
    if (k === 'c') return `<circle cx="${v[0]}" cy="${v[1]}" r="${v[2]}" class="tb-plate"/><circle cx="${v[0]}" cy="${v[1]}" r="1.6" class="tb-iron"/>`;
    if (k === 'o') return `<circle cx="${v[0]}" cy="${v[1]}" r="${v[2]}" class="tb-ring"/>`;
    if (k === 's') { const [x, y, h] = v; let s = `<rect x="${x}" y="${y}" width="12" height="${h}" rx="1" class="tb-stack"/>`; for (let i = 1; i < 6; i++) s += `<path d="M${x},${y + h - i * 4}h12" class="tb-stackl"/>`; return s + `<path d="M${x + 6},${y}V${y - 10}" class="tb-line"/>`; }
    if (k === 'p') { const [x, y] = v; return `<circle cx="${x}" cy="${y}" r="9.5" class="tb-plate"/><circle cx="${x}" cy="${y}" r="6" class="tb-plate2"/><circle cx="${x}" cy="${y}" r="1.6" class="tb-iron"/>`; }
    if (k === 't') return `<text x="${v[0]}" y="${v[1]}" class="tb-txt">${v[2]}</text>`;
    return '';
  }).join('');
}
const G = 84; /* sol */
const BENCH = (x1, x2, y = 64) => [['r', x1, y, x2 - x1, 5], ['l', x1 + 4, y + 5, x1 + 4, G, 2.5], ['l', x2 - 4, y + 5, x2 - 4, G, 2.5]];
const SEAT = (x, y, back) => [['r', x - 9, y, 20, 5], ['l', x, y + 5, x, G, 3]].concat(back ? [['r', x - 13, y - 26, 5, 27]] : []);
/* Familles de poses réutilisées */
const P_SQUAT = { p: [54, 63], t: 32, c: 82, d: -18, toes: 1 };
const P_STAND = { p: [60, 49], t: 0, c: 0, d: 0 };
const P_HINGE = { p: [52, 49], t: 70, ht: 55, c: 8, d: -4 };
const P_PLANK = { p: [58, 60], t: 104, c: -78, d: -78, nofoot: 1 };

const THUMB_DEF = {
  /* Jambes */
  presse: { m: 'leg', f: { p: [44, 68], t: -58, ht: -40, a: 25, b: 40, c: 130, d: 70, nofoot: 1 }, eq: [['l', 40, 76, 16, 62, 6], ['l', 28, 76, 50, 76, 6], ['l', 46, 79, 46, G, 3], ['l', 80, 74, 104, 50, 3], ['l', 70, 56, 80, 67, 5], ['s', 104, 44, 40]] },
  presse_hs: { m: 'leg', f: { p: [44, 68], t: -58, ht: -40, a: 25, b: 40, c: 130, d: 70, nofoot: 1 }, eq: [['l', 40, 76, 16, 62, 6], ['l', 28, 76, 50, 76, 6], ['l', 46, 79, 46, G, 3], ['l', 80, 74, 104, 50, 3], ['l', 70, 56, 80, 67, 5], ['p', 92, 46]] },
  hack: { f: { p: [52, 60], t: -12, a: -10, b: 170, c: 78, d: -18 }, eq: [['l', 30, 84, 46, 22, 3], ['r', 38, 30, 6, 34], ['p', 30, 36]], h: '' },
  goblet: { f: Object.assign({}, P_SQUAT, { a: 40, b: 168 }), h: 'kb' },
  backsquat: { f: Object.assign({}, P_SQUAT, { a: -40, b: 160 }), h: 'bbS' },
  frontsquat: { f: Object.assign({}, P_SQUAT, { t: 18, a: 95, b: 175 }), h: 'bbF' },
  stepup: { f: { p: [55, 46], t: 8, a: 2, c: 72, d: -6, c2: -8, d2: -8 }, eq: [['b', 64, 64, 26, 20]], h: 'db' },
  db_stepover: { f: { p: [55, 46], t: 8, a: 2, c: 72, d: -6, c2: -8, d2: -8 }, eq: [['b', 64, 64, 26, 20]], h: 'db' },
  db_wlunge: { f: { p: [56, 60], t: 2, a: 0, c: 82, d: 0, c2: -28, d2: -84 }, h: 'db' },
  lunge_bw: { f: { p: [56, 60], t: 2, a: 10, b: 10, c: 82, d: 0, c2: -28, d2: -84 } },
  lunge_heavy: { f: { p: [56, 60], t: 2, a: -40, b: 160, c: 82, d: 0, c2: -28, d2: -84 }, h: 'bbS' },
  bulgarian: { f: { p: [60, 58], t: 6, a: 0, c: 80, d: 0, c2: -30, d2: -80, nofoot: 1 }, eq: [['r', 22, 62, 22, 5], ['l', 33, 67, 33, G, 2.5]], h: 'db' },
  pistol_box: { f: { p: [52, 60], t: 30, a: 85, b: 90, c: 80, d: -12, c2: 80, d2: 82 }, eq: [['b', 30, 64, 24, 20]] },
  legext: { m: 'leg', f: { p: [52, 60], t: -8, a: 10, b: 50, c: 88, d: 70 }, eq: SEAT(50, 60, true).concat([['l', 80, 70, 70, 76, 4], ['s', 14, 34, 50]]) },
  legext_hs: { m: 'leg', f: { p: [52, 60], t: -8, a: 10, b: 50, c: 88, d: 70 }, eq: SEAT(50, 60, true).concat([['l', 80, 70, 70, 76, 4], ['p', 70, 50]]) },
  legcurl_s: { m: 'leg', f: { p: [50, 60], t: -8, a: 20, b: 60, c: 88, d: 10 }, eq: SEAT(48, 60, true).concat([['r', 52, 50, 22, 5], ['l', 64, 82, 72, 78, 4], ['s', 96, 34, 50]]) },
  legcurl_l: { m: 'leg', f: { p: [64, 58], t: -90, ht: -96, a: -170, b: -170, c: 92, d: 150, nofoot: 1 }, eq: [['r', 26, 62, 66, 5], ['l', 40, 67, 40, G, 2.5], ['l', 82, 67, 82, G, 2.5], ['s', 100, 34, 50]] },
  legcurl_hs: { m: 'leg', f: { p: [64, 58], t: -90, ht: -96, a: -170, b: -170, c: 92, d: 150, nofoot: 1 }, eq: [['r', 26, 62, 66, 5], ['l', 40, 67, 40, G, 2.5], ['l', 82, 67, 82, G, 2.5], ['p', 100, 50]] },
  calf_mach: { m: 'leg', f: { p: [56, 46], t: 0, a: -20, b: 170, c: 0, d: 0 }, eq: [['r', 48, 16, 16, 5], ['b', 52, 80, 14, 4], ['s', 18, 34, 50]] },
  calf_hs: { m: 'leg', f: { p: [50, 60], t: 0, a: 30, b: 80, c: 88, d: 0 }, eq: SEAT(48, 60).concat([['r', 58, 54, 22, 4], ['b', 64, 80, 12, 4], ['p', 92, 52]]) },
  calf_press: { m: 'leg', f: { p: [44, 68], t: -58, ht: -40, a: 25, b: 40, c: 115, d: 115, nofoot: 1 }, eq: [['l', 40, 76, 16, 62, 6], ['l', 28, 76, 50, 76, 6], ['l', 46, 79, 46, G, 3], ['l', 80, 74, 104, 50, 3], ['l', 74, 50, 86, 62, 5], ['s', 104, 44, 40]] },
  calf_press_hs: { m: 'leg', f: { p: [44, 68], t: -58, ht: -40, a: 25, b: 40, c: 115, d: 115, nofoot: 1 }, eq: [['l', 40, 76, 16, 62, 6], ['l', 28, 76, 50, 76, 6], ['l', 46, 79, 46, G, 3], ['l', 80, 74, 104, 50, 3], ['l', 74, 50, 86, 62, 5], ['p', 92, 46]] },
  calf_stand: { f: { p: [60, 45], t: 0, a: 0, c: 0, d: 0 }, eq: [['b', 56, 80, 14, 4]], h: 'db' },
  adductor: { m: 'leg', f: { p: [50, 60], t: -10, a: 20, b: 60, c: 90, d: 0 }, eq: SEAT(48, 60, true).concat([['r', 66, 56, 4, 18], ['s', 96, 34, 50], ['t', 74, 50, '→←']]) },
  abductor: { m: 'leg', f: { p: [50, 60], t: -10, a: 20, b: 60, c: 90, d: 0 }, eq: SEAT(48, 60, true).concat([['r', 66, 56, 4, 18], ['s', 96, 34, 50], ['t', 74, 50, '←→']]) },
  hipthrust: { f: { p: [62, 54], t: -95, ht: -80, a: -170, b: -120, c: 70, d: 0 }, eq: [['r', 26, 50, 16, 34], ['c', 62, 47, 8.5]] },
  /* Charnière de hanche */
  deadlift: { f: Object.assign({}, P_HINGE, { p: [50, 52], t: 62, c: 40, d: -10, a: 0 }), h: 'bb' },
  rdl: { f: Object.assign({}, P_HINGE, { a: 0 }), h: 'bb' },
  db_rdl: { f: Object.assign({}, P_HINGE, { a: 0 }), h: 'db' },
  db_deadlift: { f: Object.assign({}, P_HINGE, { p: [50, 54], t: 58, c: 50, d: -14, a: 0 }), h: 'db' },
  good_morning: { f: Object.assign({}, P_HINGE, { a: -40, b: 160 }), h: 'bbS' },
  kb_swing_ru: { f: { p: [56, 49], t: -4, a: 90, b: 90, c: 4, d: 0 }, h: 'kb1' },
  back_ext: { f: { p: [60, 58], t: 70, ht: 60, a: 130, b: 170, c: -60, d: -60, nofoot: 1 }, eq: [['r', 56, 58, 10, 6], ['l', 30, 82, 60, 60, 3], ['r', 22, 74, 10, 5]] },
  superman: { f: { p: [60, 76], t: -84, ht: -76, a: -160, b: -150, c: 84, d: 84, nofoot: 1 }, eq: [['l', 10, 82, 110, 82, 1.5]] },
  /* Gainage */
  plank_fa: { f: Object.assign({}, P_PLANK, { a: 0, b: 90 }), eq: [['l', 10, 85, 110, 85, 1.5]] },
  plank_fist: { f: Object.assign({}, P_PLANK, { p: [58, 56], t: 100, a: 0, b: 0 }), eq: [['l', 10, 85, 110, 85, 1.5]] },
  shoulder_taps: { f: Object.assign({}, P_PLANK, { p: [58, 56], t: 100, a: 0, b: 0, a2: 90, b2: 150 }), eq: [['l', 10, 85, 110, 85, 1.5]] },
  side_plank: { f: { p: [58, 64], t: 110, ht: 110, a: 0, b: 90, c: -72, d: -72, a2: 180, b2: 180, nofoot: 1 }, eq: [['l', 10, 85, 110, 85, 1.5]] },
  deadbug: { f: { p: [64, 78], t: -88, ht: -88, a: 180, b: 180, c: 180, d: 90, a2: -150, b2: -150, c2: 110, d2: 110, nofoot: 1 }, eq: [['l', 10, 84, 110, 84, 1.5]] },
  bird_dog: { f: { p: [40, 56], t: 92, ht: 92, a: 90, b: 90, c: -100, d: -100, a2: 0, b2: 0, c2: 90, d2: -90, nofoot: 1 }, eq: [['l', 10, 84, 110, 84, 1.5]] },
  hollow: { f: { p: [60, 78], t: -70, ht: -60, a: -110, b: -110, c: 110, d: 110, nofoot: 1 }, eq: [['l', 10, 84, 110, 84, 1.5]] },
  hollow_rock: { f: { p: [60, 80], t: -64, ht: -56, a: -100, b: -100, c: 116, d: 116, nofoot: 1 }, eq: [['l', 10, 84, 110, 84, 1.5]] },
  russian_twist: { f: { p: [58, 80], t: -40, ht: -30, a: 120, b: 60, c: 120, d: 20, nofoot: 1 }, h: 'plate', eq: [['l', 10, 84, 110, 84, 1.5]] },
  lsit: { f: { p: [58, 64], t: 0, a: 0, b: 0, c: 90, d: 90, nofoot: 1 }, eq: [['l', 52, 66, 66, 66, 3], ['l', 54, 66, 54, G, 2], ['l', 64, 66, 64, G, 2]] },
  t2b: { f: { p: [56, 60], t: -10, a: 170, b: 172, c: 120, d: 170, nofoot: 1 }, eq: [['l', 30, 12, 96, 12, 3]] },
  pallof: { f: Object.assign({}, P_STAND, { a: 80, b: 90 }), eq: [['l', 104, 20, 104, G, 3], ['l', 104, 38, 82, 37, 1]] },
  situp: { f: { p: [52, 80], t: 25, ht: 30, a: 70, b: 80, c: 120, d: 20, nofoot: 1 }, eq: [['l', 10, 84, 110, 84, 1.5], ['r', 44, 78, 14, 4]] },
  vup: { f: { p: [60, 80], t: -40, ht: -30, a: 140, b: 140, c: 135, d: 135, nofoot: 1 }, eq: [['l', 10, 84, 110, 84, 1.5]] },
  k2e: { f: { p: [56, 58], t: -8, a: 170, b: 172, c: 140, d: 0, nofoot: 1 }, eq: [['l', 30, 12, 96, 12, 3]] },
  /* Poussées */
  chest_press: { m: 'up', f: { p: [52, 60], t: -6, a: 80, b: 92, c: 88, d: 0 }, eq: SEAT(50, 60, true).concat([['l', 80, 30, 80, 44, 4], ['s', 98, 34, 50]]) },
  iso_chest: { m: 'up', f: { p: [52, 60], t: -6, a: 80, b: 92, c: 88, d: 0 }, eq: SEAT(50, 60, true).concat([['l', 80, 30, 80, 44, 4], ['p', 96, 40]]) },
  shoulder_mach: { m: 'up', f: { p: [52, 62], t: -4, a: 150, b: 178, c: 88, d: 0 }, eq: SEAT(50, 62, true).concat([['l', 62, 12, 76, 12, 4], ['s', 96, 34, 50]]) },
  shoulder_hs: { m: 'up', f: { p: [52, 62], t: -4, a: 150, b: 178, c: 88, d: 0 }, eq: SEAT(50, 62, true).concat([['l', 62, 12, 76, 12, 4], ['p', 92, 22]]) },
  db_seat_press: { f: { p: [52, 62], t: -4, a: 100, b: 175, c: 88, d: 0 }, eq: SEAT(50, 62, true), h: 'db' },
  db_stand_press: { f: Object.assign({}, P_STAND, { a: 100, b: 178 }), h: 'db' },
  strict_press: { f: Object.assign({}, P_STAND, { a: 160, b: 178 }), h: 'bb' },
  push_press: { f: { p: [60, 52], t: 2, a: 160, b: 178, c: 20, d: -10 }, h: 'bb' },
  bench: { f: { p: [56, 60], t: -90, ht: -96, a: 180, b: 180, c: 80, d: 0 }, eq: BENCH(18, 66), h: 'bb' },
  incline_db: { f: { p: [52, 62], t: -50, ht: -40, a: 150, b: 170, c: 90, d: 0 }, eq: [['r', 26, 40, 5, 26], ['l', 36, 66, 36, G, 2.5], ['r', 38, 62, 18, 5]], h: 'db' },
  pushup_par: { f: Object.assign({}, P_PLANK, { p: [58, 58], t: 100, a: 0, b: 0 }), eq: [['l', 10, 85, 110, 85, 1.5]] },
  dip_assist: { m: 'up', f: { p: [58, 52], t: 8, a: -20, b: 0, c: 60, d: 0, nofoot: 1 }, eq: [['l', 50, 54, 76, 54, 4], ['r', 44, 72, 24, 5], ['s', 88, 34, 50]] },
  dip_hs: { m: 'up', f: { p: [50, 60], t: -4, a: -30, b: 0, c: 88, d: 0 }, eq: SEAT(48, 60, true).concat([['l', 50, 66, 70, 66, 4], ['p', 86, 50]]) },
  dips: { f: { p: [58, 52], t: 10, a: -40, b: 0, c: 40, d: -60, nofoot: 1 }, eq: [['l', 48, 62, 76, 62, 3], ['l', 52, 62, 52, G, 2], ['l', 72, 62, 72, G, 2]] },
  ring_dips: { f: { p: [58, 52], t: 10, a: -40, b: 0, c: 40, d: -60, nofoot: 1 }, eq: [['l', 56, 0, 56, 56, 1], ['o', 56, 60, 4]] },
  skull: { f: { p: [56, 60], t: -90, ht: -96, a: 160, b: -110, c: 80, d: 0 }, eq: BENCH(18, 66), h: 'bar' },
  db_oh_triceps: { f: { p: [52, 62], t: -4, a: 165, b: 10, c: 88, d: 0 }, eq: SEAT(50, 62, true), h: 'db' },
  rope_pd: { f: Object.assign({}, P_STAND, { a: 10, b: 30 }), eq: [['l', 96, 6, 96, G, 3], ['l', 96, 10, 70, 60, 1]] },
  /* Tirages */
  latpull: { m: 'up', f: { p: [50, 62], t: -12, a: 170, b: 155, c: 88, d: 0 }, eq: SEAT(48, 62).concat([['r', 56, 52, 16, 4], ['l', 40, 18, 72, 18, 3], ['s', 90, 34, 50]]) },
  latpull_hs: { m: 'up', f: { p: [50, 62], t: -12, a: 170, b: 155, c: 88, d: 0 }, eq: SEAT(48, 62).concat([['r', 56, 52, 16, 4], ['l', 40, 18, 72, 18, 3], ['p', 86, 30]]) },
  seated_row: { m: 'up', f: { p: [46, 62], t: 4, a: 60, b: 90, c: 88, d: 0 }, eq: SEAT(44, 62).concat([['r', 64, 28, 5, 18], ['l', 76, 40, 92, 40, 4], ['s', 96, 34, 50]]) },
  iso_row: { m: 'up', f: { p: [46, 62], t: 4, a: 60, b: 90, c: 88, d: 0 }, eq: SEAT(44, 62).concat([['r', 64, 28, 5, 18], ['l', 76, 40, 92, 40, 4], ['p', 100, 40]]) },
  ringrow: { f: { p: [58, 58], t: -60, ht: -60, a: -150, b: -170, c: 60, d: 60 }, eq: [['l', 26, 0, 26, 18, 1], ['o', 26, 20, 3.5]] },
  db_row: { f: { p: [44, 50], t: 84, ht: 80, a: 0, b: 0, c: 10, d: 0, a2: 20, b2: 0, c2: 70, d2: 0, nofoot: 1 }, eq: BENCH(54, 96, 66), h: 'db' },
  bor: { f: Object.assign({}, P_HINGE, { a: 30, b: 0 }), h: 'bb' },
  pendlay: { f: { p: [50, 50], t: 84, ht: 70, a: 0, b: 0, c: 20, d: -10 }, h: 'bb' },
  strict_pu: { f: { p: [58, 62], t: 0, a: 165, b: 178, c: -10, d: -70 }, eq: [['l', 30, 12, 96, 12, 3]] },
  banded_pu: { f: { p: [58, 62], t: 0, a: 165, b: 178, c: -10, d: -70 }, eq: [['l', 30, 12, 96, 12, 3], ['l', 56, 12, 50, 80, 1.5], ['l', 50, 80, 62, 80, 1.5]] },
  neg_pu: { f: { p: [58, 60], t: 0, a: 160, b: 190, c: -10, d: -70 }, eq: [['l', 30, 12, 96, 12, 3], ['t', 78, 60, '↓5s']] },
  shrug: { f: Object.assign({}, P_STAND, { a: 0 }), h: 'db', eq: [['t', 76, 22, '↑']] },
  face_pull: { f: Object.assign({}, P_STAND, { a: 90, b: 150 }), eq: [['l', 104, 20, 104, G, 3], ['l', 104, 24, 80, 28, 1]] },
  db_rear_fly: { f: { p: [54, 60], t: 50, a: 90, b: 90, c: 90, d: 0 }, eq: [['l', 40, 70, 74, 32, 5], ['l', 54, 66, 54, G, 2.5]], h: 'db' },
  lat_raise: { f: Object.assign({}, P_STAND, { a: 90, b: 90 }), h: 'db' },
  /* Bras */
  hammer_curl: { f: Object.assign({}, P_STAND, { a: 0, b: 150 }), h: 'db' },
  ez_curl: { f: Object.assign({}, P_STAND, { a: 10, b: 160 }), h: 'bar' },
  incline_curl: { f: { p: [52, 62], t: -40, ht: -30, a: -10, b: 120, c: 90, d: 0 }, eq: [['r', 28, 40, 5, 26], ['l', 36, 66, 36, G, 2.5], ['r', 38, 62, 18, 5]], h: 'db' },
  /* Portés */
  farmer: { f: { p: [60, 49], t: 0, a: 0, a2: 0, c: 20, d: 0, c2: -20, d2: -20 }, h: 'db', eq: [['t', 82, 30, '→']] },
  suitcase: { f: { p: [60, 49], t: 0, a: 0, c: 20, d: 0, c2: -20, d2: -20 }, h: 'kb1', eq: [['t', 82, 30, '→']] },
  kb_rack_carry: { f: { p: [60, 49], t: 0, a: 178, b: 178, c: 20, d: 0, c2: -20, d2: -20 }, h: 'kb1', eq: [['t', 82, 30, '→']] },
  tgu: { f: { p: [56, 70], t: -30, ht: -20, a: 180, b: 180, c: 100, d: 0, a2: -150, b2: -150, c2: 70, d2: 10, nofoot: 1 }, h: 'kb1' },
  /* Haltérophilie et mouvements dynamiques */
  hpc: { f: { p: [58, 52], t: 10, a: 95, b: 175, c: 30, d: -10 }, h: 'bbF' },
  power_clean: { f: { p: [58, 52], t: 10, a: 95, b: 175, c: 30, d: -10 }, h: 'bbF' },
  db_hang_clean: { f: { p: [58, 52], t: 10, a: 40, b: 168, c: 30, d: -10 }, h: 'db' },
  sdhp: { f: { p: [58, 50], t: 4, a: 110, b: -60, c: 20, d: 0, c2: -20, d2: 0 }, h: 'bar' },
  db_thruster: { f: Object.assign({}, P_STAND, { a: 170, b: 178 }), h: 'db', eq: [['t', 82, 64, '↑']] },
  wall_ball: { f: { p: [56, 52], t: 6, a: 150, b: 170, c: 30, d: -10 }, h: 'ball', eq: [['l', 104, 0, 104, G, 3], ['r', 100, 8, 4, 6]] },
  rope_su: { f: { p: [60, 46], t: 0, a: 20, b: 60, c: 6, d: 6 }, eq: [['l', 10, 85, 110, 85, 1.5], ['l', 38, 80, 82, 80, 1]] },
  /* Cardio */
  rower: { m: 'cardio', f: { p: [50, 74], t: -20, a: 80, b: 90, c: 110, d: 30 }, eq: [['l', 10, 80, 110, 80, 3], ['r', 42, 76, 14, 4], ['p', 102, 66], ['l', 72, 70, 78, 80, 3]] },
  skierg: { m: 'cardio', f: { p: [56, 50], t: 40, a: 30, b: 10, c: 20, d: -10 }, eq: [['l', 96, 8, 96, G, 6], ['r', 90, 6, 12, 10]] },
  bike: { m: 'cardio', f: { p: [52, 48], t: 30, a: 50, b: 90, c: 80, d: 10 }, eq: [['r', 42, 46, 18, 4], ['l', 52, 50, 60, 76, 3], ['o', 66, 70, 10], ['l', 80, 26, 80, 76, 3], ['l', 50, 84, 92, 84, 3]] },
  assault: { m: 'cardio', f: { p: [52, 48], t: 24, a: 70, b: 60, c: 80, d: 10 }, eq: [['r', 42, 46, 18, 4], ['l', 52, 50, 60, 76, 3], ['o', 84, 58, 14], ['l', 74, 26, 66, 60, 3], ['l', 50, 84, 100, 84, 3]] },
  incline_walk: { m: 'cardio', f: { p: [60, 44], t: 6, a: -20, b: 30, a2: 20, b2: 60, c: 20, d: 0, c2: -18, d2: -24 }, eq: [['l', 16, 84, 104, 74, 5], ['l', 100, 74, 100, 34, 3], ['l', 100, 36, 90, 38, 3]] },
  stairs: { m: 'cardio', f: { p: [56, 44], t: 10, a: 10, b: 40, c: 70, d: -10, c2: -10, d2: -10 }, eq: [['b', 60, 62, 30, 6], ['b', 76, 54, 30, 6], ['b', 44, 70, 30, 14]] },
  run: { m: 'cardio', f: { p: [58, 46], t: 12, a: -40, b: 40, a2: 40, b2: 120, c: 50, d: -20, c2: -30, d2: -80 } }
};
/* Alias : même dessin que l'exercice de référence */
Object.assign(THUMB_DEF, {
  hack: THUMB_DEF.hack,
  kb_dl: Object.assign({}, THUMB_DEF.deadlift, { h: 'kb1' }),
  kb_swing_am: { f: { p: [58, 46], t: 0, a: 150, b: 165, c: 4, d: 0 }, h: 'kb1' },
  db_snatch: { f: { p: [58, 48], t: 6, a: 160, b: 168, a2: 10, b2: 40, c: 20, d: -20, c2: -14, d2: 0 }, h: 'db1' },
  devil: { f: { p: [58, 46], t: 0, a: 160, b: 170, a2: 150, b2: 165, c: 4, d: 0 }, h: 'db' },
  burpee: THUMB_DEF.pushup_par,
  wallball: THUMB_DEF.wall_ball,
  assault_wod: THUMB_DEF.assault, skierg_wod: THUMB_DEF.skierg, double_under: THUMB_DEF.rope_su,
  hip_hinge: Object.assign({}, THUMB_DEF.good_morning, { h: '', eq: [['l', 18, 0, 18, G, 4]] }),
  leg_swings: { f: { p: [56, 46], t: 0, a: 80, b: 80, c: 70, d: 0, c2: -4, d2: 0 }, eq: [['l', 96, 0, 96, G, 4]] },
  st_pec: { f: { p: [60, 46], t: 0, a: -88, b: -88, c: 2, d: 0, c2: -2, d2: 0 }, eq: [['l', 28, 0, 28, G, 4]] }
});

function thumbSvg(k) {
  const def = THUMB_DEF[k]; if (!def) return '';
  const J = pose(def.f);
  /* cadrage serré sur la silhouette et le matériel, au format 4:3 */
  const xs = [], ys = []; const add = q => { xs.push(q[0]); ys.push(q[1]); };
  [J.P, J.S, J.E, J.W, J.K, J.A].forEach(add); [J.H[0] - 6, J.H[0] + 6].forEach(x => add([x, J.H[1] - 6]));
  if (J.E2) J.E2.forEach(add); if (J.K2) J.K2.forEach(add);
  (def.eq || []).forEach(e => { const [k, ...v] = e; if (k === 't') { add([v[0], v[1] - 9]); add([v[0] + 14, v[1]]); } else if (k === 'l') { add([v[0], v[1]]); add([v[2], v[3]]); } else if (k === 'r' || k === 'b') { add([v[0], v[1]]); add([v[0] + v[2], v[1] + v[3]]); } else if (k === 's') { add([v[0], v[1] - 10]); add([v[0] + 12, v[1] + v[2]]); } else if (k === 'c' || k === 'o' || k === 'p') { const r = k === 'p' ? 9.5 : v[2]; add([v[0] - r, v[1] - r]); add([v[0] + r, v[1] + r]); } });
  if (def.h) { add([J.W[0] - 9, J.W[1] - 11]); add([J.W[0] + 9, J.W[1] + 10]); if (def.h === 'bbS' || def.h === 'bbF') { add([J.S[0] - 11, J.S[1] - 10]); add([J.S[0] + 13, J.S[1] + 9]); } }
  ys.push(G + 1);
  let x0 = Math.min(...xs) - 6, x1 = Math.max(...xs) + 6, y0 = Math.max(-30, Math.min(...ys) - 6), y1 = G + 3;
  let w = x1 - x0, h = y1 - y0;
  if (w / h > 4 / 3) { const nh = w * 3 / 4; y0 -= nh - h; h = nh; } else { const nw = h * 4 / 3; x0 -= (nw - w) / 2; w = nw; }
  const vb = [x0, y0, w, h].map(n => Math.round(n * 10) / 10).join(' ');
  return `<svg class="tb" viewBox="${vb}" role="img" aria-label="${esc((EXERCISES[k] || {}).fr || k)}"><path d="M${Math.round(x0)},${G + 0.5}H${Math.round(x0 + w)}" class="tb-ground"/>${eqSvg(def.eq)}${figSvg(J, def.f)}${heldSvg(J, def.h)}</svg>`;
}
const hasThumb = k => !!THUMB_DEF[k];
/* Photo de l'exercice quand elle existe (free-exercise-db, domaine public), sinon le dessin */
const exImg = k => (EXERCISES[k] || {}).img;
const hasExThumb = k => !!((exImg(k) || {}).file || THUMB_DEF[k]);
function exThumb(k) {
  const im = exImg(k);
  if (im && im.file) return `<img class="tb tbimg" src="${esc(im.file)}" alt="${esc((EXERCISES[k] || {}).fr || k)}" loading="lazy" onerror="thumbImgFail(this,'${esc(k)}')">`;
  return thumbSvg(k);
}
window.thumbImgFail = (img, k) => { const s = thumbSvg(k); if (s) img.outerHTML = s; else img.remove(); };
