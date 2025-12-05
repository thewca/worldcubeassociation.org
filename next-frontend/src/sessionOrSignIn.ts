import { auth, signIn } from "@/auth";

export async function sessionOrSignIn() {
  const session = await auth();
  if (session?.error === "RefreshTokenError") {
    await signIn(); // Force sign in to get a new set of access and refresh tokens
  }
  return session;
}
