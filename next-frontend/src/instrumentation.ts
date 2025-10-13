export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production"
  ) {
    await import("newrelic");
  }
}
