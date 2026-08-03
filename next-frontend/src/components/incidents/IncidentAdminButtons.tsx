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
          description: t("incidents_log.admin.destroy_error"),
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
        title={t(
          confirming === "destroy"
            ? "incidents_log.admin.destroy_title"
            : "incidents_log.admin.change_status",
        )}
        onCancel={() => setConfirming(null)}
        onConfirm={handleConfirm}
        cancelButton={t("incidents_log.admin.cancel")}
        confirmButton={t(
          confirming === "destroy"
            ? "incidents_log.admin.destroy"
            : "incidents_log.admin.confirm",
        )}
      >
        <Text>
          {t(
            confirming === "destroy"
              ? "incidents_log.admin.confirm_destroy"
              : resolved
                ? "incidents_log.admin.confirm_unpublish"
                : "incidents_log.admin.confirm_publish",
          )}
        </Text>
      </ConfirmDialog>

      <Toaster />
    </>
  );
}
