const SESSION_KEY = "smcu.desk.session.v1";
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function createLocalAuthProvider({ storage, cryptoApi, now = () => Date.now() }) {
  return {
    id: "local-development",
    label: "Local development",
    available: true,
    async getSession() {
      const value = storage.getItem(SESSION_KEY);
      if (!value) return null;
      try {
        const session = JSON.parse(value);
        if (session.provider !== this.id || session.expiresAt <= now()) { storage.removeItem(SESSION_KEY); return null; }
        return session;
      } catch { storage.removeItem(SESSION_KEY); return null; }
    },
    async signIn() {
      const issuedAt = now();
      const session = { id: cryptoApi.randomUUID(), provider: this.id, operator: { id: "jamie", name: "Jamie" }, issuedAt, expiresAt: issuedAt + SESSION_LIFETIME_MS };
      storage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    },
    async signOut() { storage.removeItem(SESSION_KEY); return null; }
  };
}

export function createEdgeAuthProvider({ fetchApi, identityUrl = "/cdn-cgi/access/get-identity", logoutUrl = "/cdn-cgi/access/logout" }) {
  return {
    id: "cloudflare-access",
    label: "Cloudflare Access",
    available: true,
    async getSession() {
      try {
        const response = await fetchApi(identityUrl, { cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json" } });
        if (!response.ok) return null;
        const identity = await response.json();
        if (!identity?.email || !identity?.user_uuid) return null;
        return { id: identity.user_uuid, provider: this.id, operator: { id: "jamie", name: "Jamie" }, issuedAt: Number.isFinite(identity.iat) ? identity.iat * 1000 : null, expiresAt: null };
      } catch { return null; }
    },
    async signIn() { return null; },
    async signOut() { return logoutUrl; }
  };
}

export function getRuntimeAuthProvider(location = window.location, runtime = window) {
  if (LOCAL_HOSTS.has(location.hostname)) return createLocalAuthProvider({ storage: runtime.sessionStorage, cryptoApi: runtime.crypto });
  return createEdgeAuthProvider({ fetchApi: runtime.fetch.bind(runtime) });
}
export function isSafeReturnPath(value) { return typeof value === "string" && value.startsWith("/communications/") && !value.startsWith("//") && !value.includes("\\"); }
export { SESSION_KEY, SESSION_LIFETIME_MS };
