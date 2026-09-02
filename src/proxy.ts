import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Note: this file was called `middleware.ts` prior to Next.js 16 — it's now
// `proxy.ts`, same request/response signature.
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except API routes, Next.js internals, and files
  // with an extension (images, fonts, favicon, ...).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
