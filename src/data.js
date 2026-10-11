/* Carnet On Air : couche de données.
   L'affichage ne contient aucune donnée d'entraînement. Il lit trois documents JSON :
   - bibliotheque.json (onair.bibliotheque) : groupes musculaires, exercices du programme,
     vidéos vérifiées et catalogue des mouvements CrossFit ;
   - carnet.json (onair.carnet) : cycles, types de séance, séances, buts, repères, consignes ;
   - progression.json (onair.progression) : ce que tu notes (séries, charges, RPE,
     commentaires, repères, préférences de mouvements, réglages).
   Les deux premiers sont lus dans data/ quand la page est servie par un site (GitHub Pages),
   sinon dans la copie intégrée au moment de la construction. Un fichier importé remplace
   la version d'origine sur cet appareil jusqu'à la remise à zéro. */

let BIB = null, CAR = null;
let MUSCLES = {}, EXERCISES = {}, VIDEOS = {}, CATALOG = { movements: [] }, MOVES = [], MOVE_BY_ID = {};
let MACHINE_PAIRS = [], PAIR_OF = {};
let CYCLES = [], SESSION_TYPES = {}, SESSIONS = [], SESSION_BY_ID = {}, BENCHMARKS = [], OBJECTIVES = [], PROGRAM_RULES = [], USAGE = {};
const DATA_LS = { bib: 'onair-bibliotheque', car: 'onair-carnet', snaps: 'onair-sauvegardes' };
/* base : version d'origine (fichier du site ou copie intégrée) ; source : d'où vient la version active */
const DATA = { base: { bib: null, car: null }, source: { bib: 'intégrée', car: 'intégrée' } };

function checkBib(d) {
  if (!d || d.fileType !== 'onair.bibliotheque') return 'ce n’est pas une bibliothèque de mouvements';
  if (!d.exercises || typeof d.exercises !== 'object') return 'la liste des exercices manque';
  if (!d.muscles || typeof d.muscles !== 'object') return 'la liste des groupes musculaires manque';
  return null;
}
function checkCar(d, bib) {
  if (!d || d.fileType !== 'onair.carnet' || !Array.isArray(d.sessions)) return 'ce n’est pas un carnet de séances';
  if (!Array.isArray(d.cycles) || !d.sessionTypes) return 'les cycles ou les types de séance manquent';
  for (const s of d.sessions) {
    if (!s.id || !s.cycle || !d.sessionTypes[s.slot]) return `la séance ${s.id || '?'} est incomplète`;
    s.warmup = s.warmup || []; s.cooldown = s.cooldown || []; s.blocks = s.blocks || [];
  }
  return null;
}
/* Exercices cités par le carnet mais absents de la bibliothèque (affichés sous leur clé) */
function missingExercises(car, bib) {
  const ex = (bib && bib.exercises) || {}; const miss = new Set();
  car.sessions.forEach(s => {
    s.warmup.concat(s.cooldown).forEach(l => (l.x || []).forEach(k => { if (!ex[k]) miss.add(k); }));
    s.blocks.forEach(b => (b.items || []).forEach(it => { if (!ex[it.x]) miss.add(it.x); }));
  });
  return [...miss];
}

