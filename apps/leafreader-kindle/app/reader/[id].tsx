import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useReader } from "../../src/hooks/useReader";
import { PageView } from "../../src/components/reader/PageView";
import { HighlightMenu } from "../../src/components/reader/HighlightMenu";
import { readerService } from "../../src/services/readerService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

function ReaderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const bookId = Array.isArray(id) ? id[0] : id || "";

  const {
    book,
    currentPage,
    totalPages,
    highlights,
    isBookmarked,
    fontSize,
    theme,
    lineHeight,
    loading,
    error,
    progress,
    changePage,
    toggleBookmark,
    createHighlight,
    updateSettings,
    getThemeStyles,
  } = useReader(bookId);

  const [showControls, setShowControls] = useState(false);
  const [pageContent, setPageContent] = useState("");
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [selectedText, setSelectedText] = useState({
    text: "",
    start: 0,
    end: 0,
  });

  // Load page content
  useEffect(() => {
    loadPageContent();
  }, [currentPage, bookId]);

  const loadPageContent = async () => {
    try {
      const content = await readerService.getPageContent(bookId, currentPage);
      setPageContent(content.text);
    } catch (error) {
      console.error("Error loading page content:", error);
    }
  };

  const handlePageChange = (direction: "next" | "prev") => {
    changePage(direction);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleFontSizeChange = (change: number) => {
    const newSize = fontSize + change;
    if (newSize >= 12 && newSize <= 32) {
      updateSettings({ fontSize: newSize });
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "sepia") => {
    updateSettings({ theme: newTheme });
  };

  const handleTextSelection = (selection: {
    text: string;
    start: number;
    end: number;
  }) => {
    setSelectedText(selection);
    setShowHighlightMenu(true);
  };

  const handleHighlightCreated = async () => {
    setShowHighlightMenu(false);
    setSelectedText({ text: "", start: 0, end: 0 });
    await loadPageContent(); // Reload to show new highlight
  };

  const themeStyles = getThemeStyles();

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2d3436" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeStyles.backgroundColor },
      ]}
    >
      <StatusBar hidden={!showControls} />

      {/* Top Controls */}
      {showControls && (
        <View
          style={[
            styles.topControls,
            { backgroundColor: themeStyles.backgroundColor },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeStyles.color} />
          </TouchableOpacity>
          <Text
            style={[styles.bookTitle, { color: themeStyles.color }]}
            numberOfLines={1}
          >
            {book?.title || "Loading..."}
          </Text>
          <TouchableOpacity onPress={toggleBookmark}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isBookmarked ? "#f39c12" : themeStyles.color}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Content Area */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.contentArea}
        onPress={toggleControls}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <PageView
            content={pageContent}
            highlights={highlights}
            onTextSelect={handleTextSelection}
            fontSize={fontSize}
            fontColor={themeStyles.color}
            lineHeight={lineHeight}
          />
        </ScrollView>

        {/* Page Navigation Areas */}
        <TouchableOpacity
          style={styles.prevPageArea}
          onPress={() => handlePageChange("prev")}
          activeOpacity={0}
        />
        <TouchableOpacity
          style={styles.nextPageArea}
          onPress={() => handlePageChange("next")}
          activeOpacity={0}
        />
      </TouchableOpacity>

      {/* Bottom Controls */}
      {showControls && (
        <View
          style={[
            styles.bottomControls,
            { backgroundColor: themeStyles.backgroundColor },
          ]}
        >
          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <Text style={[styles.pageInfo, { color: themeStyles.color }]}>
              Page {currentPage} of {totalPages}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Reading Options */}
          <View style={styles.optionsRow}>
            {/* Font Size */}
            <View style={styles.optionGroup}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleFontSizeChange(-2)}
              >
                <Text
                  style={[styles.fontSizeButton, { color: themeStyles.color }]}
                >
                  A-
                </Text>
              </TouchableOpacity>
              <Text style={[styles.optionLabel, { color: themeStyles.color }]}>
                {fontSize}
              </Text>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleFontSizeChange(2)}
              >
                <Text
                  style={[styles.fontSizeButton, { color: themeStyles.color }]}
                >
                  A+
                </Text>
              </TouchableOpacity>
            </View>

            {/* Theme Selector */}
            <View style={styles.themeSelector}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  styles.lightTheme,
                  theme === "light" && styles.selectedTheme,
                ]}
                onPress={() => handleThemeChange("light")}
              />
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  styles.sepiaTheme,
                  theme === "sepia" && styles.selectedTheme,
                ]}
                onPress={() => handleThemeChange("sepia")}
              />
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  styles.darkTheme,
                  theme === "dark" && styles.selectedTheme,
                ]}
                onPress={() => handleThemeChange("dark")}
              />
            </View>

            {/* More Options */}
            <TouchableOpacity style={styles.optionButton}>
              <Ionicons
                name="settings-outline"
                size={24}
                color={themeStyles.color}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Highlight Menu */}
      <HighlightMenu
        visible={showHighlightMenu}
        onClose={() => setShowHighlightMenu(false)}
        selection={selectedText}
        bookId={bookId}
        pageNumber={currentPage}
        onHighlightCreated={handleHighlightCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  bookTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 16,
  },
  contentArea: {
    flex: 1,
    position: "relative",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  prevPageArea: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.3,
  },
  nextPageArea: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.7,
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  progressSection: {
    marginVertical: 16,
  },
  pageInfo: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3498db",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionButton: {
    padding: 12,
  },
  optionLabel: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  fontSizeButton: {
    fontSize: 18,
    fontWeight: "600",
  },
  themeSelector: {
    flexDirection: "row",
    backgroundColor: "#f0f3f7",
    borderRadius: 20,
    padding: 4,
  },
  themeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  lightTheme: {
    backgroundColor: "#ffffff",
    borderColor: "#ddd",
  },
  sepiaTheme: {
    backgroundColor: "#f4ecd8",
  },
  darkTheme: {
    backgroundColor: "#1a1a1a",
  },
  selectedTheme: {
    borderColor: "#3498db",
    borderWidth: 2,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2d3436",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function Reader() {
  return (
    <ProtectedRoute>
      <ReaderScreen />
    </ProtectedRoute>
  );
}
