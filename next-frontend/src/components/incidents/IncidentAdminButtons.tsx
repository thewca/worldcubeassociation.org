"use client";

import { Button, ButtonGroup, Link, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/providers/ConfirmProvider";
import { Toaster, toaster } from "@/components/ui/toaster";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";

interface IncidentAdminButtonsProps {
  incidentId: string;
  resolved: boolean;
}

export default function IncidentAdminButtons({
  incidentId,
  resolved,
}: IncidentAdminButtonsProps) {
  const { t } = useT();
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
          id: "incident-mark-as-error",
          description: t(
            resolved
              ? "incidents_log.admin.unpublish_error"
              : "incidents_log.admin.publish_error",
          ),
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
          id: "incident-destroy-error",
          description: t("incidents_log.admin.destroy_error"),
          type: "error",
        }),
    },
  );

  // `useConfirm` would save the state juggling below, but its options carry no title and each of
  // these two actions needs its own.
  const confirmations = {
    publish: {
      title: t("incidents_log.admin.change_status"),
      confirmButton: t("incidents_log.admin.confirm"),
      body: t(
        resolved
          ? "incidents_log.admin.confirm_unpublish"
          : "incidents_log.admin.confirm_publish",
      ),
      onConfirm: () =>
        markAs({
          params: {
            path: {
              incident_id: incidentId,
              kind: resolved ? "unresolve" : "resolved",
            },
          },
        }),
    },
    destroy: {
      title: t("incidents_log.admin.destroy_title"),
      confirmButton: t("incidents_log.admin.destroy"),
      body: t("incidents_log.admin.confirm_destroy"),
      onConfirm: () => destroy({ params: { path: { id: incidentId } } }),
    },
  } as const;

  // Undefined exactly while the dialog is closed, which is also the only time it isn't rendered.
  const confirmation = confirming ? confirmations[confirming] : undefined;

  const handleConfirm = () => {
    confirmation?.onConfirm();
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
          {t(
            resolved
              ? "incidents_log.admin.unpublish"
              : "incidents_log.admin.publish",
          )}
        </Button>
        <Button asChild colorPalette="blue">
          {/* The incident editor still lives in the monolith. */}
          <Link href={`/incidents/${incidentId}/edit`}>
            {t("incidents_log.admin.edit")}
          </Link>
        </Button>
        <Button
          colorPalette="red"
          loading={isDestroying}
          onClick={() => setConfirming("destroy")}
        >
          {t("incidents_log.admin.destroy")}
        </Button>
      </ButtonGroup>

      <ConfirmDialog
        lazyMount
        open={confirming !== null}
        title={confirmation?.title}
        onCancel={() => setConfirming(null)}
        onConfirm={handleConfirm}
        cancelButton={t("incidents_log.admin.cancel")}
        confirmButton={confirmation?.confirmButton}
      >
        <Text>{confirmation?.body}</Text>
      </ConfirmDialog>

      <Toaster />
    </>
  );
}
