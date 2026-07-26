import { loadRepository, getSection, getDocument, getDocumentsForSection, getFilterOptions, filterDocuments, sectionCounts } from "./repository.js";
import { getCampaign, getCampaignForCommunication, getCampaignCommunications, calculateCampaignProgress, getCampaignNextAction, getCampaignPhase, getCurrentCampaign } from "./campaigns.js";
import { getAsset, getAssetsForCommunication, getAssetUsage, getAssetHealth, getAssetFilterOptions, filterAssets, toRenderableAsset } from "./assets.js";
import { getPublishingReadiness, getPublishingQueue } from "./publishing.js";
import { getRuntimeAuthProvider, isSafeReturnPath } from "./auth.js";
import { integrationApi } from "./integrations.js";
import { escapeHtml, renderShell, renderLogin, renderUnauthorised, renderDashboard, renderCommunications, renderSearchControls, renderRecordList, renderRegister, renderAssetControls, renderAssetCards, renderCommunication, renderCommunicationCampaign, renderCampaigns, renderCampaign, renderPublishing, renderSettings, renderAssetDetail, renderError } from "./ui.js";

const body = document.body;
const mount = document.querySelector("#app");
const base = body.dataset.base || ".";
const page = body.dataset.page || "dashboard";
const params = new URLSearchParams(location.search);
const route = (path) => `${base}/${path}`;
const auth = getRuntimeAuthProvider();
let session;
let repository;
let toastTimer;

start();

async function start() {
  try {
    if (page === "login") return showLogin();
    if (page === "unauthorised") { mount.innerHTML = renderUnauthorised(route); return; }
    session = await auth.getSession();
    if (!session) { location.replace(`${route("login/index.html")}?returnTo=${encodeURIComponent(location.pathname + location.search)}`); return; }
    repository = await loadRepository(`${base}/data/repository.json`);
    const handlers = { dashboard: showDashboard, communications: showCommunications, register: showRegister, document: showCommunication, campaigns: showCampaigns, campaign: showCampaign, publishing: showPublishing, settings: showSettings, asset: showAsset };
    if (!handlers[page]) throw new Error(`Unknown Desk page: ${page}`);
    await handlers[page]();
    bindShell();
  } catch (error) { console.error(error); mount.innerHTML = renderError(error.message); }
}

async function showLogin() {
  const local = auth.id === "local-development";
  const requested = params.get("returnTo") || "/communications/";
  const returnPath = isSafeReturnPath(requested) ? requested : "/communications/";
  if (!local && await auth.getSession()) { location.replace(returnPath); return; }
  mount.innerHTML = renderLogin({ local, returnPath });
  const button = document.querySelector("[data-local-login]");
  if (button) button.addEventListener("click", async () => { await auth.signIn(); location.replace(button.dataset.return); });
}
function showDashboard() {
  document.title = "SMCU Communications Desk";
  const current = getCurrentCampaign(repository);
  const queue = getPublishingQueue(repository);
  const recentPublication = queue.published[0]?.document || null;
  const systems = getSystemStatus(repository).filter((item) => ["repository", "shopify", "buffer", "cloudflareAccess"].includes(item.key));
  const view = { currentCampaign: current, progress: current ? calculateCampaignProgress(current) : null, nextAction: current ? getCampaignNextAction(current) : null, queue, recentPublication, systems };
  mount.innerHTML = renderShell(renderDashboard(view, route), { route, active: "dashboard", session });
}
function showCommunications() {
  document.title = "Communications | SMCU Desk";
  mount.innerHTML = renderShell(renderCommunications(repository, sectionCounts(repository), getAssetHealth(repository)), { route, active: "communications", session });
  bindCommunicationBrowser(repository.documents);
  bindAssetBrowser();
  if (params.get("view") === "assets") document.querySelector("[data-artwork-drawer]").open = true;
}
function showRegister() {
  const section = getSection(repository, body.dataset.section || params.get("section"));
  if (!section) throw new Error("Register not found");
  const documents = getDocumentsForSection(repository, section.slug);
  mount.innerHTML = renderShell(renderRegister(section, documents, documentHref), { route, active: "communications", session, breadcrumbs: [{ label: "Communications", href: route("communications/index.html") }, { label: section.title }] });
}
function showCommunication() {
  const document = getDocument(repository, body.dataset.document || params.get("id"));
  if (!document) throw new Error("Communication not found");
  const resolved = { ...document, assets: getAssetsForCommunication(document, repository).map(toRenderableAsset) };
  const campaign = getCampaignForCommunication(repository, document);
  const context = campaign ? renderCommunicationCampaign(campaign, calculateCampaignProgress(campaign), getCampaignPhase(campaign), route) : "";
  mount.innerHTML = renderShell(renderCommunication(resolved, context, getPublishingReadiness(document, repository), route), { route, active: "communications", session, breadcrumbs: [{ label: "Communications", href: route("communications/index.html") }, { label: document.id }] });
  bindAssetActions(resolved.assets);
}
function showCampaigns() {
  const views = repository.campaigns.map(campaignView);
  mount.innerHTML = renderShell(renderCampaigns(views, route), { route, active: "campaigns", session });
}
function showCampaign() {
  const campaign = getCampaign(repository, params.get("id"));
  if (!campaign) throw new Error("Campaign not found");
  mount.innerHTML = renderShell(renderCampaign(campaignView(campaign), route), { route, active: "campaigns", session, breadcrumbs: [{ label: "Campaigns", href: route("campaigns/index.html") }, { label: campaign.id }] });
}
async function showPublishing() { const runtimeRepository = await repositoryWithLiveSystems(); mount.innerHTML = renderShell(renderPublishing(getPublishingQueue(runtimeRepository), route), { route, active: "publishing", session }); bindPublishing(); }
async function showSettings() { mount.innerHTML = renderShell(renderSettings(getSystemStatus(repository), session, auth), { route, active: "settings", session }); await refreshIntegrationStatus(); }
function showAsset() {
  const asset = getAsset(repository, params.get("id"));
  if (!asset) throw new Error("Asset not found");
  mount.innerHTML = renderShell(renderAssetDetail(asset, getAssetUsage(asset, repository), route), { route, active: "communications", session, breadcrumbs: [{ label: "Communications", href: route("communications/index.html?view=assets") }, { label: asset.id }] });
  bindAssetActions([toRenderableAsset(asset)]);
}
function campaignView(campaign) { return { campaign, progress: calculateCampaignProgress(campaign), nextAction: getCampaignNextAction(campaign), communications: getCampaignCommunications(campaign, repository) }; }
function documentHref(document) { return route(`document/index.html?id=${encodeURIComponent(document.id)}`); }

