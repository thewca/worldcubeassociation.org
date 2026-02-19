import { iconMap, IconName } from "@/components/icons/iconMap";
import { Text } from "@chakra-ui/react";
import React, { type ReactNode } from "react";

interface IconDisplayProps {
  name: IconName;
  fallback?: boolean | ReactNode;
}

const IconDisplay = ({ name, fallback = undefined }: IconDisplayProps) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return fallback === true ? <Text>No_Icon</Text> : fallback;
  }

  return <IconComponent />;
};

export default IconDisplay;
