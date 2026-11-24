import { Suspense } from "react";
import { Box, Card, Heading, Text, VStack } from "@chakra-ui/react";
import type { Metadata } from "next";
import { findCached } from "@/lib/payload/collections";
import { getT } from "@/lib/i18n/get18n";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { announcementColorPalette } from "@/components/announcements/announcement";
import { Announcement } from "@/types/payload";
import AnnouncementsPagination from "@/app/(wca)/(content-pages)/posts/announcementsPagination";
import AnnouncementsSearch from "@/app/(wca)/(content-pages)/posts/announcementsSearch";
import Loading from "@/components/ui/loading";

export const metadata: Metadata = {
  title: "Announcements",
};

const ANNOUNCEMENTS_PER_PAGE = 10;

type AnnouncementsPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function AnnouncementsPage({
  searchParams,
}: AnnouncementsPageProps) {
  const { t } = await getT();

  return (
    <Box py={8}>
      <Card.Root size="md">
        <Card.Header>
          <Heading textStyle="h1">{t("homepage.announcements")}</Heading>
        </Card.Header>
        <Card.Body>
          <Suspense fallback={<Loading />}>
            <AnnouncementsList searchParams={searchParams} />
          </Suspense>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}

async function AnnouncementsList({ searchParams }: AnnouncementsPageProps) {
  const { page = "1", q } = await searchParams;
  const currentPage = Math.max(parseInt(page, 10) || 1, 1);

  const { t, lng } = await getT();
  const announcements = await findCached(
    "announcements",
    {
      locale: lng,
      where: q
        ? { or: [{ title: { like: q } }, { summary: { like: q } }] }
        : undefined,
      sort: "-publishedAt",
      page: currentPage,
      limit: ANNOUNCEMENTS_PER_PAGE,
    },
    "minutes",
  );

  const firstIndexOnPage = (currentPage - 1) * ANNOUNCEMENTS_PER_PAGE;

  const emptyMessage = q
    ? t("posts.no_search_results")
    : t("posts.no_announcements");

  return (
    <VStack align="stretch" gap={8}>
      <AnnouncementsSearch searchQuery={q} />

      {announcements.docs.length === 0 ? (
        <Text>{emptyMessage}</Text>
      ) : (
        announcements.docs.map((announcement: Announcement, index) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            colorPalette={announcementColorPalette(firstIndexOnPage + index)}
          />
        ))
      )}

      <AnnouncementsPagination
        page={currentPage}
        totalAnnouncements={announcements.totalDocs}
        pageSize={ANNOUNCEMENTS_PER_PAGE}
        searchQuery={q}
      />
    </VStack>
  );
}
