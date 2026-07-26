import { verifyAccessIdentity, assertRequestSecurity, responseHeaders, redact } from "./security.js";
import { OperationalError, safeError } from "./errors.js";
import { D1PublicationStore } from "../storage/publications.js";
import { D1AssetMetadataStore } from "../storage/assets.js";
import { R2ArtworkStore } from "../storage/artwork.js";
import { AssetManager } from "../assets/manager.js";
import { ShopifyAdapter } from "../adapters/shopify.js";
import { BufferAdapter } from "../adapters/buffer.js";
import { PublishingOrchestrator } from "./orchestrator.js";
import { D1AuthoringStore, mergeAuthoringRepository } from "../storage/authoring.js";
import { AuthoringService } from "../authoring/service.js";
const json=(value,status=200,extra={})=>new Response(JSON.stringify(value),{status,headers:{...responseHeaders,...extra}});
const parseJson=async request=>{if(!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json"))throw new OperationalError("UNSUPPORTED_MEDIA_TYPE","Send JSON requests only.",{status:415});const text=await request.text();if(text.length>20000)throw new OperationalError("REQUEST_TOO_LARGE","The request is too large.",{status:413});try{return JSON.parse(text)}catch{throw new OperationalError("INVALID_JSON","The request is not valid JSON.")}};
const parseForm=async request=>{const type=request.headers.get("Content-Type")||"";if(!type.toLowerCase().startsWith("multipart/form-data"))throw new OperationalError("UNSUPPORTED_MEDIA_TYPE","Upload artwork using multipart form data.",{status:415});const length=Number(request.headers.get("Content-Length")||0);if(length>11*1024*1024)throw new OperationalError("REQUEST_TOO_LARGE","The upload exceeds the 10 MB image limit.",{status:413});return request.formData()};
const makeAssets=(env,repository)=>new AssetManager({repository,metadata:new D1AssetMetadataStore(env.PUBLICATIONS_DB),objects:new R2ArtworkStore(env.ARTWORK_BUCKET)});
async function handleAssets(request,path,url,manager){
 if(request.method==="GET"&&path==="assets"){const communicationId=url.searchParams.get("communicationId");return json({assets:await manager.list(communicationId)})}
 const match=path.match(/^assets\/(AST-(?:\d{3}|[A-F0-9]{12}))(?:\/(replace))?$/);
 if(request.method==="GET"&&match&&!match[2])return json({asset:await manager.get(match[1])});
 if(request.method==="POST"&&path==="assets/upload"){const form=await parseForm(request);const result=await manager.upload({communicationId:String(form.get("communicationId")||""),file:form.get("file"),altText:String(form.get("altText")||"")});return json(result,result.duplicate?200:201)}
 if(request.method==="PATCH"&&match&&!match[2])return json({asset:await manager.update(match[1],await parseJson(request))});
 if(request.method==="POST"&&match?.[2]){const form=await parseForm(request);return json(await manager.replace(match[1],{file:form.get("file"),confirmPublished:form.get("confirmPublished")==="true"}))}
 if(request.method==="DELETE"&&match&&!match[2])return json(await manager.remove(match[1],{confirmPublished:url.searchParams.get("confirmPublished")==="true"}));
 if(request.method==="POST"&&path==="assets/primary"){const body=await parseJson(request);return json({assets:await manager.setPrimary(body.communicationId,body.assetId)})}
 if(request.method==="POST"&&path==="assets/reorder"){const body=await parseJson(request);return json({assets:await manager.reorder(body.communicationId,body.assetIds)})}
 throw new OperationalError("NOT_FOUND","The artwork endpoint was not found.",{status:404,recovery:"Return to the communication."});
}
export async function handleApi(request,env,repository,{fetchImpl=fetch,store,shopify,buffer,assetManager}={}){const correlationId=request.headers.get("X-Correlation-ID")?.match(/^[a-zA-Z0-9-]{8,80}$/)?.[0]||crypto.randomUUID();try{assertRequestSecurity(request,["GET","POST","PATCH","DELETE"]);await verifyAccessIdentity(request,env,{fetchImpl});const url=new URL(request.url);const path=url.pathname.replace(/^\/communications\/api\/?/,"");
 let authoringStore=null,effectiveRepository=repository;if(env.PUBLICATIONS_DB?.prepare){authoringStore=new D1AuthoringStore(env.PUBLICATIONS_DB);try{effectiveRepository=mergeAuthoringRepository(repository,await authoringStore.snapshot())}catch(error){if(path==="authoring"||path.startsWith("campaigns")||path.startsWith("communications"))throw error}}
 const shopifyAdapter=shopify||new ShopifyAdapter(env,{fetchImpl,dryRun:env.INTEGRATION_DRY_RUN==="true"});const bufferAdapter=buffer||new BufferAdapter(env,{fetchImpl,dryRun:env.INTEGRATION_DRY_RUN==="true"});
 if(request.method==="GET"&&path==="health"){const check=async adapter=>{try{return await adapter.health()}catch(e){const safe=safeError(e);return {status:"not configured",code:safe.code,message:safe.recovery}}};const [shopifyHealth,bufferHealth]=await Promise.all([check(shopifyAdapter),check(bufferAdapter)]);return json({status:"protected",storage:Boolean(env.PUBLICATIONS_DB)?"configured":"not configured",artwork:Boolean(env.ARTWORK_BUCKET)?"configured":"not configured",shopify:shopifyHealth,buffer:bufferHealth,checkedAt:new Date().toISOString()})}
 const assets=assetManager||makeAssets(env,effectiveRepository);const authoring=authoringStore?new AuthoringService({store:authoringStore,assets}):null;
 if(request.method==="GET"&&path==="authoring")return json(await authoring.snapshot());
 const campaignMatch=path.match(/^campaigns(?:\/(CMP-\d{3,})(?:\/(duplicate))?)?$/),communicationMatch=path.match(/^communications(?:\/(CN-\d{3,})(?:\/(duplicate|ready|preview))?)?$/);
 if(campaignMatch){const [,id,action]=campaignMatch;if(request.method==="GET"&&!id)return json({campaigns:(await authoring.snapshot()).campaigns});if(request.method==="GET"&&id&&!action)return json({campaign:await authoringStore.getCampaign(id)});if(request.method==="POST"&&!id)return json({campaign:await authoringStore.createCampaign(await parseJson(request))},201);if(request.method==="PATCH"&&id&&!action)return json({campaign:await authoringStore.updateCampaign(id,await parseJson(request))});if(request.method==="POST"&&action==="duplicate")return json({campaign:await authoringStore.duplicateCampaign(id)},201);if(request.method==="DELETE"&&id&&!action)return json(await authoringStore.deleteCampaign(id));}
 if(communicationMatch){const [,id,action]=communicationMatch;if(request.method==="GET"&&!id)return json({communications:(await authoring.snapshot()).communications});if(request.method==="GET"&&id&&!action)return json({communication:await authoringStore.getCommunication(id)});if(request.method==="GET"&&id&&action==="preview")return json(await authoring.preview(id));if(request.method==="POST"&&!id)return json({communication:await authoringStore.createCommunication(await parseJson(request))},201);if(request.method==="PATCH"&&id&&!action)return json({communication:await authoringStore.updateCommunication(id,await parseJson(request))});if(request.method==="POST"&&action==="duplicate")return json({communication:await authoringStore.duplicateCommunication(id)},201);if(request.method==="POST"&&action==="ready"){const body=await parseJson(request);return json({communication:await authoring.markReady(id,body.version)})}if(request.method==="DELETE"&&id&&!action)return json(await authoringStore.deleteCommunication(id));}
 if(path==="assets"||path.startsWith("assets/"))return handleAssets(request,path,url,assets);
 const publicationStore=store||new D1PublicationStore(env.PUBLICATIONS_DB);const orchestrator=new PublishingOrchestrator({repository:effectiveRepository,store:publicationStore,shopify:shopifyAdapter,buffer:bufferAdapter,assetResolver:id=>assets.list(id)});
 if(request.method==="GET"&&path==="publications"){const id=url.searchParams.get("communicationId");if(!/^[A-Z]{2}-\d{3}$/.test(id||""))throw new OperationalError("INVALID_COMMUNICATION","Choose a valid communication.");return json({results:await publicationStore.list(id)})}
 if(request.method==="POST"&&path==="publish/preview")return json(await orchestrator.preview(await parseJson(request)));
 if(request.method==="POST"&&path==="publish/confirm")return json(await orchestrator.execute(await parseJson(request),{correlationId}),202);
 if(request.method==="POST"&&path==="publish/retry")return json(await orchestrator.execute(await parseJson(request),{correlationId,retryFailed:true}),202);
 throw new OperationalError("NOT_FOUND","The endpoint was not found.",{status:404,recovery:"Return to the Communications Desk."});
 }catch(error){const safe=safeError(error);console.error(JSON.stringify(redact({level:"error",correlationId,code:safe.code,path:new URL(request.url).pathname})));return json({error:safe,correlationId},safe.status||500,{"Allow":"GET, POST, PATCH, DELETE"})}}
