import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Text,
  HStack,
  VStack,
  IconButton,
  Flex,
  ButtonProps,
  Portal,
  Popover,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import * as dateLocales from "date-fns/locale";
import { LuCalendar, LuChevronLeft, LuChevronRight } from "react-icons/lu";

export type DatePickerValue = Date | DateRange | null;

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DatePickerProps {
  value?: DatePickerValue;
  onChange: (date: DatePickerValue) => void;
  mode?: "single" | "range";
  locale: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  mode = "single",
  locale,
  placeholder,
  minDate,
  maxDate,
  disabled = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempRange, setTempRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = dateLocales[locale as keyof typeof dateLocales];

  // Reset temp range when mode changes or picker closes
  useEffect(() => {
    if (!isOpen) {
      setTempRange({ start: null, end: null });
    }
  }, [isOpen]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: currentLocale });
  const calendarEnd = endOfWeek(monthEnd, { locale: currentLocale });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const formatDisplayValue = useCallback(() => {
    if (!value) return placeholder || "Select date";

    if (mode === "single" && value instanceof Date) {
      return format(value, "PPP", { locale: currentLocale });
    }

    if (
      mode === "range" &&
      value &&
      typeof value === "object" &&
      "start" in value
    ) {
      const { start, end } = value as DateRange;
      if (start && end) {
        return `${format(start, "MMM dd", { locale: currentLocale })} - ${format(end, "MMM dd", { locale: currentLocale })}`;
      }
      if (start) {
        return `${format(start, "MMM dd", { locale: currentLocale })} - ...`;
      }
    }

    return placeholder || "Select date";
  }, [currentLocale, mode, placeholder, value]);

  const handleDateClick = (date: Date) => {
    if (disabled) return;

    // Check if date is within allowed range
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    if (mode === "single") {
      onChange(date);
      setIsOpen(false);
    } else {
      // Range mode logic
      if (!tempRange.start || (tempRange.start && tempRange.end)) {
        // Start new range
        setTempRange({ start: date, end: null });
      } else if (tempRange.start && !tempRange.end) {
        // Complete the range
        const newRange = {
          start: date < tempRange.start ? date : tempRange.start,
          end: date < tempRange.start ? tempRange.start : date,
        };
        setTempRange(newRange);
        onChange(newRange);
        setIsOpen(false);
      }
    }
  };

  const getDayButtonProps = (date: Date) => {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isSelected =
      mode === "single"
        ? value instanceof Date && isSameDay(date, value)
        : false;

    let isInRange = false;
    let isRangeStart = false;
    let isRangeEnd = false;
    let isTempInRange = false;
    let isTempStart = false;
    let isTempEnd = false;

    if (mode === "range") {
      // Check actual selected range
      if (value && typeof value === "object" && "start" in value) {
        const { start, end } = value as DateRange;
        if (start && end) {
          isInRange = isWithinInterval(date, { start, end });
          isRangeStart = isSameDay(date, start);
          isRangeEnd = isSameDay(date, end);
        }
      }

      // Check temporary range
      if (tempRange.start) {
        isTempStart = isSameDay(date, tempRange.start);
        if (tempRange.end) {
          isTempInRange = isWithinInterval(date, {
            start:
              tempRange.start < tempRange.end ? tempRange.start : tempRange.end,
            end:
              tempRange.start < tempRange.end ? tempRange.end : tempRange.start,
          });
          isTempEnd = isSameDay(date, tempRange.end);
        }
      }
    }

    const isDisabledDate =
      (minDate && date < minDate) || (maxDate && date > maxDate);

    const shouldShowSelected =
      isSelected || isRangeStart || isRangeEnd || isTempStart || isTempEnd;

    return {
      size: "sm",
      variant: shouldShowSelected
        ? "solid"
        : isInRange || isTempInRange
          ? "outline"
          : "ghost",
      colorPalette: shouldShowSelected
        ? "blue"
        : isInRange || isTempInRange
          ? "blue"
          : "gray",
      bg: !isCurrentMonth
        ? "transparent"
        : isToday(date) && !shouldShowSelected
          ? "colorPalette.50"
          : undefined,
      color: !isCurrentMonth ? "gray.400" : undefined,
      disabled: isDisabledDate,
      _hover: isDisabledDate ? {} : { bg: "colorPalette.50" },
    } as ButtonProps;
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { locale: currentLocale }); // locale-aware start of week
    const days = eachDayOfInterval({
      start,
      end: new Date(start.getTime() + 6 * 86400000),
    });

    return days.map((day) => format(day, "EEE", { locale: currentLocale }));
  }, [currentLocale]);

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      positioning={{ placement: "bottom-start" }}
    >
      <Popover.Trigger asChild>
        <Button
          disabled={disabled}
          justifyContent="flex-start"
          w="full"
          maxW="300px"
        >
          <LuCalendar size={16} />
          <Text truncate>{formatDisplayValue()}</Text>
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content width="320px" p={0}>
            <Popover.Arrow />
            <Popover.Body p={4}>
              <VStack gap={4}>
                {/* Month Navigation */}
                <HStack w="full" justify="space-between" align="center">
                  <IconButton
                    aria-label="Previous month"
                    size="sm"
                    variant="ghost"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <LuChevronLeft size={16} />
                  </IconButton>
                  <Text fontSize="lg" fontWeight="semibold">
                    {format(currentMonth, "MMMM yyyy", {
                      locale: currentLocale,
                    })}
                  </Text>
                  <IconButton
                    aria-label="Next month"
                    size="sm"
                    variant="ghost"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <LuChevronRight size={16} />
                  </IconButton>
                </HStack>

                {/* Calendar Grid */}
                <Box w="full">
                  {/* Week day headers */}
                  <SimpleGrid columns={7} gap={1} mb={2}>
                    {weekDays.map((day) => (
                      <Text
                        key={day}
                        fontSize="xs"
                        fontWeight="medium"
                        color="gray.500"
                        textAlign="center"
                        py={1}
                      >
                        {day}
                      </Text>
                    ))}
                  </SimpleGrid>

                  {/* Calendar days */}
                  <SimpleGrid columns={7} gap={1}>
                    {days.map((date) => (
                      <Button
                        key={date.toISOString()}
                        onClick={() => handleDateClick(date)}
                        {...getDayButtonProps(date)}
                      >
                        {format(date, "d")}
                      </Button>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Mode indicator */}
                <Flex
                  w="full"
                  justify="space-between"
                  align="center"
                  pt={2}
                  borderTop="1px solid"
                  borderColor="gray.100"
                >
                  <Text fontSize="xs" color="gray.500">
                    Mode: {mode === "single" ? "Single Date" : "Date Range"}
                  </Text>
                  {tempRange.start && mode === "range" && !tempRange.end && (
                    <Text fontSize="xs" color="blue.500">
                      Select end date
                    </Text>
                  )}
                </Flex>
              </VStack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};
