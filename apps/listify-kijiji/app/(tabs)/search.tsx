import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCategories } from "../../src/hooks/useCategories";
import { useListings } from "../../src/hooks/useListings";
import { ListingGrid } from "../../src/components/listings/ListingGrid";

const PRICE_RANGES = [
  { label: "Any", min: undefined, max: undefined },
  { label: "Under $50", min: 0, max: 50 },
  { label: "$50-$100", min: 50, max: 100 },
  { label: "$100-$500", min: 100, max: 500 },
  { label: "$500+", min: 500, max: undefined },
];

const DISTANCES = ["Any distance", "5 km", "10 km", "25 km", "50 km"];
const CONDITIONS = ["Any", "New", "Like New", "Good", "Fair"];

export default function SearchScreen() {
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedDistance, setSelectedDistance] = useState("Any distance");
  const [selectedCondition, setSelectedCondition] = useState("Any");
  const [showFilters, setShowFilters] = useState(false);
  const [activeSearch, setActiveSearch] = useState("");

  // Only fetch when actively searching
  const { listings, loading, refreshing, refresh, loadMore, hasMore } =
    useListings({
      search: activeSearch,
      categoryId: selectedCategory || undefined,
    });

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedPrice(0);
    setSelectedDistance("Any distance");
    setSelectedCondition("Any");
  };

  const categoriesWithAll = [
    { id: "", name: "All", icon: "tag" },
    ...categories,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.searchHeader}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={24} color="#7f8c8d" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for anything..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color="#7f8c8d"
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={24}
              color={showFilters ? "#00b894" : "#7f8c8d"}
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {categoriesWithAll.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.filterChip,
                        selectedCategory === category.id &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCategory === category.id &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Price Range</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {PRICE_RANGES.map((price, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterChip,
                        selectedPrice === index && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedPrice(index)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedPrice === index &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {price.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Condition</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {CONDITIONS.map((cond) => (
                    <TouchableOpacity
                      key={cond}
                      style={[
                        styles.filterChip,
                        selectedCondition === cond && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedCondition(cond)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCondition === cond &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {cond}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear all filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSearch ? (
          <ListingGrid
            listings={listings}
            loading={loading}
            refreshing={refreshing}
            onRefresh={refresh}
            onEndReached={loadMore}
            hasMore={hasMore}
            variant="grid"
            emptyMessage={`No results found for "${activeSearch}"`}
            header={
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsText}>
                  {listings.length} results for "{activeSearch}"
                </Text>
              </View>
            }
          />
        ) : (
          <ScrollView>
            <View style={styles.recentSearches}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity style={styles.recentItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#7f8c8d"
                />
                <Text style={styles.recentText}>iPhone 13</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.recentItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#7f8c8d"
                />
                <Text style={styles.recentText}>Vintage furniture</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.recentItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#7f8c8d"
                />
                <Text style={styles.recentText}>Mountain bike</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.popularSection}>
              <Text style={styles.sectionTitle}>Popular Searches</Text>
              <View style={styles.popularGrid}>
                {[
                  "PS5",
                  "Nintendo Switch",
                  "iPhone",
                  "Laptop",
                  "Furniture",
                  "Bikes",
                ].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.popularItem}
                    onPress={() => {
                      setSearchQuery(item);
                      setActiveSearch(item);
                    }}
                  >
                    <Text style={styles.popularText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  searchHeader: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#2d3436",
  },
  filterButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 48,
    height: 48,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  filtersContainer: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#00b894",
  },
  filterChipText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  filterChipTextActive: {
    color: "white",
  },
  clearButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  clearButtonText: {
    color: "#e74c3c",
    fontSize: 14,
    fontWeight: "500",
  },
  recentSearches: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  recentText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#2d3436",
  },
  popularSection: {
    padding: 20,
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  popularItem: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ecf0f1",
  },
  popularText: {
    fontSize: 14,
    color: "#2d3436",
  },
  resultsHeader: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  resultsText: {
    fontSize: 14,
    color: "#2d3436",
    fontWeight: "500",
  },
});
