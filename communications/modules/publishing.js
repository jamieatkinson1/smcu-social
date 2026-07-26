export function getPublishingReadiness(document, repository, suppliedAssets) {
  const reasons = [], assets=suppliedAssets||document.assets.map(id=>repository.assets.find(asset=>asset.id===id)).filter(Boolean).map((asset,index)=>({...asset,primary:index===0,mimeType:`image/${asset.format?.toLowerCase()}`,width:asset.dimensions?.width,height:asset.dimensions?.height}));
  if (!assets.length || document.workflow.awaitingAssets) reasons.push("Upload at least one artwork image");
  if (assets.length && !assets.some(asset=>asset.primary)) reasons.push("Select primary artwork");
  if (assets.some(asset=>!(asset.altText??asset.alt)?.trim())) reasons.push("Add alt text to every image");
  if (assets.some(asset=>!asset.url||!(asset.width||asset.dimensions?.width)||!(asset.height||asset.dimensions?.height))) reasons.push("Artwork metadata is incomplete");
  if (document.workflow.needsArtwork) reasons.push("Artwork is not approved");
  if (document.workflow.needsReview || ["Draft", "Review"].includes(document.status)) reasons.push("Communication needs review");
  if (document.status === "Archived") reasons.push("Communication is archived");
  const services = ["shopify", "buffer"].filter(key => !["Connected", "Configured"].includes(repository.systems[key]?.status));
  if (!["Published", "Scheduled"].includes(document.status)) services.forEach(key => reasons.push(`${titleCase(key)} is not configured`));
  if (document.status === "Published") return { lane: "published", label: "Published", reasons: [], action: null };
  if (document.status === "Scheduled") return { lane: "scheduled", label: "Scheduled", reasons: [], action: null };
  if (!reasons.length && (document.status === "Approved" || document.workflow.readyToPublish)) return { lane: "ready", label: "Ready", reasons: [], action: "Publish" };
  return { lane: "blocked", label: "Blocked", reasons: reasons.length ? reasons : [`Status is ${document.status}`], action: null };
}
export function getPublishingQueue(repository, assetMap={}) { const items=repository.documents.map(document=>({document,readiness:getPublishingReadiness(document,repository,assetMap[document.id])}));return {ready:items.filter(item=>item.readiness.lane==="ready"),blocked:items.filter(item=>item.readiness.lane==="blocked"),scheduled:items.filter(item=>item.readiness.lane==="scheduled"),published:items.filter(item=>item.readiness.lane==="published").sort((a,b)=>(b.document.publishDate||"").localeCompare(a.document.publishDate||""))}; }
function titleCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
