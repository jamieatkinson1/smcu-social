/** Worker-side boundary. Implementations must validate Access identity before creating UI context. */
export const cloudflareAccessAdapter = Object.freeze({
  name: "cloudflare-access",
  capabilities: Object.freeze(["identity", "session", "logout"]),
  async authenticateRequest(_request, _environment) { throw new Error("Cloudflare Access is not configured."); },
  async createSessionContext(_identity) { throw new Error("Cloudflare Access is not configured."); },
  async destroySession(_sessionId, _environment) { throw new Error("Cloudflare Access is not configured."); }
});
