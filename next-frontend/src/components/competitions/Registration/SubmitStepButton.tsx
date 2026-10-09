"use client";

import { Button } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { LuSend } from "react-icons/lu";

export default function SubmitStepButton({
  isSubmitting,
  disabled,
  onSubmit,
  children,
}: {
  isSubmitting: boolean;
  disabled: boolean;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      width="full"
      colorPalette="green"
      loading={isSubmitting}
      disabled={disabled}
      onClick={onSubmit}
    >
      <LuSend />
      {children}
    </Button>
  );
}
