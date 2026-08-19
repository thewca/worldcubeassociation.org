import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * Load-bearing, not a leftover. Reading the session rotates the Rails access token, and
 * Doorkeeper lets a refresh token be spent only once. Next.js allows cookie writes in middleware
 * but not in server components, so rotating during a render would drop the new tokens and replay
 * the spent one until the session broke.
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

  // Passing `request` is the only way the server components rendering this same request see the
  //   rotated cookies; otherwise they read the stale header and rotate again.
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
