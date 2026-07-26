const NOT_CONFIGURED = Object.freeze({ status: "Not configured" });
const capabilities = (...items) => Object.freeze(items);

export const shopifyPublishingAdapter = Object.freeze({
  name: "shopify",
  capabilities: capabilities("publishMedia", "publishCommunication"),
  async status() { return NOT_CONFIGURED; },
  async publish(_payload, _environment) { throw new Error("Shopify publishing is not configured."); }
});

export const bufferSchedulingAdapter = Object.freeze({
  name: "buffer",
  capabilities: capabilities("schedule", "cancel", "status"),
  async status() { return NOT_CONFIGURED; },
  async schedule(_payload, _environment) { throw new Error("Buffer scheduling is not configured."); },
  async cancel(_publicationId, _environment) { throw new Error("Buffer scheduling is not configured."); }
});

function statusAdapter(name, capability) {
  return Object.freeze({ name, capabilities: capabilities(capability), async status() { return NOT_CONFIGURED; } });
}

export const instagramStatusAdapter = statusAdapter("instagram", "publicationStatus");
export const facebookStatusAdapter = statusAdapter("facebook", "publicationStatus");
export const analyticsStatusAdapter = statusAdapter("analytics", "publicationMetrics");
