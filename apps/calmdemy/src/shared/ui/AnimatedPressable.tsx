import React, { useRef } from 'react';
import { Animated, Pressable, View, ViewStyle, StyleProp } from 'react-native';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  activeOpacity?: number;
  animated?: boolean;
}

function AnimatedPressableContent({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  scaleValue = 0.97,
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function AnimatedPressable({
  activeOpacity = 0.9,
  animated = true,
  ...props
}: AnimatedPressableProps) {
  if (!animated) {
    return (
      <Pressable
        onPress={props.onPress}
        onLongPress={props.onLongPress}
        disabled={props.disabled}
      >
        {({ pressed }) => (
          <View
            style={[
              props.style,
              {
                opacity: props.disabled ? 0.5 : pressed ? activeOpacity : 1,
              },
            ]}
          >
            {props.children}
          </View>
        )}
      </Pressable>
    );
  }

  return <AnimatedPressableContent activeOpacity={activeOpacity} animated={animated} {...props} />;
}

// Specialized button with bounce effect
interface BounceButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function BounceButton({
  children,
  onPress,
  style,
  disabled = false,
}: BounceButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 12,
      }),
    ]).start(() => {
      if (onPress) onPress();
    });
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
