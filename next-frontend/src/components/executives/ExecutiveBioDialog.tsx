import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { getT } from "@/lib/i18n/get18n";
import { ColorPaletteSelect } from "@/types/payload";

/// Same reading experience as the "Read More" dialog on /posts. The portal
/// renders outside the card, so the card's palette has to be passed in.
export default async function ExecutiveBioDialog({
  name,
  bioMarkdown,
  colorPalette,
}: {
  name: string;
  bioMarkdown?: string | null;
  colorPalette: ColorPaletteSelect;
}) {
  const { t } = await getT();

  return (
    <Dialog.Root size="xl" scrollBehavior="inside" lazyMount>
      <Dialog.Trigger asChild>
        <Button variant="onSolid" size="sm">
          {t("page.executives.more_information")}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            colorPalette={colorPalette}
            layerStyle={{ _light: "fill.solid", _dark: "fill.muted" }}
          >
            <Dialog.Header>
              <Dialog.Title textStyle="h2">{name}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <ChakraMarkdown>{bioMarkdown}</ChakraMarkdown>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="onSolid">{t("page.executives.close")}</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" color="currentColor" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
