import { Card, Container, Heading, Text, VStack } from "@chakra-ui/react";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { connection } from "next/server";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { Announcement, ColorPaletteSelect } from "@/types/payload";
import AnnouncementsPagination from "@/app/(wca)/(with-background)/posts/announcementsPagination";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Announcements",
};

const ANNOUNCEMENTS_PER_PAGE = 10;

// Announcement cards alternate through the WCA primary colors.
const CARD_COLOR_PALETTES: ColorPaletteSelect[] = [
  "blue",
  "red",
  "green",
  "orange",
  "yellow",
];

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(parseInt(page, 10) || 1, 1);

  await connection();

  const payload = await getPayload({ config });
  const announcements = await payload.find({
    collection: "announcements",
    sort: "-publishedAt",
    page: currentPage,
    limit: ANNOUNCEMENTS_PER_PAGE,
  });

  const firstIndexOnPage = (currentPage - 1) * ANNOUNCEMENTS_PER_PAGE;

  return (
    <Container py={8}>
      <Card.Root size="md">
        <Card.Header>
          <Heading textStyle="h1">Announcements</Heading>
        </Card.Header>
        <Card.Body>
          <VStack align="stretch" gap={8}>
            {announcements.docs.length === 0 ? (
              <Text>There are no announcements yet.</Text>
            ) : (
              announcements.docs.map((announcement: Announcement, index) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  colorPalette={
                    CARD_COLOR_PALETTES[
                      (firstIndexOnPage + index) % CARD_COLOR_PALETTES.length
                    ]
                  }
                />
              ))
            )}

            <AnnouncementsPagination
              page={currentPage}
              totalAnnouncements={announcements.totalDocs}
              pageSize={ANNOUNCEMENTS_PER_PAGE}
            />
          </VStack>
        </Card.Body>
      </Card.Root>
    </Container>
  );
}
