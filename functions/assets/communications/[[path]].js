import { handlePublicAsset } from "../../../worker/assets/public.js";
export function onRequest(context){return handlePublicAsset(context.request,context.env);}