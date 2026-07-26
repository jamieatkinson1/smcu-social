import repository from "../communications/data/repository.json" with { type: "json" };
import { handlePublicAsset } from "./assets/public.js";
import { handleApi } from "./core/handler.js";

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/communications/api" || path.startsWith("/communications/api/")) {
      return handleApi(request, env, repository);
    }
    if (path.startsWith("/assets/communications/")) {
      return handlePublicAsset(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
