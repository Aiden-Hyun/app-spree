import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useUserSubscriptions } from "../../src/hooks/useSubreddits";
import { postService } from "../../src/services/postService";
import { Subreddit } from "../../src/types";

function CreateScreen() {
  const { user } = useAuth();
  const [postType, setPostType] = React.useState<"text" | "image" | "link">(
    "text"
  );
  const [selectedSubreddit, setSelectedSubreddit] =
    React.useState<Subreddit | null>(null);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [showSubredditPicker, setShowSubredditPicker] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const { subscriptions, loading: subsLoading } = useUserSubscriptions();

  const handleCreatePost = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!selectedSubreddit) {
      Alert.alert("Error", "Please select a subreddit");
      return;
    }
    if (postType === "text" && !content.trim()) {
      Alert.alert("Error", "Please enter some content");
      return;
    }

    try {
      setCreating(true);
      await postService.createPost({
        title: title.trim(),
        content: postType === "text" ? content.trim() : undefined,
        subredditId: selectedSubreddit.id,
        postType,
        url: postType === "link" ? content.trim() : undefined,
      });

      Alert.alert("Success", "Post created!", [
        { text: "OK", onPress: () => router.push("/(tabs)/feed") },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create post"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create a post</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.postTypeSelector}>
          <TouchableOpacity
            style={[
              styles.postTypeButton,
              postType === "text" && styles.postTypeButtonActive,
            ]}
            onPress={() => setPostType("text")}
          >
            <Ionicons
              name="document-text"
              size={20}
              color={postType === "text" ? "#ff4500" : "#666"}
            />
            <Text
              style={[
                styles.postTypeText,
                postType === "text" && styles.postTypeTextActive,
              ]}
            >
              Text
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postTypeButton,
              postType === "image" && styles.postTypeButtonActive,
            ]}
            onPress={() => setPostType("image")}
          >
            <Ionicons
              name="image"
              size={20}
              color={postType === "image" ? "#ff4500" : "#666"}
            />
            <Text
              style={[
                styles.postTypeText,
                postType === "image" && styles.postTypeTextActive,
              ]}
            >
              Image
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postTypeButton,
              postType === "link" && styles.postTypeButtonActive,
            ]}
            onPress={() => setPostType("link")}
          >
            <Ionicons
              name="link"
              size={20}
              color={postType === "link" ? "#ff4500" : "#666"}
            />
            <Text
              style={[
                styles.postTypeText,
                postType === "link" && styles.postTypeTextActive,
              ]}
            >
              Link
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.subredditSelector}
          onPress={() => setShowSubredditPicker(true)}
        >
          <Text style={styles.label}>Choose a community</Text>
          <View style={styles.subredditSelectorContent}>
            <Text style={styles.subredditSelectorText}>
              {selectedSubreddit
                ? `r/${selectedSubreddit.name}`
                : "Select a subreddit"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </View>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="An interesting title"
            value={title}
            onChangeText={setTitle}
            maxLength={300}
            placeholderTextColor="#999"
          />
          <Text style={styles.charCount}>{title.length}/300</Text>
        </View>

        {postType === "text" && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Text (optional)</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Share your thoughts..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {postType === "image" && (
          <TouchableOpacity style={styles.uploadButton}>
            <Ionicons name="cloud-upload" size={24} color="#666" />
            <Text style={styles.uploadText}>Tap to upload image</Text>
          </TouchableOpacity>
        )}

        {postType === "link" && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>URL</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="https://example.com"
              value={content}
              onChangeText={setContent}
              keyboardType="url"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!title || !selectedSubreddit || creating) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={!title || !selectedSubreddit || creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSubredditPicker}
        animationType="slide"
        onRequestClose={() => setShowSubredditPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose a community</Text>
            <TouchableOpacity onPress={() => setShowSubredditPicker(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {subsLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#ff4500" />
            </View>
          ) : subscriptions.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={styles.modalEmptyText}>
                You haven't joined any communities yet
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => {
                  setShowSubredditPicker(false);
                  router.push("/(tabs)/explore");
                }}
              >
                <Text style={styles.exploreButtonText}>
                  Explore Communities
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={subscriptions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.subredditItem}
                  onPress={() => {
                    setSelectedSubreddit(item);
                    setShowSubredditPicker(false);
                  }}
                >
                  <View style={styles.subredditIcon}>
                    <Text style={styles.subredditIconText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.subredditInfo}>
                    <Text style={styles.subredditName}>r/{item.name}</Text>
                    <Text style={styles.subredditMembers}>
                      {item.subscriberCount} members
                    </Text>
                  </View>
                  {selectedSubreddit?.id === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#ff4500"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1b",
  },
  content: {
    padding: 16,
  },
  postTypeSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  postTypeButtonActive: {
    backgroundColor: "#ffe4dc",
  },
  postTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  postTypeTextActive: {
    color: "#ff4500",
  },
  subredditSelector: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  subredditSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  subredditSelectorText: {
    fontSize: 16,
    color: "#1a1a1b",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  titleInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1a1a1b",
  },
  contentInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    color: "#1a1a1b",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  uploadButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: "#ff4500",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1b",
  },
  modalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalEmptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  exploreButton: {
    backgroundColor: "#ff4500",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  subredditItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  subredditIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ff4500",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  subredditIconText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  subredditInfo: {
    flex: 1,
  },
  subredditName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1b",
  },
  subredditMembers: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});

export default function Create() {
  return (
    <ProtectedRoute>
      <CreateScreen />
    </ProtectedRoute>
  );
}
