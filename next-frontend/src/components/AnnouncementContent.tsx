import { Accordion } from "@chakra-ui/react";
import AnnouncementMarkdown from "@/components/announcements/AnnouncementMarkdown";
import { announcementSummary } from "@/components/announcements/announcement";
import AnnouncementDialog from "@/components/announcements/AnnouncementDialog";
import { Announcement, ColorPaletteSelect } from "@/types/payload";

export default function AnnouncementContent({
  announcement,
  colorPalette,
}: {
  announcement: Announcement;
  colorPalette: ColorPaletteSelect;
}) {
  return (
    <>
      <Accordion.ItemBody>
        <AnnouncementMarkdown>
          {announcementSummary(announcement)}
        </AnnouncementMarkdown>
      </Accordion.ItemBody>

      <Accordion.ItemBody>
        <AnnouncementDialog
          announcement={announcement}
          colorPalette={colorPalette}
        />
      </Accordion.ItemBody>
    </>
  );
}
