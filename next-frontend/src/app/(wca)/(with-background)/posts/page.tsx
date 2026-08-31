import { Card, Container, Heading, Text, VStack } from "@chakra-ui/react";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { announcementColorPalette } from "@/components/announcements/announcement";
import { Announcement } from "@/types/payload";
import AnnouncementsPagination from "@/app/(wca)/(with-background)/posts/announcementsPagination";

export const metadata: Metadata = {
  title: "Announcements",
};

const ANNOUNCEMENTS_PER_PAGE = 10;

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
                  colorPalette={announcementColorPalette(
                    firstIndexOnPage + index,
                  )}
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
