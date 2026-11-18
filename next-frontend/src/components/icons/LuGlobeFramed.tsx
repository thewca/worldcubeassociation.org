import { Icon, type IconProps } from "@chakra-ui/react";
import { LuGlobe } from "react-icons/lu";

const LuGlobeFramed = (props: IconProps) => (
  <Icon {...props} asChild>
    <svg viewBox="0 0 20 15">
      <rect
        x={0.5}
        y={0.5}
        width={19}
        height={14}
        fill="none"
        stroke="currentColor"
      />
      <LuGlobe x={4} y={1.5} size={12} />
    </svg>
  </Icon>
);

export default LuGlobeFramed;
