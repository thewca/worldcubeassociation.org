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

  const start = async (seed: boolean) => {
    setBusy(true);
    try {
      const res = await fetch(`${api}/weblate-sync?seed=${seed}`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      if (body.started) {
        toast.success(seed ? "Weblate seed started" : "Weblate sync started");
      } else {
        toast.info("A Weblate sync is already running, try again shortly");
      }
    } catch (error) {
      toast.error(`Could not start the Weblate sync: ${String(error)}`);
    } finally {
      setBusy(false);
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
