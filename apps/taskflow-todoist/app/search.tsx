import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { TaskList } from "../src/components/TaskList";
import { EmptyState } from "../src/components/EmptyState";
import { useTasks } from "../src/hooks/useTasks";
import { useProjects } from "../src/hooks/useProjects";
import {
  useTaskFilters,
  FilterOptions,
  SortOptions,
} from "../src/hooks/useTaskFilters";

function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  const { tasks: allTasks, loading, error, toggleTaskComplete } = useTasks();
  const { projects } = useProjects();

  // Apply search filter
  const searchFilterOptions: FilterOptions = {
    ...filterOptions,
    search: searchQuery,
  };

  const { tasks: filteredTasks, stats } = useTaskFilters(
    allTasks,
    searchFilterOptions,
    sortOptions
  );

  const handleToggleComplete = async (id: string) => {
    try {
      await toggleTaskComplete(id);
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleTaskPress = (id: string) => {
    router.push(`/task/${id}`);
  };

  const priorities = [
    { value: "all", label: "All", color: "#666" },
    { value: "low", label: "Low", color: "#95a5a6" },
    { value: "medium", label: "Medium", color: "#3498db" },
    { value: "high", label: "High", color: "#f39c12" },
    { value: "urgent", label: "Urgent", color: "#e74c3c" },
  ];

  const statuses = [
    { value: "all", label: "All" },
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const sortByOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "dueDate", label: "Due Date" },
    { value: "priority", label: "Priority" },
    { value: "alphabetical", label: "Alphabetical" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Tasks</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Ionicons
            name={showFilters ? "filter" : "filter-outline"}
            size={24}
            color="#6c5ce7"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {showFilters && (
        <ScrollView
          style={styles.filtersContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.filterChip,
                    (filterOptions.status || "all") === status.value &&
                      styles.filterChipSelected,
                  ]}
                  onPress={() => {
                    setFilterOptions({
                      ...filterOptions,
                      status: status.value as any,
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      (filterOptions.status || "all") === status.value &&
                        styles.filterChipTextSelected,
                    ]}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Priority Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Priority</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  style={[
                    styles.filterChip,
                    (filterOptions.priority || "all") === priority.value &&
                      styles.filterChipSelected,
                  ]}
                  onPress={() => {
                    setFilterOptions({
                      ...filterOptions,
                      priority: priority.value as any,
                    });
                  }}
                >
                  {priority.value !== "all" && (
                    <Ionicons
                      name="flag"
                      size={16}
                      color={
                        (filterOptions.priority || "all") === priority.value
                          ? "white"
                          : priority.color
                      }
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterChipText,
                      (filterOptions.priority || "all") === priority.value &&
                        styles.filterChipTextSelected,
                    ]}
                  >
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Project Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Project</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !filterOptions.projectId && styles.filterChipSelected,
                ]}
                onPress={() => {
                  setFilterOptions({
                    ...filterOptions,
                    projectId: undefined,
                  });
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !filterOptions.projectId && styles.filterChipTextSelected,
                  ]}
                >
                  All Projects
                </Text>
              </TouchableOpacity>

              {projects
                .filter((p) => !p.isArchived)
                .map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.filterChip,
                      filterOptions.projectId === project.id &&
                        styles.filterChipSelected,
                    ]}
                    onPress={() => {
                      setFilterOptions({
                        ...filterOptions,
                        projectId: project.id,
                      });
                    }}
                  >
                    <View
                      style={[
                        styles.projectDot,
                        { backgroundColor: project.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        filterOptions.projectId === project.id &&
                          styles.filterChipTextSelected,
                      ]}
                    >
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sortByOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      sortOptions.sortBy === option.value &&
                        styles.filterChipSelected,
                    ]}
                    onPress={() => {
                      setSortOptions({
                        ...sortOptions,
                        sortBy: option.value as any,
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        sortOptions.sortBy === option.value &&
                          styles.filterChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.sortOrderButton}
                onPress={() => {
                  setSortOptions({
                    ...sortOptions,
                    sortOrder: sortOptions.sortOrder === "asc" ? "desc" : "asc",
                  });
                }}
              >
                <Ionicons
                  name={
                    sortOptions.sortOrder === "asc" ? "arrow-up" : "arrow-down"
                  }
                  size={20}
                  color="#6c5ce7"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setFilterOptions({});
                setSortOptions({ sortBy: "createdAt", sortOrder: "desc" });
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6c5ce7" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading tasks</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon="search"
            title="No tasks found"
            subtitle={
              searchQuery
                ? `No tasks match "${searchQuery}"`
                : "Try adjusting your filters"
            }
          />
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredTasks.length}{" "}
              {filteredTasks.length === 1 ? "task" : "tasks"} found
            </Text>
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={handleToggleComplete}
              onTaskPress={handleTaskPress}
              showCompletedSeparator={true}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginLeft: 16,
  },
  filterButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: "white",
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipSelected: {
    backgroundColor: "#6c5ce7",
    borderColor: "#6c5ce7",
  },
  filterChipText: {
    fontSize: 14,
    color: "#333",
  },
  filterChipTextSelected: {
    color: "white",
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sortOptions: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortOrderButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterActions: {
    padding: 16,
    alignItems: "center",
  },
  clearFiltersButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  clearFiltersText: {
    fontSize: 14,
    color: "#6c5ce7",
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: "#666",
    padding: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
  },
});

export default function Search() {
  return (
    <ProtectedRoute>
      <SearchScreen />
    </ProtectedRoute>
  );
}


