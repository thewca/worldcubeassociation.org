import { Container, Heading, Text, VStack } from "@chakra-ui/react";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { Announcement, ColorPaletteSelect } from "@/types/payload";
import AnnouncementsPagination from "@/app/(wca)/(with-background)/posts/announcementsPagination";

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

  const payload = await getPayload({ config });
  const announcements = await payload.find({
    collection: "announcements",
    sort: "-publishedAt",
    page: currentPage,
    limit: ANNOUNCEMENTS_PER_PAGE,
  });

  const firstIndexOnPage = (currentPage - 1) * ANNOUNCEMENTS_PER_PAGE;

  return (
    <Container>
      <VStack align="stretch" gap={8} py={8}>
        <Heading size="5xl">Announcements</Heading>

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
    </Container>
  );
}
