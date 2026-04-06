export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production"
  ) {
    await import("newrelic");
  }
}

export async function onRequestError(
  // These types are from https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation#parameters
  err: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource?:
      | "react-server-components"
      | "react-server-components-payload"
      | "server-rendering";
    revalidateReason?: "on-demand" | "stale" | "build";
    renderType?: "dynamic" | "dynamic-resume";
  },
) {
  console.error("[SSR Error]", {
    message: err.message,
    stack: err.stack,
    digest: err.digest,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  });

  if (process.env.NODE_ENV === "production") {
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
