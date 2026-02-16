import { DateTime } from "luxon";
import React from "react";
import { Icon, Link } from "@chakra-ui/react";
import CompRegoOpenDateIcon from "@/components/icons/CompRegoOpenDateIcon";

interface AddToCalendarProps {
  startDate: string;
  endDate: string;
  timeZone: string;
  name: string;
  address?: string;
  allDay?: boolean;
}

const AddToCalendar: React.FC<AddToCalendarProps> = ({
  startDate,
  endDate,
  timeZone,
  name,
  address,
  allDay = false,
}) => {
  // note: date corresponds to midnight for all-day events, so need to use the day after
  const endDateOffset = allDay ? { days: 1 } : {};
  const format = allDay ? "yyyyMMdd" : "yyyyMMdd'T'HHmmssZ";

  const formattedStartDate = DateTime.fromISO(startDate, {
    zone: timeZone,
  }).toFormat(format);

  const formattedEndDate = DateTime.fromISO(endDate, { zone: timeZone })
    .plus(endDateOffset)
    .toFormat(format);

  const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${name}&dates=${formattedStartDate}/${formattedEndDate}${
    address ? `&location=${address}` : ""
  }`;

  return (
    <Link href={googleCalendarLink} target="_blank" rel="noreferrer">
      <Icon size="xs">
        <CompRegoOpenDateIcon />
      </Icon>
    </Link>
  );
};

export default AddToCalendar;
