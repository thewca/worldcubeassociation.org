import { auth, signOut } from "@/auth";

export async function sessionOrSignIn() {
  const session = await auth();
  if (session?.error === "RefreshTokenError") {
    // Refresh failed (revoked / expired / race outside the Doorkeeper grace
    // window). Drop the session so the user is forced through a fresh login
    // rather than continuing with a stale access_token.
    await signOut();
  }
  return session;
}
