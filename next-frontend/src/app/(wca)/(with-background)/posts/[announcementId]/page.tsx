import { Container, VStack } from "@chakra-ui/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { AnnouncementFullCard } from "@/components/announcements/AnnouncementCard";
import { announcementColorPalette } from "@/components/announcements/announcement";
import { Announcement } from "@/types/payload";

const findAnnouncement = async (
  announcementId: string,
): Promise<Announcement | null> => {
  const payload = await getPayload({ config });

  // `findByID` throws on unknown IDs, and MongoDB additionally throws on IDs
  // that aren't valid ObjectIDs, so query instead of catching two error types.
  const { docs } = await payload.find({
    collection: "announcements",
    where: { id: { equals: announcementId } },
    limit: 1,
  });

  return docs[0] ?? null;
};

/// The announcement's position in the newest-first list on /posts, which is how
/// many announcements were published after it.
const findAnnouncementIndex = async (
  announcement: Announcement,
): Promise<number> => {
  const payload = await getPayload({ config });

  const { totalDocs } = await payload.count({
    collection: "announcements",
    where: { publishedAt: { greater_than: announcement.publishedAt } },
  });

  return totalDocs;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ announcementId: string }>;
}): Promise<Metadata> {
  const { announcementId } = await params;
  const announcement = await findAnnouncement(announcementId);

  return { title: announcement?.title ?? "Announcement" };
}

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ announcementId: string }>;
}) {
  const { announcementId } = await params;
  const announcement = await findAnnouncement(announcementId);

  if (!announcement) {
    notFound();
  }

  const index = await findAnnouncementIndex(announcement);

  return (
    <Container>
      <VStack align="stretch" py={8}>
        <AnnouncementFullCard
          announcement={announcement}
          colorPalette={announcementColorPalette(index)}
        />
      </VStack>
    </Container>
  );
}
