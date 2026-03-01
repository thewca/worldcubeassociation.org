"use client";

import { Link, Menu, Portal, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LiveCompetitor, LiveResult } from "@/types/live";
import { route } from "nextjs-routes";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";

function ResultMenu({
  result,
  competitor,
  competitionId,
}: {
  result: LiveResult;
  competitor: LiveCompetitor;
  competitionId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    handleRegistrationIdChange,
    clearCompetitorsResults,
    quitCompetitor,
    isPendingQuit,
  } = useResultsAdmin();

  function handleEditClick() {
    handleRegistrationIdChange(competitor.id);
    setIsOpen(false);
  }
  function handleClearClick() {
    clearCompetitorsResults(competitor.id);
    setIsOpen(false);
  }
  function handleQuitClick() {
    quitCompetitor(competitor.id);
    setIsOpen(false);
  }

  return (
    <Menu.Root
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      positioning={{
        strategy: "fixed",
        placement: "bottom",
      }}
    >
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {result && (
              <Menu.ItemGroup>
                <Menu.ItemGroupLabel>
                  <Text>{competitor.name}</Text>
                </Menu.ItemGroupLabel>
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
                    onClick={handleQuitClick}
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
  );
}