function bindCommunicationBrowser(documents) {
  const mountPoint = document.querySelector("[data-search-mount]");
  mountPoint.innerHTML = renderSearchControls(getFilterOptions(documents), "communications");
  const form = mountPoint.querySelector("form"), results = document.querySelector("[data-results]"), count = document.querySelector("[data-results-summary]");
  const update = () => { const filtered = filterDocuments(documents, Object.fromEntries(new FormData(form).entries())); results.innerHTML = renderRecordList(filtered, documentHref); count.textContent = `${filtered.length} of ${documents.length}`; };
  form.addEventListener("input", update); form.addEventListener("change", update); form.addEventListener("reset", () => setTimeout(update)); update();
}
function bindAssetBrowser() {
  const controls = document.querySelector("[data-asset-controls]"); controls.innerHTML = renderAssetControls(getAssetFilterOptions(repository));
  const form = controls.querySelector("form"), results = document.querySelector("[data-asset-results]"), count = document.querySelector("[data-asset-summary]");
  const update = () => { const filtered = filterAssets(repository.assets, repository, Object.fromEntries(new FormData(form).entries())); results.innerHTML = renderAssetCards(filtered.map((asset) => ({ asset, usage: getAssetUsage(asset, repository) })), route); count.textContent = `${filtered.length} of ${repository.assets.length}`; bindCopyUrls(results); };
  form.addEventListener("input", update); form.addEventListener("change", update); form.addEventListener("reset", () => setTimeout(update)); controls.querySelector("[data-copy-library]").addEventListener("click", () => copyText(repository.assets.map((asset) => absolute(asset.url)).join("\n"), "Asset URLs copied")); update();
}
async function repositoryWithLiveSystems() { try { const health=await integrationApi.health(); const connected=(state)=>state?.status==="connected"; const copy=structuredClone(repository); copy.systems.shopify={status:connected(health.shopify)?"Connected":"Not configured",note:health.shopify?.message||"Publishing connection verified"}; copy.systems.buffer={status:connected(health.buffer)?"Connected":"Not configured",note:health.buffer?.message||"Scheduling connection verified"}; return copy; } catch { return repository; } }
async function refreshIntegrationStatus() { try { const health = await integrationApi.health(); const rows = document.querySelectorAll(".service-list>div"); const labels = { Shopify: health.shopify, Buffer: health.buffer, Instagram: health.buffer?.channels?.find((c) => String(c.service).toLowerCase()==="instagram"), Facebook: health.buffer?.channels?.find((c) => String(c.service).toLowerCase()==="facebook") }; rows.forEach((row) => { const label=row.querySelector("strong")?.textContent; const state=labels[label]; if(!state)return; const ok=state.status==="connected"||state.connected===true; row.querySelector(".service-state")?.classList.toggle("connected",ok); row.querySelector(".service-state")?.classList.toggle("disconnected",!ok); row.querySelector(":scope>span:nth-of-type(2)").textContent=ok?"Connected":"Not configured"; row.querySelector("small").textContent=ok?(state.name||"Connection verified"):state.message||"Connection required"; }); } catch { notify("Connection status unavailable"); } }
function bindPublishing() { const dialog=document.querySelector(".publish-dialog"); if(!dialog)return; let current=null; const action=dialog.querySelector("[name=action]"); const schedule=dialog.querySelector("[data-schedule]"); const result=dialog.querySelector("[data-publish-result]"); action.addEventListener("change",()=>{schedule.hidden=action.value!=="schedule"}); document.querySelectorAll("[data-publish]").forEach(button=>button.addEventListener("click",()=>{current={communicationId:button.dataset.publish,modifiedDate:button.dataset.modified};dialog.querySelector("[data-publish-summary]").textContent=`${button.dataset.publish} - ${button.dataset.title}`;result.replaceChildren();dialog.showModal()})); dialog.querySelector("[data-confirm-publish]").addEventListener("click",async(event)=>{const destinations=[...dialog.querySelectorAll("[name=destination]:checked")].map(x=>x.value);const scheduledValue=dialog.querySelector("[name=scheduledTime]").value;const payload={...current,destinations,action:action.value,scheduledTime:action.value==="schedule"&&scheduledValue?new Date(scheduledValue).toISOString():null};const button=event.currentTarget;button.disabled=true;result.textContent="Checking publishing readiness...";try{const preview=await integrationApi.preview(payload);if(!preview.ready)throw Object.assign(new Error(preview.reasons.join(" ")),{details:{recovery:"Resolve the listed blockers."}});const exact=preview.destinations.join(", ");if(!window.confirm(`Publish ${preview.communication.id} to ${exact}?`)){result.textContent="Publication cancelled.";return}result.textContent="Publishing...";const response=await integrationApi.confirm({...payload,confirmed:true});result.innerHTML=response.results.map(item=>`<p><strong>${escapeHtml(item.destination)}</strong>: ${escapeHtml(item.status)}${item.recovery?` - ${escapeHtml(item.recovery)}`:""}</p>`).join("");}catch(error){result.textContent=`${error.message} ${error.details?.recovery||""}`.trim()}finally{button.disabled=false}}); }
function bindAssetActions(assets) {
  bindCopyUrls(document);
  document.querySelectorAll("[data-copy-markdown]").forEach((button) => button.addEventListener("click", () => copyText(`![${button.dataset.alt}](${absolute(button.dataset.copyMarkdown)})`, "Markdown copied")));
  document.querySelectorAll("[data-copy-html]").forEach((button) => button.addEventListener("click", () => copyText(`<img src="${escapeHtml(absolute(button.dataset.copyHtml))}" alt="${escapeHtml(button.dataset.alt)}">`, "HTML copied")));
  document.querySelector("[data-copy-all]")?.addEventListener("click", () => copyText(assets.map((asset) => absolute(asset.url)).join("\n"), "Asset URLs copied"));
  const dialog = document.querySelector("dialog"); if (!dialog) return; const image = dialog.querySelector("img"); document.querySelectorAll("[data-preview]").forEach((button) => button.addEventListener("click", () => { image.src = button.dataset.preview; image.alt = button.dataset.alt; dialog.showModal(); })); dialog.querySelector("button").addEventListener("click", () => dialog.close()); dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}
function bindCopyUrls(scope) { scope.querySelectorAll("[data-copy-url]").forEach((button) => button.addEventListener("click", () => copyText(absolute(button.dataset.copyUrl), "Asset URL copied"))); }
function bindShell() { document.querySelector("[data-logout]")?.addEventListener("click", async () => { const destination = await auth.signOut(); location.assign(destination || route("login/index.html")); }); }
function absolute(path) { return new URL(path, location.origin).href; }
async function copyText(text, message) { try { await navigator.clipboard.writeText(text); } catch { const field = document.createElement("textarea"); field.value = text; document.body.append(field); field.select(); document.execCommand("copy"); field.remove(); } notify(message); }
function notify(message) { const toast = document.querySelector(".toast"); if (!toast) return; toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2200); }
function getSystemStatus(repository) {
  return Object.entries(repository.systems).map(([key, value]) => ({
    key,
    label: key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase()),
    ...value
  }));
}
