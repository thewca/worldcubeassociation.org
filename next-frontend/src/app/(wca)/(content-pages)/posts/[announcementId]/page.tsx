import { VStack } from "@chakra-ui/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCached } from "@/lib/payload/collections";
import { getT } from "@/lib/i18n/get18n";
import { AnnouncementFullCard } from "@/components/announcements/AnnouncementCard";
import { announcementColorPaletteFromId } from "@/components/announcements/announcement";
import { Announcement } from "@/types/payload";

const findAnnouncement = async (
  announcementId: string,
): Promise<Announcement | null> => {
  const { lng } = await getT();

  // `findByID` throws on unknown IDs, and MongoDB additionally throws on IDs
  // that aren't valid ObjectIDs, so query instead of catching two error types.
  const { docs } = await findCached(
    "announcements",
    {
      locale: lng,
      where: { id: { equals: announcementId } },
      limit: 1,
    },
    "minutes",
  );

  return docs[0] ?? null;
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

  return (
    <VStack align="stretch" py={8}>
      <AnnouncementFullCard
        announcement={announcement}
        colorPalette={announcementColorPaletteFromId(announcement)}
      />
    </VStack>
  );
}
