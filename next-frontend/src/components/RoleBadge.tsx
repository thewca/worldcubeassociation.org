'use client'
import { Box, Text, useToken } from "@chakra-ui/react";
import { FC } from "react";

interface RoleBadgeProps {
  teamRole: string;
  teamText: string;
  staffColor: "yellow" | "blue" | "green" | "black" | "red" | "orange";
}

const RoleBadge: FC<RoleBadgeProps> = ({ teamRole, teamText, staffColor }) => {
const [spanBg, cls1, cls2, cls3, cls4] = useToken("colors", [
    `${staffColor}.spanBg`,
    `${staffColor}.cls1`,
    `${staffColor}.cls2`,
    `${staffColor}.cls3`,
    `${staffColor}.cls4`,
    ]);

  return (
    <Box display="flex" alignItems="center" fontSize="0.75em">
      <Box as="svg" width="2.75em" height="2.75em" viewBox="0 0 88.44 89.99" zIndex="2">
        <g data-name="Layer 1">
          <path fill={cls1} d="M50.2.36L13.98,11.62c-2.73.85-4.8,3.09-5.43,5.88L.2,54.49c-.63,2.79.28,5.7,2.38,7.64l27.86,25.74c2.1,1.94,5.07,2.61,7.8,1.76l36.22-11.26c2.73-.85,4.8-3.09,5.43-5.88l8.36-37c.63-2.79-.28-5.7-2.38-7.64L58,2.12c-2.1-1.94-5.07-2.61-7.8-1.76Z" />
          <path fill={cls2} d="M20.53,21.64l23.53,21.33c.51.46,1.22.62,1.88.42l30.3-9.15c1.47-.44,1.87-2.31.73-3.33L52.83,9.43c-.51-.46-1.23-.61-1.89-.41l-29.68,9.33c-1.44.46-1.85,2.3-.73,3.32Z" />
          <path fill={cls4} d="M40.58,79.9l30.52-9.44c.71-.22,1.25-.8,1.4-1.52l6.79-30.47c.34-1.54-1.1-2.88-2.61-2.42l-30.17,9.12c-.71.21-1.25.79-1.41,1.51l-7.13,30.8c-.36,1.55,1.1,2.91,2.61,2.44Z" />
          <path fill={cls3} d="M9.64,56.79l23.75,21.95c.91.85,2.4.39,2.68-.82l7.36-31.8c.13-.57-.06-1.17-.49-1.57L18.84,23.5c-.92-.84-2.4-.37-2.67.86L9.16,56.05c-.12.56.06,1.15.48,1.54Z" />
        </g>
      </Box>
      <Text
        ml="-2em"
        pl="2.2em"
        pr="0.5em"
        borderRadius="5px"
        bg={spanBg}
        color="#FCFCFC"
        fontWeight="600"
        lineHeight="1.9"
        paddingTop= "1px"
        zIndex="1"
        whiteSpace="nowrap"
      >
        {teamText} {teamRole}
      </Text>
    </Box>
  );
};

export default RoleBadge;
