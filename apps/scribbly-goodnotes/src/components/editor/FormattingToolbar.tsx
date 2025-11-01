import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface FormattingAction {
  id: string;
  icon?: string;
  text?: string;
  active?: boolean;
  onPress: () => void;
}

interface FormattingToolbarProps {
  actions: FormattingAction[];
  visible?: boolean;
}

export function FormattingToolbar({
  actions,
  visible = true,
}: FormattingToolbarProps) {
  if (!visible) return null;

  const renderAction = (action: FormattingAction) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.toolButton, action.active && styles.toolButtonActive]}
      onPress={action.onPress}
    >
      {action.icon ? (
        <Ionicons
          name={action.icon as any}
          size={20}
          color={action.active ? "#fff" : "#2c3e50"}
        />
      ) : (
        <Text
          style={[
            styles.toolText,
            action.active && styles.toolTextActive,
            action.id === "bold" && styles.boldText,
            action.id === "italic" && styles.italicText,
            action.id === "underline" && styles.underlineText,
          ]}
        >
          {action.text}
        </Text>
      )}
    </TouchableOpacity>
  );

  const groupedActions = actions.reduce((groups, action) => {
    const groupKey = getActionGroup(action.id);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(action);
    return groups;
  }, {} as Record<string, FormattingAction[]>);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.entries(groupedActions).map(([group, groupActions], index) => (
          <View key={group} style={styles.group}>
            {groupActions.map(renderAction)}
            {index < Object.keys(groupedActions).length - 1 && (
              <View style={styles.separator} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function getActionGroup(actionId: string): string {
  const groups: Record<string, string[]> = {
    text: ["bold", "italic", "underline", "strikethrough"],
    heading: ["h1", "h2", "h3", "paragraph"],
    list: ["bullet-list", "numbered-list", "checkbox"],
    insert: ["link", "image", "attachment"],
    special: ["quote", "code", "divider"],
    alignment: ["align-left", "align-center", "align-right"],
  };

  for (const [group, ids] of Object.entries(groups)) {
    if (ids.includes(actionId)) return group;
  }
  return "other";
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
  },
  toolButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  toolButtonActive: {
    backgroundColor: "#00b894",
  },
  toolText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  toolTextActive: {
    color: "#fff",
  },
  boldText: {
    fontWeight: "bold",
  },
  italicText: {
    fontStyle: "italic",
  },
  underlineText: {
    textDecorationLine: "underline",
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: "#ddd",
    marginHorizontal: 8,
  },
});
