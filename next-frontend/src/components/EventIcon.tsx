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
import _FtoIcon from "@/components/icons/events/_FtoIcon";
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
import { Tooltip } from "./ui/tooltip";
import { Center } from "@chakra-ui/react";
import { TFunction } from "i18next";

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
  fto: _FtoIcon,
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
  disabledLabel?: string;
  fullWidth?: boolean;
  t: TFunction;
} & EventIconIntrinsicProps;

const EventIcon = ({
  eventId,
  disabledLabel,
  fullWidth,
  t,
  ...iconIntrinsicProps
}: EventIconProps) => {
  const IconComponent = eventIconMap[eventId as EventIconId];
  if (!IconComponent) return null;
  // i18n-tasks-use t('events.333')
  // i18n-tasks-use t('events.222')
  // i18n-tasks-use t('events.444')
  // i18n-tasks-use t('events.555')
  // i18n-tasks-use t('events.666')
  // i18n-tasks-use t('events.777')
  // i18n-tasks-use t('events.333bf')
  // i18n-tasks-use t('events.333fm')
  // i18n-tasks-use t('events.333oh')
  // i18n-tasks-use t('events.333ft')
  // i18n-tasks-use t('events.clock')
  // i18n-tasks-use t('events.minx')
  // i18n-tasks-use t('events.pyram')
  // i18n-tasks-use t('events.skewb')
  // i18n-tasks-use t('events.sq1')
  // i18n-tasks-use t('events.444bf')
  // i18n-tasks-use t('events.555bf')
  // i18n-tasks-use t('events.333mbf')
  // i18n-tasks-use t('events.fto')
  // i18n-tasks-use t('events.magic')
  // i18n-tasks-use t('events.mmagic')
  // i18n-tasks-use t('events.333mbo')
  const eventName = t(`events.${eventId}`);

  return (
    <EventTooltip
      eventName={eventName}
      disabledLabel={disabledLabel}
      fullWidth={fullWidth}
    >
      <IconComponent {...iconIntrinsicProps} />
    </EventTooltip>
  );
};

// Chakra hides icons from assistive tech by default, which is right for most of our call sites:
//   they put the event's name next to the icon, and a label here would announce it twice.
//   This is for the icons that stand alone and have to carry the name themselves.
export const LabelledEventIcon = ({
  eventId,
  disabledLabel,
  fullWidth,
  t,
  ...iconIntrinsicProps
}: EventIconProps) => {
  const eventName = t(`events.${eventId}`);
  return (
    <EventIcon
      eventId={eventId}
      role="img"
      aria-hidden={false}
      aria-label={eventName}
      t={t}
      fullWidth={fullWidth}
      disabledLabel={disabledLabel}
      {...iconIntrinsicProps}
    />
  );
};

function EventTooltip({
  eventName,
  disabledLabel,
  fullWidth,
  children,
}: {
  eventName: string;
  disabledLabel?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  const dimension = fullWidth ? "full" : undefined;
  return (
    <Tooltip
      content={disabledLabel ?? eventName}
      closeDelay={20}
      openDelay={20}
    >
      <Center w={dimension} h={dimension}>
        {children}
      </Center>
    </Tooltip>
  );
}

export default EventIcon;
