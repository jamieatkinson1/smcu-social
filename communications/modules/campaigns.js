const CAMPAIGN_STATUSES = ["Planning", "In Progress", "Ready", "Publishing", "Complete", "Archived"];
const CAMPAIGN_FIELDS = ["id", "title", "description", "status", "owner", "created", "modified", "startDate", "targetPublishDate", "endDate", "priority", "notes", "tags", "communications", "assets", "calendar", "shopify", "buffer", "instagram", "facebook", "analytics", "progress", "history", "checklist"];
const PHASES = { research: "Research", planning: "Planning", write: "Content", artwork: "Artwork", review: "Review", assets: "Asset preparation", buffer: "Scheduling", shopify: "Publishing", verify: "Verification", archive: "Closeout" };

export function validateCampaigns(repository) {
  if (!Array.isArray(repository.campaigns)) throw new Error("Campaign database is missing");
  const campaignIds = new Set();
  const linkedDocuments = new Map();
  const documentIds = new Set(repository.documents.map((document) => document.id));
  repository.campaigns.forEach((campaign) => {
    const missing = CAMPAIGN_FIELDS.filter((field) => campaign[field] === undefined);
    if (missing.length) throw new Error(`${campaign.id || "Unknown campaign"} is missing: ${missing.join(", ")}`);
    if (campaignIds.has(campaign.id)) throw new Error(`Duplicate campaign ID: ${campaign.id}`);
    if (!CAMPAIGN_STATUSES.includes(campaign.status)) throw new Error(`Unsupported campaign status for ${campaign.id}: ${campaign.status}`);
    if (campaign.progress.source !== "checklist") throw new Error(`${campaign.id} progress must derive from checklist`);
    const checklistIds = new Set();
    campaign.checklist.forEach((item) => { if (checklistIds.has(item.id)) throw new Error(`Duplicate checklist item in ${campaign.id}: ${item.id}`); checklistIds.add(item.id); });
    campaign.communications.forEach((documentId) => {
      if (!documentIds.has(documentId)) throw new Error(`${campaign.id} references unknown communication: ${documentId}`);
      if (linkedDocuments.has(documentId)) throw new Error(`${documentId} belongs to more than one campaign`);
      linkedDocuments.set(documentId, campaign.id);
    });
    campaignIds.add(campaign.id);
  });
  repository.documents.forEach((document) => {
    if (document.campaignId && !campaignIds.has(document.campaignId)) throw new Error(`${document.id} references unknown campaign: ${document.campaignId}`);
    if ((document.campaignId || null) !== (linkedDocuments.get(document.id) || null)) throw new Error(`Campaign linkage mismatch for ${document.id}`);
  });
  return true;
}

export function getCampaign(repository, id) { return repository.campaigns.find((campaign) => campaign.id.toLowerCase() === String(id).toLowerCase()); }
export function getCampaignForCommunication(repository, communication) { return communication.campaignId ? getCampaign(repository, communication.campaignId) : null; }
export function getCampaignCommunications(campaign, repository) { const ids = new Set(campaign.communications); return repository.documents.filter((document) => ids.has(document.id)); }
export function calculateCampaignProgress(campaign) { const total = campaign.checklist.length; const completed = campaign.checklist.filter((item) => item.completed).length; return { completed, total, percentage: total ? Math.round((completed / total) * 100) : 0 }; }
export function getCampaignNextAction(campaign) { return campaign.checklist.find((item) => !item.completed) || null; }
export function getCampaignPhase(campaign) { const next = getCampaignNextAction(campaign); return next ? (PHASES[next.id] || next.label) : (campaign.status === "Archived" ? "Archived" : "Complete"); }

export function getCurrentCampaign(repository) {
  const active = repository.campaigns.filter((campaign) => !["Complete", "Archived"].includes(campaign.status));
  return active.find((campaign) => ["In Progress", "Ready", "Publishing"].includes(campaign.status))
    || active.find((campaign) => campaign.status === "Planning")
    || null;
}
