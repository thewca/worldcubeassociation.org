import { useT } from "@/lib/i18n/useI18n";
import { ButtonProps, IconButton } from "@chakra-ui/react";
import { LuArrowUp } from "react-icons/lu";

type BackToTopButtonProps = {
  visible: boolean;
  buttonProps?: ButtonProps;
  text?: string;
  parent?: HTMLDivElement | null;
};

export default function BackToTopButton({
  visible,
  text,
  buttonProps,
  parent,
}: BackToTopButtonProps) {
  const { t } = useT();

  if (!visible) return null;
  return (
    <IconButton
      aria-label={t("common.back_to_top")}
      onClick={() =>
        (parent || window).scrollTo({ top: 0, behavior: "smooth" })
      }
      position="fixed"
      bottom={6}
      insetEnd={6}
      zIndex="sticky"
      rounded="full"
      animation="fade-in"
      p={text ? 4 : 0}
      {...buttonProps}
    >
      {text} <LuArrowUp />
    </IconButton>
  );
}
