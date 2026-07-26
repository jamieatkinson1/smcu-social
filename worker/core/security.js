import { OperationalError } from "./errors.js";
const encoder = new TextEncoder();
const decode = (value) => { value = value.replace(/-/g,"+").replace(/_/g,"/"); while(value.length%4)value+="="; return Uint8Array.from(atob(value),c=>c.charCodeAt(0)); };
const jsonPart = (part) => JSON.parse(new TextDecoder().decode(decode(part)));
const audiences = (aud) => Array.isArray(aud) ? aud : [aud];
export async function verifyAccessIdentity(request, env, { fetchImpl = fetch, now = () => Date.now() } = {}) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN?.replace(/\/$/,"");
  const expectedAudience = env.CF_ACCESS_AUD;
  const adminEmail = env.SMCU_ADMIN_EMAIL?.trim().toLowerCase();
  if (!token || !teamDomain || !expectedAudience || !adminEmail) throw new OperationalError("UNAUTHORISED", "Authentication is required.", {status:401,recovery:"Sign in through Cloudflare Access."});
  const parts=token.split("."); if(parts.length!==3) throw new OperationalError("INVALID_IDENTITY","The Access session is invalid.",{status:401,recovery:"Sign in again."});
  let header,payload; try { header=jsonPart(parts[0]); payload=jsonPart(parts[1]); } catch { throw new OperationalError("INVALID_IDENTITY","The Access session is invalid.",{status:401,recovery:"Sign in again."}); }
  if(header.alg!=="RS256" || !header.kid) throw new OperationalError("INVALID_IDENTITY","The Access session is invalid.",{status:401,recovery:"Sign in again."});
  const keysResponse=await fetchImpl(`${teamDomain}/cdn-cgi/access/certs`,{headers:{Accept:"application/json"}});
  if(!keysResponse.ok) throw new OperationalError("IDENTITY_UNAVAILABLE","Identity verification is temporarily unavailable.",{status:503,retryable:true,recovery:"Try again shortly."});
  const jwks=await keysResponse.json(); const jwk=jwks.keys?.find(key=>key.kid===header.kid);
  if(!jwk) throw new OperationalError("INVALID_IDENTITY","The Access session is invalid.",{status:401,recovery:"Sign in again."});
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode(parts[2]),encoder.encode(`${parts[0]}.${parts[1]}`));
  const seconds=Math.floor(now()/1000); const issuer=`${teamDomain}`;
  if(!valid || payload.iss!==issuer || !audiences(payload.aud).includes(expectedAudience) || !payload.exp || payload.exp<=seconds || (payload.nbf && payload.nbf>seconds) || payload.email?.toLowerCase()!==adminEmail)
    throw new OperationalError("UNAUTHORISED","This identity is not authorised.",{status:403,recovery:"Sign in with Jamie’s authorised account."});
  return Object.freeze({name:"Jamie",emailVerified:true,expiresAt:payload.exp});
}
export function assertRequestSecurity(request, methods = ["GET","POST"]) {
  if(!methods.includes(request.method)) throw new OperationalError("METHOD_NOT_ALLOWED","This request method is not allowed.",{status:405,recovery:"Return to the Desk and try again."});
  const origin=request.headers.get("Origin"); if(origin && origin!==new URL(request.url).origin) throw new OperationalError("ORIGIN_DENIED","This request origin is not allowed.",{status:403,recovery:"Open the Communications Desk directly."});
}
export const responseHeaders = Object.freeze({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY"});
export const redact = (value) => JSON.parse(JSON.stringify(value,(key,item)=>/(token|secret|authorization|cookie|email)/i.test(key)?"[REDACTED]":item));
