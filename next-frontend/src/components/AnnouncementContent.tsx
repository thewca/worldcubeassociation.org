import { Accordion } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
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
      <ChakraMarkdown paragraphAs={Accordion.ItemBody} textStyle="body">
        {announcementSummary(announcement)}
      </ChakraMarkdown>

      <Accordion.ItemBody>
        <ReadMoreButton announcement={announcement} />
      </Accordion.ItemBody>
    </>
  );
}
