import type { InstrumentationOnRequestError } from "next/dist/server/instrumentation/types";

export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production"
  ) {
    await import("newrelic");
  }
}

export async function onRequestError(
  // The error type is currently declared indirectly so we are overwriting it for now
  err: { digest: string } & Error,
  request: Parameters<InstrumentationOnRequestError>[1],
  context: Parameters<InstrumentationOnRequestError>[2],
) {
  console.error("[SSR Error]", {
    ...err,
    ...request,
    ...context,
  });

  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production"
  ) {
    const newrelic = (await import("newrelic")).default;
    newrelic.noticeError(err, {
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
      routerKind: context.routerKind,
    });
  }
}
