import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

interface FilterMenuProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  bookCounts?: {
    all: number;
    reading: number;
    to_read: number;
    completed: number;
    paused?: number;
  };
}

const filters = [
  { id: "all", label: "All" },
  { id: "reading", label: "Reading" },
  { id: "to_read", label: "To Read" },
  { id: "completed", label: "Completed" },
  { id: "paused", label: "Paused" },
];

export function FilterMenu({
  activeFilter,
  onFilterChange,
  bookCounts,
}: FilterMenuProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {filters.map((filter) => {
        const count = bookCounts
          ? bookCounts[filter.id as keyof typeof bookCounts]
          : undefined;
        const isActive = activeFilter === filter.id;

        return (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
            onPress={() => onFilterChange(filter.id)}
          >
            <Text
              style={[
                styles.filterTabText,
                isActive && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
            {count !== undefined && count > 0 && (
              <View style={[styles.badge, isActive && styles.badgeActive]}>
                <Text
                  style={[styles.badgeText, isActive && styles.badgeTextActive]}
                >
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterTabActive: {
    backgroundColor: "#2d3436",
    borderColor: "#2d3436",
  },
  filterTabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "white",
  },
  badge: {
    marginLeft: 8,
    backgroundColor: "#f0f3f7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  badgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  badgeTextActive: {
    color: "white",
  },
});
