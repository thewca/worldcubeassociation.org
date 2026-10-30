"use client";

import {
  Grid,
  HStack,
  Icon,
  IconButton,
  IconProps,
  Popover,
  useClipboard,
  useMediaQuery,
} from "@chakra-ui/react";
import { LuCheck, LuCopy, LuMail } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import { ToggleTip } from "@/components/ui/toggle-tip";
import { useT } from "@/lib/i18n/useI18n";

export default function EmailCopyButton({ email }: { email: string }) {
  const [hasCoarsePointer] = useMediaQuery(["(any-pointer: coarse)"], {
    fallback: [true],
  });

  return hasCoarsePointer ? (
    <TouchCopyButton email={email} />
  ) : (
    <DesktopCopyButton email={email} />
  );
}

function DesktopCopyButton({ email }: { email: string }) {
  const { t } = useT();
  const clipboard = useClipboard({ value: email });

  return (
    <Tooltip content={email} showArrow openDelay={100}>
      <IconButton
        aria-label={
          clipboard.copied
            ? t("notifications.copied_to_clipboard")
            : t("delegates_page.copy_email")
        }
        variant="ghost"
        size="sm"
        className="group"
        onClick={clipboard.copy}
      >
        {/* Render on top of each other for smooth cross dissolve */}
        <Grid boxSize="4">
          <Icon
            {...ICON_PROPS}
            as={LuMail}
            opacity={clipboard.copied ? 0 : 1}
            _groupHover={{ opacity: 0 }}
            _groupFocusVisible={{ opacity: 0 }}
          />
          <Icon
            {...ICON_PROPS}
            as={LuCopy}
            opacity={0}
            _groupHover={{ opacity: clipboard.copied ? 0 : 1 }}
            _groupFocusVisible={{ opacity: clipboard.copied ? 0 : 1 }}
          />
          <Icon
            {...ICON_PROPS}
            as={LuCheck}
            opacity={clipboard.copied ? 1 : 0}
          />
        </Grid>
      </IconButton>
    </Tooltip>
  );
}

function TouchCopyButton({ email }: { email: string }) {
  const { t } = useT();
  const clipboard = useClipboard({ value: email });

  return (
    <ToggleTip
      showArrow
      lazyMount
      unmountOnExit
      content={
        <HStack gap="2" ps="2">
          <Popover.Title minW="0" textStyle="sm">
            {email}
          </Popover.Title>
          <IconButton
            aria-label={
              clipboard.copied
                ? t("notifications.copied_to_clipboard")
                : t("delegates_page.copy_email")
            }
            onClick={clipboard.copy}
            variant="ghost"
            size="xs"
          >
            {clipboard.copied ? <LuCheck /> : <LuCopy />}
          </IconButton>
        </HStack>
      }
    >
      <IconButton
        aria-label={t("activerecord.attributes.user.email")}
        variant="ghost"
        size="sm"
      >
        <LuMail />
      </IconButton>
    </ToggleTip>
  );
}

const ICON_PROPS: IconProps = {
  gridArea: "1 / 1",
  boxSize: "full",
  transitionProperty: "opacity",
  transitionDuration: "fast",
  transitionTimingFunction: "ease",
  _motionReduce: { transition: "none" },
};
