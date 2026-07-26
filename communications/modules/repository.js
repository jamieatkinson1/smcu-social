import { validateCampaigns } from "./campaigns.js";
import { validateAssets } from "./assets.js";

const VALID_STATUSES = ["Draft", "In progress", "Review", "Ready", "Approved", "Scheduled", "Published", "Archived"];
const REQUIRED_FIELDS = ["id", "title", "department", "documentType", "author", "status", "createdDate", "modifiedDate", "summary", "tags", "assets", "shopify", "buffer", "analytics", "history", "checklist", "notes", "workflow", "campaignId"];

let database;

export async function loadRepository(dataUrl) {
  if (database) return database;
  const response = await fetch(dataUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Repository database unavailable (${response.status})`);
  const candidate = await response.json();
  validateRepository(candidate);
  database = deepFreeze(candidate);
  return database;
}

export function validateRepository(candidate) {
  if (!candidate || !Array.isArray(candidate.sections) || !Array.isArray(candidate.documents)) throw new Error("Invalid repository database structure");
  const ids = new Set();
  candidate.documents.forEach((document) => {
    const missing = REQUIRED_FIELDS.filter((field) => document[field] === undefined);
    if (missing.length) throw new Error(`${document.id || "Unknown record"} is missing: ${missing.join(", ")}`);
    if (ids.has(document.id)) throw new Error(`Duplicate document ID: ${document.id}`);
    if (!VALID_STATUSES.includes(document.status)) throw new Error(`Unsupported status for ${document.id}: ${document.status}`);
    if (!candidate.sections.some((section) => section.slug === document.section)) throw new Error(`Unknown section for ${document.id}: ${document.section}`);
    ids.add(document.id);
  });
  validateCampaigns(candidate);
  validateAssets(candidate);
  return true;
}

export function getSection(repository, slug) { return repository.sections.find((section) => section.slug === slug); }
export function getDocument(repository, id) { return repository.documents.find((document) => document.id.toLowerCase() === String(id).toLowerCase()); }
export function getDocumentsForSection(repository, slug) { return repository.documents.filter((document) => document.section === slug); }
export function getFilterOptions(documents) {
  const unique = (field) => [...new Set(documents.map((document) => document[field]).filter(Boolean))].sort();
  return { departments: unique("department"), statuses: VALID_STATUSES, types: unique("documentType"), years: [...new Set(documents.map((document) => (document.publishDate || document.createdDate || "").slice(0, 4)).filter(Boolean))].sort().reverse() };
}
export function filterDocuments(documents, filters = {}) {
  const term = (filters.query || "").trim().toLowerCase();
  return documents.filter((document) => {
    const searchable = [document.id, document.title, document.summary, document.author, ...(document.tags || [])].join(" ").toLowerCase();
    const year = (document.publishDate || document.createdDate || "").slice(0, 4);
    return (!term || searchable.includes(term)) && (!filters.department || document.department === filters.department) && (!filters.status || document.status === filters.status) && (!filters.type || document.documentType === filters.type) && (!filters.year || year === filters.year);
  });
}
export function sectionCounts(repository) {
  return Object.fromEntries(repository.sections.map((section) => [section.slug, getDocumentsForSection(repository, section.slug).length]));
}
function deepFreeze(value) { Object.freeze(value); Object.values(value).forEach((item) => { if (item && typeof item === "object" && !Object.isFrozen(item)) deepFreeze(item); }); return value; }
