import { NextResponse, type NextRequest } from "next/server";
import { applySetCookies, getSessionCookie } from "better-auth/cookies";
import { auth } from "@/auth";
import { WCA_APP_NAME } from "@/auth.config";

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
