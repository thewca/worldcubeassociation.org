"use client";

import React, { useState } from "react";
import { Button } from "@payloadcms/ui";
import { signInToCms } from "@/payload.auth.client";

/**
 * Replaces the plugin's bundled login view. Its social buttons come from the keys of Better
 * Auth's `socialProviders` config, and `genericOAuth` providers are deliberately excluded from
 * that list, so there is no way to offer the WCA provider through it.
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
