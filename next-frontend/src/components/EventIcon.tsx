import _333Icon from "@/components/icons/events/_333Icon";
import _333bfIcon from "@/components/icons/events/_333bfIcon";
import _333ftIcon from "@/components/icons/events/_333ftIcon";
import _333mbfIcon from "@/components/icons/events/_333mbfIcon";
import _333mboIcon from "@/components/icons/events/_333mboIcon";
import _222Icon from "@/components/icons/events/_222Icon";
import _444Icon from "@/components/icons/events/_444Icon";
import _555Icon from "@/components/icons/events/_555Icon";
import _666Icon from "@/components/icons/events/_666Icon";
import _777Icon from "@/components/icons/events/_777Icon";
import _ClockIcon from "@/components/icons/events/_ClockIcon";
import _MagicIcon from "@/components/icons/events/_MagicIcon";
import _MmagicIcon from "@/components/icons/events/_MmagicIcon";
import _MinxIcon from "@/components/icons/events/_MinxIcon";
import _PyramIcon from "@/components/icons/events/_PyramIcon";
import _SkewbIcon from "@/components/icons/events/_SkewbIcon";
import _Sq1Icon from "@/components/icons/events/_Sq1Icon";
import _333fmIcon from "@/components/icons/events/_333fmIcon";
import _333ohIcon from "@/components/icons/events/_333ohIcon";
import _444bfIcon from "@/components/icons/events/_444bfIcon";
import _555bfIcon from "@/components/icons/events/_555bfIcon";

import type { ComponentPropsWithoutRef } from "react";

const eventIconMap = {
  "333": _333Icon,
  "333bf": _333bfIcon,
  "333ft": _333ftIcon,
  "333mbf": _333mbfIcon,
  "333mbo": _333mboIcon,
  "222": _222Icon,
  "444": _444Icon,
  "555": _555Icon,
  "666": _666Icon,
  "777": _777Icon,
  clock: _ClockIcon,
  magic: _MagicIcon,
  mmagic: _MmagicIcon,
  minx: _MinxIcon,
  pyram: _PyramIcon,
  skewb: _SkewbIcon,
  sq1: _Sq1Icon,
  "333fm": _333fmIcon,
  "333oh": _333ohIcon,
  "444bf": _444bfIcon,
  "555bf": _555bfIcon,
} as const;

type EventIconId = keyof typeof eventIconMap;

type EventIconIntrinsic = (typeof eventIconMap)[EventIconId];
type EventIconIntrinsicProps = ComponentPropsWithoutRef<EventIconIntrinsic>;

type EventIconProps = {
  eventId: string;
} & EventIconIntrinsicProps;

const EventIcon = ({ eventId, ...iconIntrinsicProps }: EventIconProps) => {
  const IconComponent = eventIconMap[eventId as EventIconId];
  if (!IconComponent) return null;

  return <IconComponent {...iconIntrinsicProps} />;
};

export default EventIcon;
