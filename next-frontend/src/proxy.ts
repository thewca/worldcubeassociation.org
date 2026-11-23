import { NextResponse, type NextRequest } from "next/server";
import { applySetCookies, getSessionCookie } from "better-auth/cookies";
import { auth } from "@/auth";
import { WCA_APP_NAME } from "@/auth.config";
import { resolveLanguage } from "@/lib/i18n/resolveLanguage";
import { storageKey } from "@/lib/i18n/settings";

/**
 * Load-bearing, not a leftover. Reading the session rotates the Rails access token, and
 * Doorkeeper lets a refresh token be spent only once. Next.js allows cookie writes in middleware
 * but not in server components, so rotating during a render would drop the new tokens and replay
 * the spent one until the session broke.
 *
 * Better Auth's own guidance is that middleware should only check for a cookie optimistically,
 * which covers authorization but not rotating an upstream token that server components read.
 */
export async function proxy(request: NextRequest) {
  // Most traffic on a public site is signed out, and there is nothing to rotate for it.
  if (!getSessionCookie(request, { cookiePrefix: WCA_APP_NAME })) {
    const isPublishedHomepage =
      request.nextUrl.pathname === "/" &&
      !request.cookies.has("__prerender_bypass") &&
      request.nextUrl.searchParams.get("signed_out") !== "true";

    // Internally rewrite `/` to a locale-specific homepage.
    // This lets us serve prerendered CMS content in the initial HTML sent to
    // the client.
    //
    // With component caching alone, the page reads the language cookie at
    // request time, and streams the localized content behind Suspense. ~10% of
    // the time, this led to React batching that reveal with others, delaying
    // when the content becomes visible by ~300ms.
    // https://react.dev/blog/2025/10/01/react-19-2#batching-suspense-boundaries-for-ssr
    if (isPublishedHomepage) {
      const lng = resolveLanguage(
        request.cookies.get(storageKey)?.value,
        request.headers.get("Accept-Language"),
      );
      const destination = request.nextUrl.clone();
      destination.pathname = `/homepage/${lng}`;
      return NextResponse.rewrite(destination);
    }

    return NextResponse.next();
  }

  const { headers } = await auth.api.getSession({
    headers: request.headers,
    returnHeaders: true,
  });

  const setCookies = headers.getSetCookie();

  if (setCookies.length === 0) {
    return NextResponse.next();
  }

  // Merging into the request headers is what lets the server components rendering this same
  //   request see the rotated cookies, rather than reading the stale ones and rotating again.
  const requestHeaders = new Headers(request.headers);
  applySetCookies(requestHeaders, setCookies);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  for (const setCookie of setCookies) {
    response.headers.append("set-cookie", setCookie);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
