import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { TimeValue, Meridiem, getRoundedMinutes } from "../utils/dateTime";

interface InlineTimePickerProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 12 }, (_, idx) => idx + 1);
const MINUTES = Array.from({ length: 12 }, (_, idx) =>
  getRoundedMinutes(idx * 5)
);
const MERIDIEM_OPTIONS: Meridiem[] = ["AM", "PM"];

export function InlineTimePicker({
  value,
  onChange,
  disabled = false,
}: InlineTimePickerProps) {
  const ITEM_HEIGHT = 40;
  const VISIBLE_COUNT = 5;
  const spacerHeight = ((VISIBLE_COUNT - 1) / 2) * ITEM_HEIGHT;

  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);
  const meridiemRef = useRef<ScrollView>(null);

  const scrollToIndex = (ref: React.RefObject<ScrollView>, index: number) => {
    ref.current?.scrollTo({
      y: Math.max(index, 0) * ITEM_HEIGHT,
      animated: true,
    });
  };

  useEffect(() => {
    scrollToIndex(hourRef, HOURS.indexOf(value.hour));
    scrollToIndex(minuteRef, MINUTES.indexOf(value.minute));
    scrollToIndex(meridiemRef, MERIDIEM_OPTIONS.indexOf(value.meridiem));
  }, [value.hour, value.minute, value.meridiem]);

  const handleScrollEnd =
    <T,>(
      options: T[],
      selected: T,
      onSelect: (opt: T) => void,
      ref: React.RefObject<ScrollView>
    ) =>
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), options.length - 1);
      const picked = options[clampedIndex];
      if (picked !== selected && !disabled) {
        onSelect(picked);
      } else {
        scrollToIndex(ref, clampedIndex);
      }
    };

  const renderColumn = <T extends number | string>(
    label: string,
    data: T[],
    selected: T,
    onSelect: (opt: T) => void,
    ref: React.RefObject<ScrollView>
  ) => (
    <View style={styles.column}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View
        style={[
          styles.pickerContainer,
          { height: ITEM_HEIGHT * VISIBLE_COUNT },
        ]}
      >
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          scrollEnabled={!disabled}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          onMomentumScrollEnd={handleScrollEnd(data, selected, onSelect, ref)}
          scrollEventThrottle={16}
        >
          <View style={{ height: spacerHeight }} />
          {data.map((item, idx) => {
            const isSelected = item === selected;
            const text =
              typeof item === "number"
                ? item.toString().padStart(2, "0")
                : item;
            return (
              <View
                key={`${item}-${idx}`}
                style={[
                  styles.pickerItem,
                  { height: ITEM_HEIGHT },
                  isSelected && styles.pickerItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.pickerText,
                    isSelected && styles.pickerTextSelected,
                    disabled && styles.optionTextDisabled,
                  ]}
                >
                  {text}
                </Text>
              </View>
            );
          })}
          <View style={{ height: spacerHeight }} />
        </ScrollView>
        <View style={styles.highlightBox} pointerEvents="none" />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <Text style={styles.label}>Time</Text>
      <View style={styles.pickerRow}>
        {renderColumn(
          "Hours",
          HOURS,
          value.hour,
          (hour: number) => onChange({ ...value, hour }),
          hourRef
        )}
        {renderColumn(
          "Minutes",
          MINUTES,
          value.minute,
          (minute: number) => onChange({ ...value, minute }),
          minuteRef
        )}
        {renderColumn(
          "AM / PM",
          MERIDIEM_OPTIONS,
          value.meridiem,
          (meridiem: Meridiem) => onChange({ ...value, meridiem }),
          meridiemRef
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  containerDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    textTransform: "uppercase",
    textAlign: "center",
  },
  pickerContainer: {
    position: "relative",
  },
  pickerItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  pickerText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
  pickerTextSelected: {
    color: "#6c5ce7",
  },
  optionTextDisabled: {
    color: "#999",
  },
  highlightBox: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: -20,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f9fa80",
    pointerEvents: "none",
  },
});
