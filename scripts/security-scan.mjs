import {execFileSync} from "node:child_process";
const history=execFileSync("git",["log","-p","--all","--no-ext-diff"],{encoding:"utf8",maxBuffer:20*1024*1024});
const patterns=[/shpat_[A-Za-z0-9]{20,}/,/shp(?:ca|ss|ua)_[A-Za-z0-9]{20,}/,/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,/Authorization:\s*Bearer\s+[A-Za-z0-9._-]{24,}/,/CF_Authorization=[A-Za-z0-9._-]{24,}/];
if(patterns.some(pattern=>pattern.test(history)))throw new Error("Credential-like material found in Git history.");
console.log("Git history credential-pattern scan passed.");
