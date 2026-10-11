/* Carnet On Air : connexion simple pour la version publiée sur un site.
   Les comptes viennent de auth/utilisateurs.json, intégré à la construction (AUTH_USERS) :
   mot de passe en PBKDF2-SHA256, jamais en clair. Une connexion réussie pose un cookie de
   session (effacé à la fermeture du navigateur). C'est un contrôle côté navigateur : il
   filtre l'accès à l'écran mais ne protège pas les fichiers publiés avec la page. */
const AUTH = { user: null, cookie: 'onair_session' };
const authEnabled = () => serverConfigured() || (typeof AUTH_USERS !== 'undefined' && AUTH_USERS && Array.isArray(AUTH_USERS.users));
const userName = () => { const l = (AUTH.user && AUTH.user.login) || ''; const pr = typeof SUPA_CONFIG !== 'undefined' && SUPA_CONFIG && SUPA_CONFIG.prenoms; if (pr && pr[l.toLowerCase()]) return pr[l.toLowerCase()]; const n = l.includes('@') ? l.split('@')[0] : l; return n.charAt(0).toUpperCase() + n.slice(1); };
const isAdmin = () => !authEnabled() || (AUTH.user && AUTH.user.role === 'admin');

function readSessionCookie() {
  const m = document.cookie.split('; ').find(c => c.startsWith(AUTH.cookie + '='));
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(m.slice(AUTH.cookie.length + 1))); } catch (e) { return null; }
}
function writeSessionCookie(v) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = v ? `${AUTH.cookie}=${encodeURIComponent(JSON.stringify(v))}; Path=/; SameSite=Strict${secure}`
    : `${AUTH.cookie}=; Path=/; Max-Age=0; SameSite=Strict${secure}`;
}
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function checkPassword(u, pw) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(u.salt), iterations: u.iterations }, key, 256);
  const a = b64(bits), b = u.hash; let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function viewLogin(msg) {
  document.getElementById('app').innerHTML = `<div class="login"><form class="card stack" id="login-form" autocomplete="on">
    <h1 style="margin:0;display:flex;align-items:center;gap:.5rem">${LOGO}Carnet On Air</h1>
    <p class="small muted" style="margin:0">Connecte-toi pour ouvrir ton carnet.</p>
    <label class="fld">Identifiant<input id="login-user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
    <label class="fld">Mot de passe<input id="login-pw" name="password" type="password" autocomplete="current-password" required></label>
    ${msg ? `<p class="small" style="margin:0;color:var(--danger)" role="alert">${esc(msg)}</p>` : ''}
    <button class="btn primary" type="submit" id="login-go">Se connecter</button>
  </form></div>`;
  document.getElementById('login-form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const login = document.getElementById('login-user').value.trim().toLowerCase(), pw = document.getElementById('login-pw').value;
    const btn = document.getElementById('login-go'); btn.disabled = true; btn.textContent = 'Vérification…';
    if (serverConfigured()) {
      const c = serverClient(); if (!c) return viewLogin('Le serveur ne répond pas. Vérifie ta connexion internet.');
      const email = loginToEmail(login); if (!email) { await new Promise(r => setTimeout(r, 600)); return viewLogin('Identifiant ou mot de passe incorrect.'); }
      const { data, error } = await c.auth.signInWithPassword({ email, password: pw });
      if (error || !data || !data.user) {
        const m = (error && (error.code || error.message)) || '';
        return viewLogin(/fetch|network/i.test(m) ? 'Le serveur ne répond pas. Vérifie ta connexion internet.'
          : /not_confirmed|not confirmed/i.test(m) ? 'Ce compte n’est pas encore confirmé dans Supabase (Authentication > Users).'
          : /rate|too many|429/i.test(m + ' ' + ((error && error.status) || '')) ? 'Trop de tentatives : attends quelques minutes avant de réessayer.'
          : /invalid_credentials|invalid login/i.test(m) ? 'Identifiant ou mot de passe incorrect.'
          : 'Connexion refusée par le serveur (' + m + ').');
      }
      return serverSignedIn(c, data.user);
    }
    const u = AUTH_USERS.users.find(x => x.login.toLowerCase() === login);
    let ok = false;
    try { ok = !!u && await checkPassword(u, pw); } catch (e) { return viewLogin('La vérification est impossible dans ce navigateur (page non sécurisée).'); }
    if (!ok) { await new Promise(r => setTimeout(r, 600)); return viewLogin('Identifiant ou mot de passe incorrect.'); }
    AUTH.user = { login: u.login, role: u.role }; writeSessionCookie({ u: u.login, t: b64(crypto.getRandomValues(new Uint8Array(16))) });
    startApp();
  });
  setTimeout(() => { const f = document.getElementById('login-user'); if (f) f.focus(); }, 0);
}
async function serverSignedIn(c, user) {
  const role = await serverRole(c, user.id);
  /* autre compte que le dernier connecté sur cet appareil : on efface ses notes locales
     pour qu'elles ne partent jamais dans la progression du nouveau compte */
  const last = readLS(SERVER_LS);
  if (last && last.id !== user.id) {
    [LS_KEY, DATA_LS.snaps].forEach(k => writeLS(k, null));
    rememberServerUser({ id: user.id, email: user.email, login: loginOf(user.email), role });
    return location.reload();
  }
  Server.user = { id: user.id, email: user.email };
  AUTH.user = { login: loginOf(user.email), role, server: true };
  rememberServerUser({ id: user.id, email: user.email, login: AUTH.user.login, role });
  startApp();
}
async function logout() {
  if (Server.client) {
    try { await flushServer(); await Server.client.auth.signOut(); } catch (e) {}
    /* les données vivent sur le serveur : on ne laisse pas de copie sur un appareil après déconnexion */
    [LS_KEY, DATA_LS.bib, DATA_LS.car, DATA_LS.snaps, SERVER_LS].forEach(k => writeLS(k, null));
  }
  writeSessionCookie(null); AUTH.user = null; location.reload();
}
/* Point d'entrée : ouvre le carnet directement, ou l'écran de connexion */
async function authGate() {
  if (!authEnabled()) return startApp();
  if (serverConfigured()) {
    const c = serverClient();
    if (!c) {
      /* bibliothèque Supabase non chargée (pas de réseau) : on rouvre le dernier compte connecté sur ses données locales */
      const last = readLS(SERVER_LS);
      if (last) { AUTH.user = { login: last.login, role: last.role, server: true }; startApp(); showToast('Hors ligne : tes notes seront envoyées au serveur au retour du réseau (recharge la page).'); return; }
      return viewLogin('Le serveur ne répond pas. Vérifie ta connexion internet.');
    }
    let session = null;
    try { session = (await c.auth.getSession()).data.session; } catch (e) { session = null; }
    if (session && session.user) return serverSignedIn(c, session.user);
    return viewLogin();
  }
  const c = readSessionCookie(); const u = c && AUTH_USERS.users.find(x => x.login === c.u);
  if (u) { AUTH.user = { login: u.login, role: u.role }; return startApp(); }
  viewLogin();
}
