export const cloudflareWorkerAdapter = Object.freeze({
  name: "cloudflare-worker",
  capabilities: Object.freeze(["authenticate", "publish", "schedule", "status"]),
  async health() { return Object.freeze({ status: "Not configured" }); }
});
