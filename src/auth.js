/* Carnet On Air : connexion simple pour la version publiée sur un site.
   Les comptes viennent de auth/utilisateurs.json, intégré à la construction (AUTH_USERS) :
   mot de passe en PBKDF2-SHA256, jamais en clair. Une connexion réussie pose un cookie de
   session (effacé à la fermeture du navigateur). C'est un contrôle côté navigateur : il
   filtre l'accès à l'écran mais ne protège pas les fichiers publiés avec la page. */
const AUTH = { user: null, cookie: 'onair_session' };
const authEnabled = () => typeof AUTH_USERS !== 'undefined' && AUTH_USERS && Array.isArray(AUTH_USERS.users);
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
    <h1 style="margin:0">Carnet On Air</h1>
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
    const u = AUTH_USERS.users.find(x => x.login.toLowerCase() === login);
    let ok = false;
    try { ok = !!u && await checkPassword(u, pw); } catch (e) { return viewLogin('La vérification est impossible dans ce navigateur (page non sécurisée).'); }
    if (!ok) { await new Promise(r => setTimeout(r, 600)); return viewLogin('Identifiant ou mot de passe incorrect.'); }
    AUTH.user = { login: u.login, role: u.role }; writeSessionCookie({ u: u.login, t: b64(crypto.getRandomValues(new Uint8Array(16))) });
    startApp();
  });
  setTimeout(() => { const f = document.getElementById('login-user'); if (f) f.focus(); }, 0);
}
function logout() { writeSessionCookie(null); AUTH.user = null; location.reload(); }
/* Point d'entrée : ouvre le carnet directement, ou l'écran de connexion */
function authGate() {
  if (!authEnabled()) return startApp();
  const c = readSessionCookie(); const u = c && AUTH_USERS.users.find(x => x.login === c.u);
  if (u) { AUTH.user = { login: u.login, role: u.role }; return startApp(); }
  viewLogin();
}
