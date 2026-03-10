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
import { useCallback, useState } from "react";
import { LiveCompetitor, LiveResult } from "@/types/live";
import { route } from "nextjs-routes";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";

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

  const { handleRegistrationIdChange, clearCompetitorsResults, isPendingQuit } =
    useResultsAdmin();

  function handleEditClick() {
    handleRegistrationIdChange(competitor.id);
    setIsOpen(false);
  }
  function handleClearClick() {
    clearCompetitorsResults(competitor.id);
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
                    disabled={isPendingQuit}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Item value="results" asChild disabled={isPendingQuit}>
                    <Link
                      href={route({
                        pathname:
                          "/competitions/[competitionId]/live/competitors/[registrationId]",
                        query: {
                          competitionId: competitionId,
                          registrationId: competitor.id.toString(),
                        },
                      })}
                    >
                      Results
                    </Link>
                  </Menu.Item>
                  {result.attempts.length > 0 ? (
                    <Menu.Item
                      value="clear"
                      onClick={handleClearClick}
                      disabled={isPendingQuit}
                    >
                      Clear
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      value="quit"
                      onClick={() => setIsQuitting(true)}
                      disabled={isPendingQuit}
                    >
                      Quit
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

  const { quitCompetitor, isPendingQuit } = useResultsAdmin();

  const onQuitClick = useCallback(() => {
    quitCompetitor(
      competitor.id,
      toAdvance!.map((r) => r.id),
    );
    setMenuClose();
  }, [competitor.id, quitCompetitor, setMenuClose, toAdvance]);

  if (!toAdvance) {
    return <Text>Failed to fetch next Competitor</Text>;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Dialog.Root open onOpenChange={() => setMenuClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Quit Competitor</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                The next competitor to advance is{" "}
                {toAdvance.map((competitor) => competitor.name)}
                <Checkbox.Root
                  checked={advanceNext}
                  onCheckedChange={(e) => setAdvanceNext(!!e.checked)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>Advance next competitor</Checkbox.Label>
                </Checkbox.Root>
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button disabled={isPendingQuit} onClick={onQuitClick}>
                Quit Competitor from Round
              </Button>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
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
