import {
  iconMap,
  IconName,
  lucideIconMap,
  LucideIconName,
} from "@/components/icons/iconMap";
import { Icon, Text } from "@chakra-ui/react";
import React, { type ReactNode } from "react";

interface IconDisplayProps {
  name: IconName | LucideIconName;
  fallback?: boolean | ReactNode;
  size?: string;
}

const isLucideIconName = (name: string): name is LucideIconName =>
  name in lucideIconMap;

const IconDisplay = ({
  name,
  fallback = undefined,
  size = "1em",
}: IconDisplayProps) => {
  const isLucideIcon = isLucideIconName(name);

  if (isLucideIcon) {
    const LucideIcon = lucideIconMap[name];

    return (
      <Icon boxSize={size}>
        <LucideIcon />
      </Icon>
    );
  }

  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return fallback === true ? <Text>No_Icon</Text> : fallback;
  }

  return <IconComponent boxSize={size} />;
};

export default IconDisplay;
