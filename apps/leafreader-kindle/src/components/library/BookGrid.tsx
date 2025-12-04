import React from "react";
import { View, StyleSheet, FlatList, Text } from "react-native";
import { BookCard } from "./BookCard";

interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  currentPage: number;
  totalPages: number;
  status: "to_read" | "reading" | "completed" | "paused";
}

interface BookGridProps {
  books: Book[];
  onBookPress: (bookId: string) => void;
  filter?: string;
  searchQuery?: string;
}

export function BookGrid({
  books,
  onBookPress,
  filter = "all",
  searchQuery = "",
}: BookGridProps) {
  // Filter books based on status and search query
  const filteredBooks = books.filter((book) => {
    // Status filter
    if (filter !== "all" && book.status !== filter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const renderBook = ({ item, index }: { item: Book; index: number }) => {
    // Calculate margin for grid layout
    const isMiddleColumn = (index + 1) % 3 === 2;
    const marginHorizontal = isMiddleColumn ? 8 : 0;

    return (
      <View style={{ marginHorizontal }}>
        <BookCard book={item} onPress={onBookPress} />
      </View>
    );
  };

  if (filteredBooks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {searchQuery
            ? `No books found for "${searchQuery}"`
            : filter !== "all"
            ? `No ${filter.replace("_", " ")} books`
            : "No books in your library"}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredBooks}
      renderItem={renderBook}
      keyExtractor={(item) => item.id}
      numColumns={3}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={styles.row}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  row: {
    justifyContent: "space-between",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});


