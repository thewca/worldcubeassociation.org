import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * Touches the session on every page navigation.
 *
 * This is load-bearing, not a leftover. Reading the session runs our `customSession` callback,
 * which rotates the Rails access token once it is close to expiring — and Doorkeeper only lets
 * a refresh token be spent once. Next.js allows cookie writes in middleware but *not* in server
 * components, so if the rotation happened during a page render the new tokens would be computed,
 * dropped, and the spent refresh token replayed on the next request until the session broke.
 * Doing it here means the rotated cookies are both sent to the browser and threaded back into
 * the request, so server components further down render against the fresh token.
 */
export async function proxy(request: NextRequest) {
  const { headers } = await auth.api.getSession({
    headers: request.headers,
    returnHeaders: true,
  });

  const setCookies = headers.getSetCookie();

  if (setCookies.length === 0) {
    return NextResponse.next();
  }

  // `NextResponse.next({ request })` is the only way to make the rotated cookies visible to
  //   the server components rendering this same request; without it they would keep reading
  //   the stale `cookie` header and rotate all over again.
  const requestCookies = new Map(
    (request.headers.get("cookie") ?? "")
      .split(";")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const separator = pair.indexOf("=");
        return [pair.slice(0, separator), pair.slice(separator + 1)] as const;
      }),
  );

  for (const setCookie of setCookies) {
    const [nameValue] = setCookie.split(";");
    const separator = nameValue.indexOf("=");
    requestCookies.set(
      nameValue.slice(0, separator).trim(),
      nameValue.slice(separator + 1),
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "cookie",
    Array.from(requestCookies, ([name, value]) => `${name}=${value}`).join(
      "; ",
    ),
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  for (const setCookie of setCookies) {
    response.headers.append("set-cookie", setCookie);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
