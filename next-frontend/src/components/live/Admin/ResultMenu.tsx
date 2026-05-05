"use client";

import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Link,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { LiveCompetitor, LiveResult } from "@/types/live";
import { route } from "nextjs-routes";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import { useT } from "@/lib/i18n/useI18n";
import { useConfirm } from "@/providers/ConfirmProvider";

export default function ResultMenu({
  result,
  competitor,
  competitionId,
  roundId,
}: {
  result: LiveResult;
  competitor: LiveCompetitor;
  competitionId: string;
  roundId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const confirm = useConfirm();
  const { t } = useT();

  const { handleRegistrationIdChange, clearCompetitorsResults, isPending } =
    useResultsAdmin();

  function handleEditClick() {
    handleRegistrationIdChange(competitor.id);
    setIsOpen(false);
  }
  function handleClearClick() {
    confirm({ confirmButton: t("competitions.live.admin.clear") }).then(() =>
      clearCompetitorsResults(competitor.id),
    );
    setIsOpen(false);
  }
  function setMenuClose() {
    setIsQuitting(false);
    setIsOpen(false);
  }

  return (
    <>
      {isQuitting && (
        <QuitModal
          setMenuClose={setMenuClose}
          competitor={competitor}
          roundId={roundId}
          competitionId={competitionId}
        />
      )}
      <Menu.Root open={isOpen} onOpenChange={({ open }) => setIsOpen(open)}>
        <Menu.Trigger asChild>
          <Button variant="outline" size="sm">
            {competitor.registrant_id}
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              {result && (
                <Menu.ItemGroup>
                  <Menu.Item
                    value="edit"
                    onClick={handleEditClick}
                    disabled={isPending}
                  >
                    {t("competitions.live.admin.edit")}
                  </Menu.Item>
                  <Menu.Item value="results" asChild disabled={isPending}>
                    <Link
                      href={route({
                        pathname:
                          "/competitions/[competitionId]/live/competitors/[registrationId]",
                        query: {
                          competitionId: competitionId,
                          registrationId: competitor.id.toString(),
                        },
                      })}
                      fontWeight="normal"
                    >
                      {t("competitions.live.admin.results")}
                    </Link>
                  </Menu.Item>
                  {result.attempts.length > 0 ? (
                    <Menu.Item
                      value="clear"
                      onClick={handleClearClick}
                      disabled={isPending}
                    >
                      {t("competitions.live.admin.clear")}
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      value="quit"
                      onClick={() => setIsQuitting(true)}
                      disabled={isPending}
                    >
                      {t("competitions.live.admin.quit.quit_menu")}
                    </Menu.Item>
                  )}
                </Menu.ItemGroup>
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </>
  );
}

function QuitModal({
  setMenuClose,
  competitor,
  roundId,
  competitionId,
}: {
  setMenuClose: () => void;
  competitor: LiveCompetitor;
  roundId: string;
  competitionId: string;
}) {
  const [advanceNext, setAdvanceNext] = useState(false);

  const api = useAPI();

  const { t } = useT();

  const { isLoading, data: toAdvance } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/next_if_quit",
    {
      params: {
        path: { competitionId, roundId },
        query: { registration_id: competitor.id },
      },
    },
  );

  const { quitCompetitor, isPending } = useResultsAdmin();

  if (isLoading) {
    return <Loading />;
  }

  if (!toAdvance) {
    return <Text>{t("competitions.live.admin.quit.failed_to_fetch")}</Text>;
  }

  const onQuitClick = () => {
    quitCompetitor(competitor.id, advanceNext, toAdvance);
    setMenuClose();
  };

  return (
    <Dialog.Root open onOpenChange={() => setMenuClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {t("competitions.live.admin.quit.title")}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {toAdvance.length > 0 ? (
                <>
                  <Text>
                    {t("competitions.live.admin.quit.next_to_advance", {
                      competitors: toAdvance
                        .map((competitor) => competitor.name)
                        .join(", "),
                      count: toAdvance.length,
                    })}
                  </Text>
                  <Checkbox.Root
                    checked={advanceNext}
                    onCheckedChange={(e) => setAdvanceNext(!!e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>
                      {t("competitions.live.admin.quit.advance")}
                    </Checkbox.Label>
                  </Checkbox.Root>
                </>
              ) : (
                <Text>{t("competitions.live.admin.quit.no_next")}</Text>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button disabled={isPending} onClick={onQuitClick}>
                {t("competitions.live.admin.quit.quit_confirm")}
              </Button>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">
                  {t("competitions.live.admin.quit.cancel")}
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
