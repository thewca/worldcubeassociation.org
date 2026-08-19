"use client";

import React, { useState } from "react";
import { Button } from "@payloadcms/ui";
import { signInToCms } from "@/payload.auth.client";

/**
 * Replaces the plugin's bundled Payload login view.
 *
 * The bundled one offers email/password, passkeys and Better Auth's built-in `socialProviders`.
 * None of those apply here: the only way into the CMS is the `cms`-scoped WCA OIDC provider,
 * which is registered through the `genericOAuth` plugin and so needs `signIn.oauth2`.
 */
export default function CmsLoginView() {
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setIsRedirecting(true);

    const { error: signInError } = await signInToCms();

    if (signInError) {
      setError(signInError.message ?? "Could not start the WCA login.");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="login__form">
      <h1>Sign in to the WCA CMS</h1>
      <p>
        CMS access is granted through your WCA account. You need to be on a team
        that has been given access to Payload.
      </p>
      {error && <p className="login__error">{error}</p>}
      <Button onClick={handleSignIn} disabled={isRedirecting} size="large">
        {isRedirecting ? "Redirecting…" : "Sign in with WCA"}
      </Button>
    </div>
  );
}
