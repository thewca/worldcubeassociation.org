"use client";

import { Button, ButtonGroup, Link, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/providers/ConfirmProvider";
import { Toaster, toaster } from "@/components/ui/toaster";
import useAPI from "@/lib/wca/useAPI";

interface IncidentAdminButtonsProps {
  incidentId: string;
  resolved: boolean;
}

export default function IncidentAdminButtons({
  incidentId,
  resolved,
}: IncidentAdminButtonsProps) {
  const api = useAPI();
  const router = useRouter();
  const [confirming, setConfirming] = useState<"publish" | "destroy" | null>(
    null,
  );

  const { mutate: markAs, isPending: isMarking } = api.useMutation(
    "patch",
    "/v0/incidents/{incident_id}/mark_as/{kind}",
    {
      onSuccess: () => router.refresh(),
      onError: () =>
        toaster.create({
          description: `Could not ${resolved ? "unpublish" : "publish"} this incident.`,
          type: "error",
        }),
    },
  );

  const { mutate: destroy, isPending: isDestroying } = api.useMutation(
    "delete",
    "/v0/incidents/{id}",
    {
      onSuccess: () => router.push("/incidents"),
      onError: () =>
        toaster.create({
          description: "Could not delete this incident.",
          type: "error",
        }),
    },
  );

  const handleConfirm = () => {
    if (confirming === "publish") {
      markAs({
        params: {
          path: {
            incident_id: incidentId,
            kind: resolved ? "unresolve" : "resolved",
          },
        },
      });
    } else {
      destroy({ params: { path: { id: incidentId } } });
    }

    setConfirming(null);
  };

  return (
    <>
      <ButtonGroup wrap="wrap">
        <Button
          colorPalette={resolved ? "orange" : "green"}
          loading={isMarking}
          onClick={() => setConfirming("publish")}
        >
          {resolved ? "Unpublish" : "Publish"}
        </Button>
        <Button asChild colorPalette="blue">
          {/* The incident editor still lives in the monolith. */}
          <Link href={`/incidents/${incidentId}/edit`}>Edit</Link>
        </Button>
        <Button
          colorPalette="red"
          loading={isDestroying}
          onClick={() => setConfirming("destroy")}
        >
          Destroy
        </Button>
      </ButtonGroup>

      <ConfirmDialog
        lazyMount
        open={confirming !== null}
        title={confirming === "destroy" ? "Destroy incident" : "Change status"}
        onCancel={() => setConfirming(null)}
        onConfirm={handleConfirm}
        cancelButton="Cancel"
        confirmButton={confirming === "destroy" ? "Destroy" : "Confirm"}
      >
        <Text>
          {confirming === "destroy"
            ? "Are you sure you want to delete this incident?"
            : resolved
              ? "You are about to unpublish this incident log, are you sure?"
              : "You are about to make this incident log public, are you sure?"}
        </Text>
      </ConfirmDialog>

      <Toaster />
    </>
  );
}
