import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Highlight } from "../../services/highlightService";

interface PageViewProps {
  content: string;
  highlights: Highlight[];
  onTextSelect?: (selection: {
    text: string;
    start: number;
    end: number;
  }) => void;
  fontSize: number;
  fontColor: string;
  lineHeight: number;
}

export function PageView({
  content,
  highlights,
  onTextSelect,
  fontSize,
  fontColor,
  lineHeight,
}: PageViewProps) {
  const [segments, setSegments] = useState<
    Array<{
      text: string;
      start: number;
      end: number;
      highlight?: Highlight;
    }>
  >([]);

  useEffect(() => {
    // Process content and highlights to create segments
    const processedSegments: typeof segments = [];
    let lastEnd = 0;

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort(
      (a, b) => a.start_position - b.start_position
    );

    sortedHighlights.forEach((highlight) => {
      // Add non-highlighted text before this highlight
      if (highlight.start_position > lastEnd) {
        processedSegments.push({
          text: content.slice(lastEnd, highlight.start_position),
          start: lastEnd,
          end: highlight.start_position,
        });
      }

      // Add highlighted text
      processedSegments.push({
        text: content.slice(highlight.start_position, highlight.end_position),
        start: highlight.start_position,
        end: highlight.end_position,
        highlight,
      });

      lastEnd = highlight.end_position;
    });

    // Add remaining text after last highlight
    if (lastEnd < content.length) {
      processedSegments.push({
        text: content.slice(lastEnd),
        start: lastEnd,
        end: content.length,
      });
    }

    // If no highlights, just add the entire content
    if (highlights.length === 0) {
      processedSegments.push({
        text: content,
        start: 0,
        end: content.length,
      });
    }

    setSegments(processedSegments);
  }, [content, highlights]);

  const getHighlightColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      yellow: "#FFEB3B",
      green: "#4CAF50",
      blue: "#2196F3",
      pink: "#E91E63",
      purple: "#9C27B0",
    };
    return colorMap[color] || colorMap.yellow;
  };

  const handleLongPress = (segment: (typeof segments)[0]) => {
    if (!segment.highlight && onTextSelect) {
      // Simple text selection simulation
      // In a real implementation, you'd use a more sophisticated text selection mechanism
      onTextSelect({
        text: segment.text,
        start: segment.start,
        end: segment.end,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text
        style={{
          fontSize,
          color: fontColor,
          lineHeight: fontSize * lineHeight,
        }}
      >
        {segments.map((segment, index) => (
          <Text
            key={index}
            style={
              segment.highlight
                ? {
                    backgroundColor: getHighlightColor(segment.highlight.color),
                    opacity: 0.8,
                  }
                : undefined
            }
            onLongPress={() => handleLongPress(segment)}
          >
            {segment.text}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});


