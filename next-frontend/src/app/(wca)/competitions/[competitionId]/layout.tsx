import { Container, Separator, Tabs } from "@chakra-ui/react";
import Link from "next/link";
import { route } from "nextjs-routes";

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  return (
    <Container minW="80vw" p="8">
      <Tabs.Root
        variant="enclosed"
        w="100%"
        defaultValue="general"
        orientation="vertical"
        lazyMount
        unmountOnExit
      >
        <Tabs.List height="fit-content" position="sticky" top="3">
          <Link
            href={route({
              pathname: "/competitions/[competitionId]",
              query: { competitionId },
            })}
          >
            <Tabs.Trigger value="general">General</Tabs.Trigger>
          </Link>
          <Link
            href={route({
              pathname: "/competitions/[competitionId]/register",
              query: { competitionId },
            })}
          >
            <Tabs.Trigger value="register">Register</Tabs.Trigger>
          </Link>
          <Link
            href={route({
              pathname: "/competitions/[competitionId]/competitors",
              query: { competitionId },
            })}
          >
            <Tabs.Trigger value="competitors">Competitors</Tabs.Trigger>
          </Link>
          <Link
            href={route({
              pathname: "/competitions/[competitionId]/events",
              query: { competitionId },
            })}
          >
            <Tabs.Trigger value="events">Events </Tabs.Trigger>
          </Link>
          <Link
            href={route({
              pathname: "/competitions/[competitionId]/schedule",
              query: { competitionId },
            })}
          >
            <Tabs.Trigger value="schedule">Schedule</Tabs.Trigger>
          </Link>
          <Separator />
          <Tabs.Trigger value="custom-1">Custom 1</Tabs.Trigger>
          <Tabs.Trigger value="custom-2">Custom 2</Tabs.Trigger>
          <Tabs.Trigger value="custom-3">Custom 3</Tabs.Trigger>
        </Tabs.List>
        {children}
      </Tabs.Root>
    </Container>
  );
}
