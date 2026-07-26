export function getPublishingReadiness(document, repository) {
  const reasons = [];
  if (!document.assets.length || document.workflow.awaitingAssets) reasons.push("Artwork is missing");
  if (document.workflow.needsArtwork) reasons.push("Artwork is not approved");
  if (document.workflow.needsReview || ["Draft", "Review"].includes(document.status)) reasons.push("Communication needs review");
  if (document.status === "Archived") reasons.push("Communication is archived");
  const services = ["shopify", "buffer"].filter((key) => !["Connected", "Configured"].includes(repository.systems[key]?.status));
  if (!["Published", "Scheduled"].includes(document.status)) services.forEach((key) => reasons.push(`${titleCase(key)} is not configured`));
  if (document.status === "Published") return { lane: "published", label: "Published", reasons: [], action: null };
  if (document.status === "Scheduled") return { lane: "scheduled", label: "Scheduled", reasons: [], action: null };
  if (!reasons.length && (document.status === "Approved" || document.workflow.readyToPublish)) return { lane: "ready", label: "Ready", reasons: [], action: "Publish" };
  return { lane: "blocked", label: "Blocked", reasons: reasons.length ? reasons : [`Status is ${document.status}`], action: null };
}
export function getPublishingQueue(repository) {
  const items = repository.documents.map((document) => ({ document, readiness: getPublishingReadiness(document, repository) }));
  return { ready: items.filter((item) => item.readiness.lane === "ready"), blocked: items.filter((item) => item.readiness.lane === "blocked"), scheduled: items.filter((item) => item.readiness.lane === "scheduled"), published: items.filter((item) => item.readiness.lane === "published").sort((a, b) => (b.document.publishDate || "").localeCompare(a.document.publishDate || "")) };
}
function titleCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
