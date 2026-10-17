"use client";

import { Button, ButtonProps, Icon } from "@chakra-ui/react";
import { ReactElement } from "react";
import { Toaster, toaster } from "./ui/toaster";

export interface CopyButtonProps extends ButtonProps {
  text?: string;
  value: string;
  icon?: ReactElement;
  toastLabel: string;
}

export default function CopyButton({
  text,
  value,
  icon,
  toastLabel,
  ...buttonProps
}: CopyButtonProps) {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toaster.create({
      type: "info",
      description: toastLabel,
    });
  };

  return (
    <>
      <Button {...buttonProps} onClick={copy}>
        {icon && <Icon>{icon}</Icon>} {text}
      </Button>
      <Toaster />
    </>
  );
}
