import { verifyAccessIdentity, assertRequestSecurity, responseHeaders, redact } from "./security.js";
import { OperationalError, safeError } from "./errors.js";
import { D1PublicationStore } from "../storage/publications.js";
import { ShopifyAdapter } from "../adapters/shopify.js";
import { BufferAdapter } from "../adapters/buffer.js";
import { PublishingOrchestrator } from "./orchestrator.js";
const json=(value,status=200,extra={})=>new Response(JSON.stringify(value),{status,headers:{...responseHeaders,...extra}});
const parseBody=async request=>{if(!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json"))throw new OperationalError("UNSUPPORTED_MEDIA_TYPE","Send JSON requests only.",{status:415});const text=await request.text();if(text.length>20000)throw new OperationalError("REQUEST_TOO_LARGE","The publishing request is too large.",{status:413});try{return JSON.parse(text)}catch{throw new OperationalError("INVALID_JSON","The publishing request is not valid JSON.")}};
export async function handleApi(request,env,repository,{fetchImpl=fetch,store,shopify,buffer}={}){const correlationId=request.headers.get("X-Correlation-ID")?.match(/^[a-zA-Z0-9-]{8,80}$/)?.[0]||crypto.randomUUID();try{assertRequestSecurity(request);await verifyAccessIdentity(request,env,{fetchImpl});const url=new URL(request.url);const path=url.pathname.replace(/^\/communications\/api\/?/,"");const publicationStore=store||new D1PublicationStore(env.PUBLICATIONS_DB);const shopifyAdapter=shopify||new ShopifyAdapter(env,{fetchImpl,dryRun:env.INTEGRATION_DRY_RUN==="true"});const bufferAdapter=buffer||new BufferAdapter(env,{fetchImpl,dryRun:env.INTEGRATION_DRY_RUN==="true"});const orchestrator=new PublishingOrchestrator({repository,store:publicationStore,shopify:shopifyAdapter,buffer:bufferAdapter});
 if(request.method==="GET"&&path==="health"){const check=async adapter=>{try{return await adapter.health()}catch(e){const safe=safeError(e);return {status:"not configured",code:safe.code,message:safe.recovery}}};const [shopifyHealth,bufferHealth]=await Promise.all([check(shopifyAdapter),check(bufferAdapter)]);return json({status:"protected",storage:Boolean(env.PUBLICATIONS_DB)?"configured":"not configured",shopify:shopifyHealth,buffer:bufferHealth,checkedAt:new Date().toISOString()});}
 if(request.method==="GET"&&path==="publications"){const id=url.searchParams.get("communicationId");if(!/^[A-Z]{2}-\d{3}$/.test(id||""))throw new OperationalError("INVALID_COMMUNICATION","Choose a valid communication.");return json({results:await publicationStore.list(id)});}
 if(request.method==="POST"&&path==="publish/preview")return json(await orchestrator.preview(await parseBody(request)));
 if(request.method==="POST"&&path==="publish/confirm")return json(await orchestrator.execute(await parseBody(request),{correlationId}),202);
 if(request.method==="POST"&&path==="publish/retry")return json(await orchestrator.execute(await parseBody(request),{correlationId,retryFailed:true}),202);
 throw new OperationalError("NOT_FOUND","The endpoint was not found.",{status:404,recovery:"Return to the Communications Desk."});
 }catch(error){const safe=safeError(error);console.error(JSON.stringify(redact({level:"error",correlationId,code:safe.code,path:new URL(request.url).pathname})));return json({error:safe,correlationId},safe.status||500,{"Allow":"GET, POST"});}}

