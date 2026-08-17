import { Accordion } from "@chakra-ui/react";
import AnnouncementMarkdown from "@/components/announcements/AnnouncementMarkdown";
import { announcementSummary } from "@/components/announcements/announcement";
import AnnouncementDialog from "@/components/announcements/AnnouncementDialog";
import { Announcement } from "@/types/payload";

export default function AnnouncementContent({
  announcement,
}: {
  announcement: Announcement;
}) {
  return (
    <>
      <Accordion.ItemBody>
        <AnnouncementMarkdown>
          {announcementSummary(announcement)}
        </AnnouncementMarkdown>
      </Accordion.ItemBody>

      <Accordion.ItemBody>
        <AnnouncementDialog announcement={announcement} />
      </Accordion.ItemBody>
    </>
  );
}
