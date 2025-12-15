import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  LayoutRectangle,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface DateItem {
  date: Date;
  label: string;
  isToday: boolean;
}

interface DropZoneDateStripProps {
  visible: boolean;
  onDateSelected: (date: Date) => void;
  highlightedDate?: Date | null;
}

function generateDates(days: number = 14): DateItem[] {
  const dates: DateItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    let label: string;
    if (i === 0) {
      label = "Today";
    } else if (i === 1) {
      label = "Tomorrow";
    } else {
      label = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    dates.push({
      date,
      label,
      isToday: i === 0,
    });
  }

  return dates;
}

export function DropZoneDateStrip({
  visible,
  onDateSelected,
  highlightedDate,
}: DropZoneDateStripProps) {
  const [dates] = useState<DateItem[]>(generateDates);
  const dateRefs = useRef<Map<number, LayoutRectangle>>(new Map());

  const isDateHighlighted = (date: Date) => {
    if (!highlightedDate) return false;
    return date.toDateString() === highlightedDate.toDateString();
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={16} color="#6c5ce7" />
        <Text style={styles.headerText}>Drop to reschedule</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dateItem,
              item.isToday && styles.dateItemToday,
              isDateHighlighted(item.date) && styles.dateItemHighlighted,
            ]}
            onPress={() => onDateSelected(item.date)}
            onLayout={(e) => {
              dateRefs.current.set(index, e.nativeEvent.layout);
            }}
          >
            <Text
              style={[
                styles.dateLabel,
                item.isToday && styles.dateLabelToday,
                isDateHighlighted(item.date) && styles.dateLabelHighlighted,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f3ff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6c5ce7",
    marginLeft: 6,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  dateItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateItemToday: {
    borderColor: "#6c5ce7",
  },
  dateItemHighlighted: {
    backgroundColor: "#6c5ce7",
    borderColor: "#6c5ce7",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  dateLabelToday: {
    color: "#6c5ce7",
  },
  dateLabelHighlighted: {
    color: "white",
  },
});

