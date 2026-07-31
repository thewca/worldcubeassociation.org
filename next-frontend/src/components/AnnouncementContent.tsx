import { Accordion } from "@chakra-ui/react";
import AnnouncementMarkdown from "@/components/announcements/AnnouncementMarkdown";
import { announcementSummary } from "@/components/announcements/announcement";
import ReadMoreButton from "@/components/announcements/ReadMoreButton";
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
        <ReadMoreButton announcement={announcement} />
      </Accordion.ItemBody>
    </>
  );
}