function applyData(bib, car) {
  BIB = bib; CAR = car;
  MUSCLES = bib.muscles || {}; EXERCISES = bib.exercises || {}; VIDEOS = bib.videos || {};
  CATALOG = bib.catalogue || { movements: [] }; MOVES = CATALOG.movements || [];
  MOVE_BY_ID = Object.fromEntries(MOVES.map(m => [m.id, m]));
  MACHINE_PAIRS = (bib.machinePairs || []).filter(p => EXERCISES[p.guidee] && EXERCISES[p.hammer]);
  PAIR_OF = {}; MACHINE_PAIRS.forEach(p => { if (!PAIR_OF[p.guidee]) PAIR_OF[p.guidee] = p; if (!PAIR_OF[p.hammer]) PAIR_OF[p.hammer] = p; });
  CYCLES = car.cycles || []; SESSION_TYPES = car.sessionTypes || {}; SESSIONS = car.sessions || [];
  SESSION_BY_ID = Object.fromEntries(SESSIONS.map(s => [s.id, s]));
  BENCHMARKS = car.benchmarks || []; OBJECTIVES = car.objectives || []; PROGRAM_RULES = car.rules || [];
  const u = {}; const add = (k, sid, where) => { (u[k] = u[k] || []).push({ sid, where }); };
  SESSIONS.forEach(s => {
    s.warmup.forEach(l => (l.x || []).forEach(k => add(k, s.id, 'mise en route')));
    s.cooldown.forEach(l => (l.x || []).forEach(k => add(k, s.id, 'retour au calme')));
    s.blocks.forEach(b => (b.items || []).forEach(it => add(it.x, s.id, b.type === 'wod' ? 'WOD' : 'bloc ' + b.l)));
  });
  USAGE = u;
  if (typeof UI !== 'undefined') {
    if (UI.session && !SESSION_BY_ID[UI.session]) UI.session = null;
    if (UI.exo && !EXERCISES[UI.exo]) UI.exo = null;
    if (UI.move && !MOVE_BY_ID[UI.move]) UI.move = null;
    if (!SESSION_BY_ID[UI.musSession] && SESSIONS[0]) UI.musSession = SESSIONS[0].id;
    if (!CYCLES.some(c => c.n === UI.progCycle) && CYCLES[0]) UI.progCycle = CYCLES[0].n;
  }
}

function readLS(key) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function writeLS(key, v) {
  try { if (v == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(v)); return true; }
  catch (e) { return false; }
}

/* Démarrage synchrone : copie intégrée, puis version importée gardée sur l'appareil */
function initData() {
  DATA.base.bib = typeof EMBED_BIB !== 'undefined' ? EMBED_BIB : null;
  DATA.base.car = typeof EMBED_CAR !== 'undefined' ? EMBED_CAR : null;
  pickData();
}
function pickData() {
  const ob = readLS(DATA_LS.bib), oc = readLS(DATA_LS.car);
  const bib = ob && !checkBib(ob) ? ob : DATA.base.bib;
  const car = oc && !checkCar(oc, bib) ? oc : DATA.base.car;
  DATA.source.bib = bib === ob ? (typeof Server !== 'undefined' && Server.on ? 'serveur' : 'importée') : DATA.source.baseBib || 'intégrée';
  DATA.source.car = car === oc ? (typeof Server !== 'undefined' && Server.on ? 'serveur' : 'importé') : DATA.source.baseCar || 'intégré';
  applyData(bib, car);
}
/* Sur un site : relit data/*.json pour que la modification d'un fichier suffise, sans reconstruire la page */
async function refreshDataFiles() {
  if (!/^https?:$/.test(location.protocol)) return false;
  const get = async name => {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
    try { const r = await fetch('data/' + name, { cache: 'no-cache', signal: ctl.signal }); return r.ok ? await r.json() : null; }
    catch (e) { return null; } finally { clearTimeout(t); }
  };
  const [b, c] = await Promise.all([get('bibliotheque.json'), get('carnet.json')]);
  let changed = false;
  if (b && !checkBib(b) && JSON.stringify(b) !== JSON.stringify(DATA.base.bib)) { DATA.base.bib = b; changed = true; }
  if (b && !checkBib(b)) DATA.source.baseBib = 'fichier du site';
  if (c && !checkCar(c, DATA.base.bib) && JSON.stringify(c) !== JSON.stringify(DATA.base.car)) { DATA.base.car = c; changed = true; }
  if (c && !checkCar(c, DATA.base.bib)) DATA.source.baseCar = 'fichier du site';
  pickData();
  return changed;
}

