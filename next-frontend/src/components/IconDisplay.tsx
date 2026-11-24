import { iconMap, IconName } from "@/components/icons/iconMap";
import { Text } from "@chakra-ui/react";
import React, { type ReactNode } from "react";

interface IconDisplayProps {
  name: IconName;
  fallback?: boolean | ReactNode;
  size?: string;
}

const IconDisplay = ({
  name,
  fallback = undefined,
  size = "1em",
}: IconDisplayProps) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return fallback === true ? (
      <Text>
        {/* eslint-disable-line no-restricted-syntax -- Backoffice-only text */}
        No_Icon
      </Text>
    ) : (
      fallback
    );
  }

  return <IconComponent boxSize={size} />;
};

export default IconDisplay;
