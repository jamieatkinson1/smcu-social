import repository from "../../../communications/data/repository.json" with { type: "json" };
import { handleApi } from "../../../worker/core/handler.js";
export function onRequest(context){return handleApi(context.request,context.env,repository);}