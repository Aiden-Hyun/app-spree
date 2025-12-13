export type Meridiem = "AM" | "PM";

export interface TimeValue {
  hour: number; // 1-12
  minute: number; // 0-55 step 5
  meridiem: Meridiem;
}

export const getRoundedMinutes = (minutes: number) => {
  const rounded = Math.round(minutes / 5) * 5;
  return rounded === 60 ? 55 : rounded;
};

export const dateToTimeValue = (date: Date): TimeValue => {
  const hours24 = date.getHours();
  const meridiem: Meridiem = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 % 12 || 12;
  const minute = getRoundedMinutes(date.getMinutes());
  return { hour: hour12, minute, meridiem };
};

export const getDefaultTimeValue = (): TimeValue => {
  return dateToTimeValue(new Date());
};

export const mergeDateAndTime = (
  date: Date,
  time: TimeValue | null
): Date => {
  const result = new Date(date);
  if (time) {
    const hour24 =
      time.meridiem === "PM"
        ? time.hour === 12
          ? 12
          : time.hour + 12
        : time.hour === 12
        ? 0
        : time.hour;
    result.setHours(hour24, time.minute, 0, 0);
  } else {
    result.setHours(0, 0, 0, 0);
  }
  return result;
};

export const formatTimeDisplay = (date: Date) => {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

