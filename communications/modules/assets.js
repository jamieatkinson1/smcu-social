const ASSET_STATUSES = ["Concept", "In Design", "Awaiting Export", "Approved", "Published", "Archived"];
const ASSET_FIELDS = ["id", "filename", "title", "description", "type", "category", "created", "modified", "dimensions", "orientation", "format", "size", "altText", "status", "url", "communication", "campaign", "tags", "usage", "history", "notes", "shopify", "buffer", "analytics", "illustrator", "embroidery", "social"];

export function validateAssets(repository) {
  if (!Array.isArray(repository.assets)) throw new Error("Asset database is missing");
  const assetIds = new Set();
  const documentIds = new Set(repository.documents.map((document) => document.id));
  const campaignIds = new Set(repository.campaigns.map((campaign) => campaign.id));
  repository.assets.forEach((asset) => {
    const missing = ASSET_FIELDS.filter((field) => asset[field] === undefined);
    if (missing.length) throw new Error(`${asset.id || "Unknown asset"} is missing: ${missing.join(", ")}`);
    if (assetIds.has(asset.id)) throw new Error(`Duplicate asset ID: ${asset.id}`);
    if (!ASSET_STATUSES.includes(asset.status)) throw new Error(`Unsupported asset status for ${asset.id}: ${asset.status}`);
    if (asset.communication && !documentIds.has(asset.communication)) throw new Error(`${asset.id} references unknown communication: ${asset.communication}`);
    if (asset.campaign && !campaignIds.has(asset.campaign)) throw new Error(`${asset.id} references unknown campaign: ${asset.campaign}`);
    if (!asset.dimensions || !Number.isFinite(asset.dimensions.width) || !Number.isFinite(asset.dimensions.height)) throw new Error(`Invalid dimensions for ${asset.id}`);
    assetIds.add(asset.id);
  });
  repository.documents.forEach((document) => {
    const seen = new Set();
    document.assets.forEach((assetId) => {
      if (!assetIds.has(assetId)) throw new Error(`${document.id} references unknown asset: ${assetId}`);
      if (seen.has(assetId)) throw new Error(`${document.id} contains duplicate asset reference: ${assetId}`);
      seen.add(assetId);
    });
  });
  repository.campaigns.forEach((campaign) => campaign.assets.forEach((assetId) => { if (!assetIds.has(assetId)) throw new Error(`${campaign.id} references unknown campaign asset: ${assetId}`); }));
  repository.assets.forEach((asset) => {
    const communications = getCommunicationsUsingAsset(asset, repository);
    if (asset.communication && !communications.some((document) => document.id === asset.communication)) throw new Error(`${asset.id} primary communication does not reference it`);
    const campaigns = getCampaignsUsingAsset(asset, repository);
    if (asset.campaign && !campaigns.some((campaign) => campaign.id === asset.campaign)) throw new Error(`${asset.id} campaign relationship is not derived from usage`);
  });
  return true;
}

export function getAsset(repository, id) { return repository.assets.find((asset) => asset.id.toLowerCase() === String(id).toLowerCase()); }
export function getAssetsForCommunication(communication, repository) { const ids = new Set(communication.assets); return repository.assets.filter((asset) => ids.has(asset.id)); }
function getCommunicationsUsingAsset(asset, repository) { return repository.documents.filter((document) => document.assets.includes(asset.id)); }
function getCampaignsUsingAsset(asset, repository) { const communicationIds = new Set(getCommunicationsUsingAsset(asset, repository).map((document) => document.id)); return repository.campaigns.filter((campaign) => campaign.assets.includes(asset.id) || campaign.communications.some((id) => communicationIds.has(id))); }
export function getAssetUsage(asset, repository) { const communications = getCommunicationsUsingAsset(asset, repository); const campaigns = getCampaignsUsingAsset(asset, repository); return { communications, campaigns, count: communications.length + campaigns.length, duplicate: communications.length > 1, unused: communications.length === 0 && campaigns.length === 0 }; }

function getMissingAssets(repository) {
  const communicationItems = repository.documents.filter((document) => (document.workflow.awaitingAssets || document.workflow.needsArtwork) && document.assets.length === 0).map((document) => ({ kind: "communication", id: document.id, title: document.title, reason: document.workflow.needsArtwork ? "Needs artwork" : "Awaiting assets" }));
  const campaignItems = repository.campaigns.filter((campaign) => { const assetStep = campaign.checklist.find((item) => item.id === "assets"); return assetStep && !assetStep.completed && getAssetsForCampaign(campaign, repository).length === 0; }).map((campaign) => ({ kind: "campaign", id: campaign.id, title: campaign.title, reason: "Campaign assets required" }));
  return [...communicationItems, ...campaignItems];
}
function getAssetsForCampaign(campaign, repository) { const ids = new Set(campaign.assets); campaign.communications.forEach((documentId) => { const document = repository.documents.find((item) => item.id === documentId); document?.assets.forEach((assetId) => ids.add(assetId)); }); return repository.assets.filter((asset) => ids.has(asset.id)); }

export function getAssetHealth(repository) {
  return { total: repository.assets.length, needsArtwork: getMissingAssets(repository).length };
}

export function getAssetFilterOptions(repository) { const unique = (field) => [...new Set(repository.assets.map((asset) => asset[field]).filter(Boolean))].sort(); return { statuses: ASSET_STATUSES, campaigns: repository.campaigns.map((campaign) => ({ value: campaign.id, label: `${campaign.id} · ${campaign.title}` })), communications: repository.documents.map((document) => ({ value: document.id, label: `${document.id} · ${document.title}` })), categories: unique("category"), orientations: unique("orientation"), formats: unique("format") }; }
export function filterAssets(assets, repository, filters = {}) {
  const term = (filters.query || "").trim().toLowerCase();
  return assets.filter((asset) => {
    const communication = repository.documents.find((item) => item.id === asset.communication);
    const campaign = repository.campaigns.find((item) => item.id === asset.campaign);
    const searchable = [asset.filename, asset.title, asset.status, asset.communication, communication?.title, asset.campaign, campaign?.title, ...asset.tags].filter(Boolean).join(" ").toLowerCase();
    const usage = getAssetUsage(asset, repository);
    return (!term || searchable.includes(term)) && (!filters.status || asset.status === filters.status) && (!filters.campaign || usage.campaigns.some((item) => item.id === filters.campaign)) && (!filters.communication || usage.communications.some((item) => item.id === filters.communication)) && (!filters.category || asset.category === filters.category) && (!filters.orientation || asset.orientation === filters.orientation) && (!filters.format || asset.format === filters.format);
  });
}
export function toRenderableAsset(asset) { return { ...asset, label: asset.title, alt: asset.altText, width: asset.dimensions.width, height: asset.dimensions.height, mediaType: `image/${asset.format.toLowerCase()}` }; }
