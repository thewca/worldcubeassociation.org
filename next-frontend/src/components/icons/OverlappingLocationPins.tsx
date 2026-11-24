import { useId } from "react";
import { Icon, type IconProps } from "@chakra-ui/react";

const FRONT_PIN_PATH =
  "M18.5 6.35a4.1 4.1 0 0 0-8.2 0c0 2.65 2.55 5.4 4.1 6.9 1.55-1.5 4.1-4.25 4.1-6.9Z";
const FRONT_PIN_POSITION = "translate(-1.95 0.35)";

const OverlappingLocationPins = (props: IconProps) => {
  const maskId = useId();

  return (
    <Icon {...props} asChild>
      <svg
        viewBox="0 0 20 15"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={20}
            height={15}
          >
            <rect width={20} height={15} fill="white" stroke="none" />
            <path
              d={FRONT_PIN_PATH}
              transform={FRONT_PIN_POSITION}
              fill="black"
              stroke="black"
              strokeWidth={1.9}
            />
          </mask>
        </defs>
        <g mask={`url(#${maskId})`}>
          <g transform="translate(1.95 -0.45)">
            <path d="M8.5 5a3.5 3.5 0 0 0-7 0c0 2.25 2.2 4.6 3.5 5.8 1.3-1.2 3.5-3.55 3.5-5.8Z" />
            <circle cx={5} cy={5} r={1.1} />
          </g>
        </g>
        <g transform={FRONT_PIN_POSITION}>
          <path d={FRONT_PIN_PATH} />
          <circle cx={14.4} cy={6.35} r={1.25} />
        </g>
      </svg>
    </Icon>
  );
};

export default OverlappingLocationPins;
