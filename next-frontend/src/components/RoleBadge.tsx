"use client";

import { chakra, Badge, createIcon, Float } from "@chakra-ui/react";
import type { ComponentPropsWithoutRef, FC } from "react";

type ChakraBadgeProps = ComponentPropsWithoutRef<typeof Badge>;

export type StaffColor = ChakraBadgeProps["colorPalette"];

interface RoleBadgeProps extends ChakraBadgeProps {
  teamRole: string;
  teamText: string;
  colorPalette: StaffColor;
}

const StaffCubeIcon = createIcon({
  displayName: "StaffCubeIcon",
  viewBox: "0 0 88.44 89.99",
  path: (
    <g data-name="Layer 1">
      <chakra.path
        fill="colorPalette.subtle"
        d="M50.2.36L13.98,11.62c-2.73.85-4.8,3.09-5.43,5.88L.2,54.49c-.63,2.79.28,5.7,2.38,7.64l27.86,25.74c2.1,1.94,5.07,2.61,7.8,1.76l36.22-11.26c2.73-.85,4.8-3.09,5.43-5.88l8.36-37c.63-2.79-.28-5.7-2.38-7.64L58,2.12c-2.1-1.94-5.07-2.61-7.8-1.76Z"
      />
      <chakra.path
        fill="colorPalette.cubeShades.left"
        d="M9.64,56.79l23.75,21.95c.91.85,2.4.39,2.68-.82l7.36-31.8c.13-.57-.06-1.17-.49-1.57L18.84,23.5c-.92-.84-2.4-.37-2.67.86L9.16,56.05c-.12.56.06,1.15.48,1.54Z"
      />
      <chakra.path
        fill="colorPalette.cubeShades.top"
        d="M20.53,21.64l23.53,21.33c.51.46,1.22.62,1.88.42l30.3-9.15c1.47-.44,1.87-2.31.73-3.33L52.83,9.43c-.51-.46-1.23-.61-1.89-.41l-29.68,9.33c-1.44.46-1.85,2.3-.73,3.32Z"
      />
      <chakra.path
        fill="colorPalette.cubeShades.right"
        d="M40.58,79.9l30.52-9.44c.71-.22,1.25-.8,1.4-1.52l6.79-30.47c.34-1.54-1.1-2.88-2.61-2.42l-30.17,9.12c-.71.21-1.25.79-1.41,1.51l-7.13,30.8c-.36,1.55,1.1,2.91,2.61,2.44Z"
      />
    </g>
  ),
  defaultProps: {
    boxSize: "1em",
  },
});

const RoleBadge: FC<RoleBadgeProps> = ({
  teamRole,
  teamText,
  colorPalette,
  ...badgeProps
}) => {
  return (
    <Badge
      variant="subtle"
      colorPalette={colorPalette}
      position="relative"
      paddingLeft={4}
      marginY={2}
      marginLeft={3}
      {...badgeProps}
    >
      <Float placement="middle-start">
        <StaffCubeIcon colorPalette={colorPalette} fontSize="3xl" />
      </Float>
      {teamText} {teamRole}
    </Badge>
  );
};

export default RoleBadge;