/* ── Les trois documents tels qu'on les exporte */
function docBibliotheque() {
  const b = JSON.parse(JSON.stringify(BIB));
  /* les préférences de mouvements restent dans la progression ; on les recopie dans le catalogue exporté */
  (b.catalogue && b.catalogue.movements || []).forEach(m => { if (S.prefs[m.id]) m.selection = S.prefs[m.id]; });
  b.exportedAt = new Date().toISOString();
  return b;
}
function docCarnet() { return Object.assign(JSON.parse(JSON.stringify(CAR)), { exportedAt: new Date().toISOString() }); }
function docProgression(st) {
  st = st || S;
  return { fileType: 'onair.progression', version: 1, exportedAt: new Date().toISOString(), carnet: CAR && CAR.title,
    settings: st.settings, prefs: st.prefs, machines: st.machines || {}, bench: st.bench, logs: st.logs };
}
function progressionToState(d) {
  /* accepte aussi l'ancien export { fileType: 'onair.carnet', data: { v: 1, … } } */
  const src = d && d.fileType === 'onair.progression' ? d : d && d.data && d.data.v === 1 ? d.data : null;
  if (!src) return null;
  const st = blankState();
  st.settings = Object.assign(st.settings, src.settings || {});
  st.prefs = src.prefs || {}; st.machines = src.machines || {}; st.bench = src.bench || {}; st.logs = src.logs || {};
  return st;
}
function isLegacyProgression(d) { return d && d.fileType === 'onair.carnet' && d.data && d.data.v === 1; }

/* Remplace la progression et la pousse vers le compte */
function replaceProgression(st) {
  const old = Object.keys(S.logs);
  S = st; const now = Date.now(); S.metaAt = now;
  Object.values(S.logs).forEach(L => { L.updatedAt = now; });
  markDirty('meta');
  new Set(old.concat(Object.keys(S.logs))).forEach(id => markDirty('log-' + id));
  applySettings();
}
/* Bibliothèque ou carnet importé : gardé sur l'appareil, et sur le serveur en version site */
function writeDoc(kind, doc) { const ok = writeLS(DATA_LS[kind], doc); if (typeof serverDocDirty === 'function') serverDocDirty(kind); return ok; }
function setOverride(kind, doc) {
  const ok = writeDoc(kind, doc);
  pickData();
  return ok;
}

/* ── Sauvegardes (points de restauration) : sur l'appareil, et dans le compte pour la progression */
let SNAPS = readLS(DATA_LS.snaps) || [];
const SNAP_MAX = 12;
function storeSnaps() {
  SNAPS.sort((a, b) => b.at - a.at);
  while (SNAPS.length > SNAP_MAX) { const x = SNAPS.pop(); markDirty('snap-' + x.id); }
  if (!writeLS(DATA_LS.snaps, SNAPS)) {
    /* stockage plein : on retire d'abord les copies de bibliothèque/carnet des plus anciennes */
    for (let i = SNAPS.length - 1; i >= 0 && !writeLS(DATA_LS.snaps, SNAPS); i--) { delete SNAPS[i].bib; delete SNAPS[i].car; }
  }
}
function makeSnapshot(label) {
  const snap = { id: Date.now().toString(36), at: Date.now(), label: label || 'Sauvegarde manuelle', progression: docProgression() };
  if (readLS(DATA_LS.bib)) snap.bib = BIB;
  if (readLS(DATA_LS.car)) snap.car = CAR;
  SNAPS.unshift(snap); storeSnaps(); markDirty('snap-' + snap.id);
  return snap;
}
function restoreSnapshot(id) {
  const snap = SNAPS.find(x => x.id === id); if (!snap) return false;
  makeSnapshot('Avant restauration du ' + new Date(snap.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }));
  writeDoc('bib', snap.bib || null); writeDoc('car', snap.car || null); pickData();
  const st = progressionToState(snap.progression); if (st) replaceProgression(st);
  return true;
}
function deleteSnapshot(id) { SNAPS = SNAPS.filter(x => x.id !== id); storeSnaps(); markDirty('snap-' + id); }

/* ── Remise à zéro : chaque cible est d'abord sauvegardée, la restauration reste possible */
function resetData(what) {
  makeSnapshot('Avant remise à zéro (' + ({ progression: 'progression', bib: 'bibliothèque', car: 'carnet', all: 'tout' })[what] + ')');
  if (what === 'bib' || what === 'all') writeDoc('bib', null);
  if (what === 'car' || what === 'all') writeDoc('car', null);
  pickData();
  if (what === 'progression' || what === 'all') { const keep = S.settings; const st = blankState(); st.settings = keep; replaceProgression(st); }
}
