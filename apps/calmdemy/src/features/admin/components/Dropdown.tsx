import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { Theme } from '@/theme';

export interface DropdownOption {
  id: string;
  label: string;
  description?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}

export function Dropdown({
  options,
  selectedId,
  onSelect,
  placeholder = 'Select...',
}: DropdownProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.id === selectedId);
  const displayLabel = selectedOption?.label || placeholder;

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.8 }]}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedOption && styles.triggerPlaceholder,
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.colors.textMuted}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleSelect(item.id)}
                  >
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text style={styles.optionDesc} numberOfLines={1}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (theme: Theme) => {
  const screenHeight = Dimensions.get('window').height;
  return StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    triggerText: {
      fontFamily: 'DMSans-Medium',
      fontSize: 15,
      color: theme.colors.text,
      flex: 1,
      marginRight: 8,
    },
    triggerPlaceholder: {
      color: theme.colors.textMuted,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: screenHeight * 0.5,
      paddingBottom: 34, // safe area
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.gray[300],
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 8,
    },
    list: {
      paddingHorizontal: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      marginVertical: 2,
    },
    optionSelected: {
      backgroundColor: theme.colors.surface,
    },
    optionContent: {
      flex: 1,
      marginRight: 12,
    },
    optionLabel: {
      fontFamily: 'DMSans-Medium',
      fontSize: 15,
      color: theme.colors.text,
    },
    optionLabelSelected: {
      fontFamily: 'DMSans-SemiBold',
      color: theme.colors.primary,
    },
    optionDesc: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
  });
};
