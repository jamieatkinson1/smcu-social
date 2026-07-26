# Worker interfaces

Version 1.1 server-side contracts only. They contain no credentials and make no network calls.

Cloudflare Access must authenticate every `/communications/*` request before it reaches the static application. The browser reads only the managed Access identity response; it never receives the authorization cookie value or Access headers. A future Worker may implement publishing adapters using secrets held only in Worker environment bindings. Browser modules must never receive service credentials.