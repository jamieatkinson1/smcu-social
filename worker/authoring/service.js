import { OperationalError } from "../core/errors.js";
import { plainText } from "./content.js";
import { resolvedCopy } from "../storage/authoring.js";

const requiresArtwork=record=>record.channels.some(channel=>["Shopify","Instagram","Facebook"].includes(channel))||["Product announcement","Social post","Campaign notice"].includes(record.type);
export function communicationBlockers(record,assets=[],now=()=>new Date()){
 const reasons=[];if(!record.title?.trim())reasons.push("Missing title.");if(!plainText(record.mainContentHtml))reasons.push("Missing written content.");if(!record.campaignId)reasons.push("Missing campaign.");
 if(requiresArtwork(record)){if(!assets.length)reasons.push("Missing artwork.");if(assets.length&&!assets.some(asset=>asset.primary))reasons.push("Missing primary artwork.");if(assets.some(asset=>!asset.altText?.trim()))reasons.push("Missing artwork alt text.")}
 const copy=resolvedCopy(record);if(record.channels.includes("Shopify")&&!copy.shopifyHtml.trim())reasons.push("Missing Shopify copy.");if(record.channels.includes("Instagram")&&!copy.instagram.trim())reasons.push("Missing Instagram caption.");if(record.channels.includes("Facebook")&&!copy.facebook.trim())reasons.push("Missing Facebook caption.");
 if(record.status==="Scheduled"&&(!record.publicationDate||Number.isNaN(Date.parse(record.publicationDate))||Date.parse(record.publicationDate)<=now().getTime()))reasons.push("Invalid schedule.");return reasons
}
export class AuthoringService{
 constructor({store,assets,clock=()=>new Date()}){Object.assign(this,{store,assets,clock})}
 async snapshot(){const snapshot=await this.store.snapshot();const communications=await Promise.all(snapshot.communications.map(async record=>{const artwork=await this.assets.list(record.id);const blockers=communicationBlockers(record,artwork,this.clock);return {...record,readiness:{ready:!blockers.length,blockers},assetCount:artwork.length}}));const byId=new Map(communications.map(c=>[c.id,c]));return {campaigns:snapshot.campaigns.map(c=>({...c,progress:this.progress(c),linkedCommunications:c.communications.map(id=>byId.get(id)).filter(Boolean)})),communications}}
 progress(campaign){const total=campaign.tasks.length,completed=campaign.tasks.filter(item=>item.completed).length;return {total,completed,percentage:total?Math.round(completed/total*100):0}}
 async preview(id){const record=await this.store.getCommunication(id);if(!record)throw new OperationalError("COMMUNICATION_NOT_FOUND","Communication was not found.",{status:404});const assets=await this.assets.list(id),copy=resolvedCopy(record);return {communication:record,copy,assets:assets.map(a=>({id:a.id,url:a.url,altText:a.altText,primary:a.primary,order:a.order})),readiness:{ready:!communicationBlockers(record,assets,this.clock).length,blockers:communicationBlockers(record,assets,this.clock)}}}
 async markReady(id,version){const record=await this.store.getCommunication(id);if(!record)throw new OperationalError("COMMUNICATION_NOT_FOUND","Communication was not found.",{status:404});const assets=await this.assets.list(id),blockers=communicationBlockers(record,assets,this.clock);if(blockers.length)throw new OperationalError("NOT_READY","Communication is not ready.",{status:409,recovery:blockers.join(" ")});return this.store.updateCommunication(id,{...record,version,status:"Ready"},{allowReady:true})}
}
