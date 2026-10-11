/* Carnet On Air : enregistrement sur le serveur Supabase (version site).
   Actif seulement si config/supabase.json est rempli et la bibliothèque supabase-js chargée.
   - progression : une ligne par compte (table progression), dernière écriture gagnante ;
   - bibliothèque et carnet partagés : table documents, modifiables par un administrateur ;
   - sauvegardes : table sauvegardes, une ligne par point de restauration.
   Une copie reste dans le navigateur pour fonctionner sans réseau à la salle ;
   les modifications faites hors ligne partent au retour du réseau. */
const Server = { on: false, client: null, user: null, timer: null, busy: false, prog: false, docs: {}, snaps: new Set() };
const SERVER_LS = 'onair-server-user';
const serverConfigured = () => typeof SUPA_CONFIG !== 'undefined' && !!(SUPA_CONFIG && SUPA_CONFIG.url && SUPA_CONFIG.anonKey);
const DOC_KIND = { bib: 'bibliotheque', car: 'carnet' };

function serverClient() {
  if (Server.client) return Server.client;
  if (!serverConfigured() || !window.supabase || typeof window.supabase.createClient !== 'function') return null;
  Server.client = window.supabase.createClient(SUPA_CONFIG.url, SUPA_CONFIG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  return Server.client;
}
function loginToEmail(login) {
  /* clavier français : « à » tapé à la place de « @ » */
  let l = String(login || '').trim().replace(/\s+/g, '');
  if (!l.includes('@') && /à/.test(l) && /\.[a-z]{2,}$/i.test(l)) l = l.replace(/à(?=[^à]*$)/, '@');
  if (l.includes('@')) return l.toLowerCase();
  const map = (SUPA_CONFIG && SUPA_CONFIG.logins) || {};
  return map[l.toLowerCase()] || null;
}
async function serverRole(c, uid) {
  const last = readLS(SERVER_LS); const known = last && last.id === uid ? last.role : 'membre';
  try { const { data, error } = await c.from('roles').select('role').eq('user_id', uid).maybeSingle(); return error ? known : (data && data.role) || 'membre'; }
  catch (e) { return known; }
}
function loginOf(email) {
  const map = (SUPA_CONFIG && SUPA_CONFIG.logins) || {};
  return Object.keys(map).find(k => map[k] === email) || email;
}
function rememberServerUser(u) { writeLS(SERVER_LS, u); }

/* Appelé par startApp une fois le carnet affiché : récupère le serveur et fusionne */
async function initServer() {
  const c = Server.client; if (!c || !Server.user) return;
  Server.on = true; setSync('pending');
  try {
    const docs = await c.from('documents').select('kind,data');
    if (docs.error) throw docs.error;
    const got = {}; (docs.data || []).forEach(d => { got[d.kind] = d.data; });
    const b = got.bibliotheque && !checkBib(got.bibliotheque) ? got.bibliotheque : null;
    const k = got.carnet && !checkCar(got.carnet, b || DATA.base.bib) ? got.carnet : null;
    /* un document modifié hors ligne par un administrateur garde la priorité jusqu'à son envoi */
    if (!('bib' in Server.docs)) writeLS(DATA_LS.bib, b);
    if (!('car' in Server.docs)) writeLS(DATA_LS.car, k);
    pickData();

    const row = await c.from('progression').select('data,updated_at').eq('user_id', Server.user.id).maybeSingle();
    if (row.error) throw row.error;
    const remoteAt = row.data ? Date.parse(row.data.updated_at) : 0;
    if (row.data && remoteAt > (S.savedAt || 0)) {
      const st = progressionToState(row.data.data);
      if (st) { st.savedAt = remoteAt; S = st; saveLocal(); applySettings(); pickData(); }
    } else if (S.savedAt) Server.prog = true;

    const sn = await c.from('sauvegardes').select('id,created_at,label,data').order('created_at', { ascending: false }).limit(SNAP_MAX);
    if (sn.error) throw sn.error;
    const remote = new Set();
    (sn.data || []).forEach(r => {
      remote.add(r.id);
      if (!SNAPS.some(x => x.id === r.id)) SNAPS.push(Object.assign({ id: r.id, at: Date.parse(r.created_at), label: r.label }, r.data || {}));
    });
    SNAPS.forEach(x => { if (!remote.has(x.id)) Server.snaps.add(x.id); });
    storeSnaps();
    render();
    await flushServer();
  } catch (e) {
    setSync('local');
    showToast('Serveur injoignable : tes notes restent sur cet appareil et partiront à la prochaine connexion.');
  }
}

function serverDirty(docId) {
  if (!Server.on) return;
  if (docId.startsWith('snap-')) Server.snaps.add(docId.slice(5)); else Server.prog = true;
  scheduleServer();
}
function serverDocDirty(kind) { if (!Server.on) return; Server.docs[kind] = true; scheduleServer(); }
function scheduleServer(delay) { setSync('pending'); clearTimeout(Server.timer); Server.timer = setTimeout(flushServer, delay || 1200); }

async function flushServer() {
  const c = Server.client; if (!Server.on || !c || Server.busy) return;
  Server.busy = true;
  try {
    for (const kind of Object.keys(Server.docs)) {
      const doc = readLS(DATA_LS[kind]);
      const r = doc ? await c.from('documents').upsert({ kind: DOC_KIND[kind], data: doc, updated_at: new Date().toISOString() })
        : await c.from('documents').delete().eq('kind', DOC_KIND[kind]);
      if (r.error) throw r.error;
      delete Server.docs[kind];
    }
    if (Server.prog) {
      Server.prog = false;
      const r = await c.from('progression').upsert({ user_id: Server.user.id, data: docProgression(), updated_at: new Date(S.savedAt || Date.now()).toISOString() });
      if (r.error) { Server.prog = true; throw r.error; }
    }
    for (const id of [...Server.snaps]) {
      const x = SNAPS.find(z => z.id === id);
      const r = x ? await c.from('sauvegardes').upsert({ id: x.id, user_id: Server.user.id, created_at: new Date(x.at).toISOString(), label: x.label, data: { progression: x.progression, bib: x.bib, car: x.car } })
        : await c.from('sauvegardes').delete().eq('user_id', Server.user.id).eq('id', id);
      if (r.error) throw r.error;
      Server.snaps.delete(id);
    }
    setSync('cloud');
  } catch (e) {
    if (e && (e.code === '42501' || e.status === 401 || e.status === 403)) {
      Server.docs = {}; setSync('local');
      showToast('Le serveur a refusé l’enregistrement (droits insuffisants).');
    } else { setSync('pending'); clearTimeout(Server.timer); Server.timer = setTimeout(flushServer, 8000); }
  } finally { Server.busy = false; }
}
window.addEventListener('online', () => { if (Server.on) scheduleServer(300); });
