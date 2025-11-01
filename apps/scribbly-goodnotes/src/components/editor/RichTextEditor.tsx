import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RichTextEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  link?: string;
}

interface TextBlock {
  id: string;
  type: "paragraph" | "heading" | "list" | "code" | "quote";
  content: string;
  style?: TextStyle;
  level?: number; // For headings and lists
}

export function RichTextEditor({
  initialContent = "",
  onChange,
  placeholder = "Start writing...",
  autoFocus = false,
}: RichTextEditorProps) {
  const [blocks, setBlocks] = useState<TextBlock[]>([
    {
      id: "1",
      type: "paragraph",
      content: initialContent,
    },
  ]);
  const [activeBlockId, setActiveBlockId] = useState<string>("1");
  const [activeStyles, setActiveStyles] = useState<TextStyle>({});
  const [showFormattingBar, setShowFormattingBar] = useState(true);

  // Convert blocks to HTML
  const blocksToHtml = (blocks: TextBlock[]): string => {
    return blocks
      .map((block) => {
        let content = block.content;

        // Apply inline styles
        if (block.style?.bold) content = `<strong>${content}</strong>`;
        if (block.style?.italic) content = `<em>${content}</em>`;
        if (block.style?.underline) content = `<u>${content}</u>`;
        if (block.style?.strikethrough) content = `<s>${content}</s>`;
        if (block.style?.code) content = `<code>${content}</code>`;
        if (block.style?.link) {
          content = `<a href="${block.style.link}">${content}</a>`;
        }

        // Apply block types
        switch (block.type) {
          case "heading":
            return `<h${block.level || 1}>${content}</h${block.level || 1}>`;
          case "list":
            return `<li>${content}</li>`;
          case "code":
            return `<pre><code>${content}</code></pre>`;
          case "quote":
            return `<blockquote>${content}</blockquote>`;
          default:
            return `<p>${content}</p>`;
        }
      })
      .join("\n");
  };

  useEffect(() => {
    const html = blocksToHtml(blocks);
    onChange(html);
  }, [blocks]);

  const updateBlock = (id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, content } : block))
    );
  };

  const toggleStyle = (style: keyof TextStyle) => {
    setActiveStyles((prev) => ({
      ...prev,
      [style]: !prev[style],
    }));

    // Apply style to active block
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === activeBlockId
          ? {
              ...block,
              style: {
                ...block.style,
                [style]: !block.style?.[style],
              },
            }
          : block
      )
    );
  };

  const changeBlockType = (type: TextBlock["type"], level?: number) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === activeBlockId ? { ...block, type, level } : block
      )
    );
  };

  const insertBlock = (type: TextBlock["type"] = "paragraph") => {
    const newBlock: TextBlock = {
      id: Date.now().toString(),
      type,
      content: "",
    };

    const activeIndex = blocks.findIndex((b) => b.id === activeBlockId);
    const newBlocks = [...blocks];
    newBlocks.splice(activeIndex + 1, 0, newBlock);
    setBlocks(newBlocks);
    setActiveBlockId(newBlock.id);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length === 1) return; // Keep at least one block

    const index = blocks.findIndex((b) => b.id === id);
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);

    // Set focus to previous or next block
    if (index > 0) {
      setActiveBlockId(blocks[index - 1].id);
    } else if (index < blocks.length - 1) {
      setActiveBlockId(blocks[index + 1].id);
    }
  };

  const insertLink = () => {
    Alert.prompt(
      "Insert Link",
      "Enter the URL:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Insert",
          onPress: (url) => {
            if (url) {
              setActiveStyles((prev) => ({
                ...prev,
                link: url,
              }));
            }
          },
        },
      ],
      "plain-text"
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {showFormattingBar && (
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Text Styles */}
            <TouchableOpacity
              style={[
                styles.toolButton,
                activeStyles.bold && styles.toolButtonActive,
              ]}
              onPress={() => toggleStyle("bold")}
            >
              <Text style={[styles.toolText, styles.boldText]}>B</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                activeStyles.italic && styles.toolButtonActive,
              ]}
              onPress={() => toggleStyle("italic")}
            >
              <Text style={[styles.toolText, styles.italicText]}>I</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                activeStyles.underline && styles.toolButtonActive,
              ]}
              onPress={() => toggleStyle("underline")}
            >
              <Text style={[styles.toolText, styles.underlineText]}>U</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                activeStyles.strikethrough && styles.toolButtonActive,
              ]}
              onPress={() => toggleStyle("strikethrough")}
            >
              <Text style={[styles.toolText, styles.strikethroughText]}>S</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Block Types */}
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => changeBlockType("heading", 1)}
            >
              <Text style={styles.toolText}>H1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => changeBlockType("heading", 2)}
            >
              <Text style={styles.toolText}>H2</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => changeBlockType("heading", 3)}
            >
              <Text style={styles.toolText}>H3</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Lists and Special */}
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => changeBlockType("list")}
            >
              <Ionicons name="list" size={20} color="#2c3e50" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => changeBlockType("quote")}
            >
              <Ionicons name="chatbox-outline" size={20} color="#2c3e50" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => changeBlockType("code")}
            >
              <Ionicons name="code-slash" size={20} color="#2c3e50" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton} onPress={insertLink}>
              <Ionicons name="link" size={20} color="#2c3e50" />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Actions */}
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => insertBlock()}
            >
              <Ionicons name="add" size={20} color="#2c3e50" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.editorContainer}
        keyboardShouldPersistTaps="handled"
      >
        {blocks.map((block, index) => (
          <View key={block.id} style={styles.blockContainer}>
            <TextInput
              style={[
                styles.textInput,
                block.type === "heading" && styles[`heading${block.level}`],
                block.type === "quote" && styles.quote,
                block.type === "code" && styles.code,
                block.type === "list" && styles.list,
                block.style?.bold && styles.boldText,
                block.style?.italic && styles.italicText,
                block.style?.underline && styles.underlineText,
                block.style?.strikethrough && styles.strikethroughText,
              ]}
              value={block.content}
              onChangeText={(text) => updateBlock(block.id, text)}
              onFocus={() => setActiveBlockId(block.id)}
              placeholder={index === 0 ? placeholder : "Continue writing..."}
              placeholderTextColor="#95a5a6"
              multiline
              autoFocus={autoFocus && index === 0}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Enter" && !block.content) {
                  insertBlock();
                }
              }}
            />

            {blocks.length > 1 && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteBlock(block.id)}
              >
                <Ionicons name="close-circle" size={20} color="#e74c3c" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toolButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
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
  separator: {
    width: 1,
    height: 30,
    backgroundColor: "#ddd",
    marginHorizontal: 8,
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  blockContainer: {
    marginBottom: 8,
    position: "relative",
  },
  textInput: {
    fontSize: 16,
    color: "#2c3e50",
    lineHeight: 24,
    paddingVertical: 4,
  },
  heading1: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  heading2: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  heading3: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  quote: {
    borderLeftWidth: 4,
    borderLeftColor: "#00b894",
    paddingLeft: 16,
    fontStyle: "italic",
    color: "#555",
  },
  code: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 4,
  },
  list: {
    paddingLeft: 20,
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
  strikethroughText: {
    textDecorationLine: "line-through",
  },
  deleteButton: {
    position: "absolute",
    right: 0,
    top: 4,
    padding: 4,
  },
});
