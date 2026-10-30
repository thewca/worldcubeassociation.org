"use client";

import { useState } from "react";
import { Button, toast, useConfig } from "@payloadcms/ui";

export function WeblateSyncButtons() {
  const {
    config: {
      routes: { api },
    },
  } = useConfig();
  const [busy, setBusy] = useState(false);

  const start = async (shouldSeed: boolean) => {
    setBusy(true);
    const res = await fetch(`${api}/weblate-sync`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shouldSeed }),
    }).finally(() => setBusy(false));
    const body = await res.json();
    if (!res.ok) {
      toast.error(
        `Could not start the Weblate sync: ${body.error ?? res.statusText}`,
      );
    } else if (body.started) {
      toast.success(
        shouldSeed ? "Weblate seed started" : "Weblate sync started",
      );
    } else {
      toast.info("A Weblate sync is already running, try again shortly");
    }
  };

  return (
    <div>
      <h2>Weblate</h2>
      <p>
        Content syncs with Weblate after every save. Press Sync now to pull in
        translations finished in Weblate since the last save. Seeding uploads
        translations that already exist in Payload; it is a one-time step, run
        it twice so strings new to Weblate are picked up.
      </p>
      <Button disabled={busy} onClick={() => start(false)}>
        Sync now
      </Button>
      <Button
        buttonStyle="secondary"
        disabled={busy}
        onClick={() => start(true)}
      >
        Seed existing translations
      </Button>
    </div>
  );
}
