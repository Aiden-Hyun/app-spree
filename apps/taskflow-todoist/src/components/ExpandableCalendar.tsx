import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  taskDates: Set<string>; // Date strings in toDateString() format
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function ExpandableCalendar({
  selectedDate,
  onDateSelect,
  taskDates,
}: ExpandableCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  // Get the start of the week (Sunday) for a given date
  const getWeekStart = useCallback((date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Get the start of the month
  const getMonthStart = useCallback((date: Date) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Generate week days for the current view
  const weekDays = useMemo(() => {
    const weekStart = getWeekStart(viewDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [viewDate, getWeekStart]);

  // Generate month days for the expanded view
  const monthDays = useMemo(() => {
    const monthStart = getMonthStart(viewDate);
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    
    // Get the first day of the calendar grid (might be from previous month)
    const calendarStart = getWeekStart(monthStart);
    
    // Get how many weeks we need to display
    const weeksNeeded = Math.ceil((monthEnd.getDate() + monthStart.getDay()) / 7);
    
    const days: Date[] = [];
    for (let i = 0; i < weeksNeeded * 7; i++) {
      const day = new Date(calendarStart);
      day.setDate(calendarStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [viewDate, getMonthStart, getWeekStart]);

  // Check if a date is today
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  // Check if a date is selected
  const isSelected = useCallback(
    (date: Date) => {
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    },
    [selectedDate]
  );

  // Check if a date is in the current view month
  const isCurrentMonth = useCallback(
    (date: Date) => {
      return date.getMonth() === viewDate.getMonth();
    },
    [viewDate]
  );

  // Check if a date has tasks
  const hasTask = useCallback(
    (date: Date) => {
      return taskDates.has(date.toDateString());
    },
    [taskDates]
  );

  // Toggle expand/collapse with animation
  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Navigate to previous week/month
  const navigatePrevious = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newDate = new Date(viewDate);
    if (isExpanded) {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setViewDate(newDate);
  }, [viewDate, isExpanded]);

  // Navigate to next week/month
  const navigateNext = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newDate = new Date(viewDate);
    if (isExpanded) {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setViewDate(newDate);
  }, [viewDate, isExpanded]);

  // Handle date selection
  const handleDatePress = useCallback(
    (date: Date) => {
      onDateSelect(date);
      // Update view date to keep the selected date visible
      setViewDate(date);
    },
    [onDateSelect]
  );

  // Format month and year for header
  const headerText = useMemo(() => {
    return viewDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [viewDate]);

  // Render a single day cell
  const renderDayCell = useCallback(
    (date: Date, index: number) => {
      const today = isToday(date);
      const selected = isSelected(date);
      const inMonth = isCurrentMonth(date);
      const hasTaskDot = hasTask(date);

      return (
        <TouchableOpacity
          key={index}
          style={styles.dayCell}
          onPress={() => handleDatePress(date)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.dayCircle,
              today && !selected && styles.todayCircle,
              selected && styles.selectedCircle,
            ]}
          >
            <Text
              style={[
                styles.dayNumber,
                !inMonth && isExpanded && styles.dayNumberFaded,
                today && !selected && styles.todayNumber,
                selected && styles.selectedNumber,
              ]}
            >
              {date.getDate()}
            </Text>
          </View>
          {hasTaskDot && (
            <View
              style={[
                styles.taskDot,
                selected && styles.taskDotSelected,
              ]}
            />
          )}
        </TouchableOpacity>
      );
    },
    [isToday, isSelected, isCurrentMonth, hasTask, handleDatePress, isExpanded]
  );

  // Render week rows for month view
  const renderMonthGrid = useCallback(() => {
    const weeks: Date[][] = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      weeks.push(monthDays.slice(i, i + 7));
    }

    return weeks.map((week, weekIndex) => (
      <View key={weekIndex} style={styles.weekRow}>
        {week.map((day, dayIndex) => renderDayCell(day, weekIndex * 7 + dayIndex))}
      </View>
    ));
  }, [monthDays, renderDayCell]);

  return (
    <View style={styles.container}>
      {/* Header with navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={navigatePrevious}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color="#6c5ce7" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleExpand}
          style={styles.headerCenter}
          activeOpacity={0.7}
        >
          <Text style={styles.headerText}>{headerText}</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#666"
            style={styles.expandIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={navigateNext}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={20} color="#6c5ce7" />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdayHeader}>
        {WEEKDAYS.map((day, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {isExpanded ? (
        // Month view
        <View style={styles.monthGrid}>{renderMonthGrid()}</View>
      ) : (
        // Week view
        <View style={styles.weekRow}>
          {weekDays.map((day, index) => renderDayCell(day, index))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  expandIcon: {
    marginLeft: 6,
  },
  weekdayHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  monthGrid: {
    overflow: "hidden",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: "#6c5ce7",
  },
  selectedCircle: {
    backgroundColor: "#6c5ce7",
    borderRadius: 18,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  dayNumberFaded: {
    color: "#ccc",
  },
  todayNumber: {
    color: "#6c5ce7",
    fontWeight: "700",
  },
  selectedNumber: {
    color: "white",
    fontWeight: "700",
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#6c5ce7",
    marginTop: 2,
  },
  taskDotSelected: {
    backgroundColor: "#a29bfe",
  },
});

