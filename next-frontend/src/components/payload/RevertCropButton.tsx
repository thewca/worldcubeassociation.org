"use client";

import React, { useState } from "react";
import { Button, useDocumentInfo, useConfig, toast } from "@payloadcms/ui";
import { useRouter } from "next/navigation";

// Rendered as a `ui` field on the Media collection. Calls the custom
// `revert-original` endpoint, which re-uploads the pristine original stored in
// `media-originals` and clears the crop/focal point. Cropping in Payload is
// destructive (it overwrites the stored file), so this is the only way back to
// the uncropped image.
export const RevertCropButton: React.FC = () => {
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // No document yet (create view) — nothing to revert.
  if (!id) return null;

  const apiRoute = config.routes.api; // e.g. "/api/payload"

  const handleRevert = async () => {
    if (
      !window.confirm(
        "Revert to the original, uncropped image? This discards the current crop.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiRoute}/media/${id}/revert-original`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? "Failed to revert image.");
      }

      toast.success("Reverted to the original image.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revert image.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button buttonStyle="secondary" onClick={handleRevert} disabled={loading}>
      {loading ? "Reverting…" : "Revert to original image"}
    </Button>
  );
};

export default RevertCropButton;
