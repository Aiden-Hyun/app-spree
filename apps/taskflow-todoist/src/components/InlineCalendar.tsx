import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InlineCalendarProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function InlineCalendar({
  value,
  onChange,
  minimumDate,
  maximumDate,
}: InlineCalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(
    new Date(value.getFullYear(), value.getMonth(), 1)
  );

  // Calendar math functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isSelected = (date: Date) => {
    return isSameDay(date, value);
  };

  const isSameMonth = (date: Date) => {
    return (
      date.getFullYear() === displayMonth.getFullYear() &&
      date.getMonth() === displayMonth.getMonth()
    );
  };

  const isWithinRange = (date: Date) => {
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    if (minimumDate) {
      const minDateOnly = new Date(
        minimumDate.getFullYear(),
        minimumDate.getMonth(),
        minimumDate.getDate()
      );
      if (dateOnly < minDateOnly) return false;
    }
    if (maximumDate) {
      const maxDateOnly = new Date(
        maximumDate.getFullYear(),
        maximumDate.getMonth(),
        maximumDate.getDate()
      );
      if (dateOnly > maxDateOnly) return false;
    }
    return true;
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Previous month trailing dates
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const leadingDays = firstDay;

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Add trailing days from previous month
    for (let i = leadingDays - 1; i >= 0; i--) {
      currentWeek.push(new Date(year, month - 1, prevMonthDays - i));
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(new Date(year, month, day));
    }

    // Add leading days from next month
    let nextMonthDay = 1;
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(year, month + 1, nextMonthDay++));
    }
    weeks.push(currentWeek);

    // Ensure 6 rows for consistent height
    while (weeks.length < 6) {
      const lastWeek: Date[] = [];
      for (let i = 0; i < 7; i++) {
        lastWeek.push(new Date(year, month + 1, nextMonthDay++));
      }
      weeks.push(lastWeek);
    }

    return weeks;
  };

  const handlePrevMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1)
    );
  };

  const handleDatePress = (date: Date) => {
    if (!isWithinRange(date)) return;
    onChange(date);
  };

  const calendarGrid = generateCalendarGrid();

  return (
    <View style={styles.container}>
      {/* Header with month/year navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#6c5ce7" />
        </TouchableOpacity>
        <Text style={styles.monthYear}>
          {MONTHS[displayMonth.getMonth()]} {displayMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#6c5ce7" />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map((day) => (
          <Text key={day} style={styles.dayHeader}>
            {day}
          </Text>
        ))}
      </View>

      {/* Date grid */}
      {calendarGrid.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((date, dayIndex) => {
            const isCurrentMonth = isSameMonth(date);
            const isTodayDate = isToday(date);
            const isSelectedDate = isSelected(date);
            const isInRange = isWithinRange(date);
            const isDisabled = !isInRange;

            return (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.dateCell,
                  isSelectedDate && styles.selectedDate,
                  isTodayDate && !isSelectedDate && styles.todayDate,
                ]}
                onPress={() => handleDatePress(date)}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateText,
                    !isCurrentMonth && styles.otherMonthText,
                    isDisabled && styles.disabledText,
                    isSelectedDate && styles.selectedDateText,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    paddingVertical: 8,
  },
  week: {
    flexDirection: "row",
  },
  dateCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    margin: 2,
  },
  selectedDate: {
    backgroundColor: "#6c5ce7",
  },
  todayDate: {
    borderWidth: 1.5,
    borderColor: "#6c5ce7",
  },
  dateText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  otherMonthText: {
    color: "#ccc",
  },
  disabledText: {
    color: "#e0e0e0",
  },
  selectedDateText: {
    color: "white",
    fontWeight: "600",
  },
});

