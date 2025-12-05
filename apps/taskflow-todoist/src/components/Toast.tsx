import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastContext, Toast as ToastType } from '../contexts/ToastContext';

const { width } = Dimensions.get('window');
const TOAST_WIDTH = Math.min(width - 32, 400);
const BASE_BOTTOM = 80; // Distance from bottom for toast stack

const toastConfig = {
  success: {
    color: '#10b981',
    icon: 'checkmark-circle' as const,
  },
  error: {
    color: '#ef4444',
    icon: 'close-circle' as const,
  },
  warning: {
    color: '#f59e0b',
    icon: 'warning' as const,
  },
  info: {
    color: '#3b82f6',
    icon: 'information-circle' as const,
  },
};

function ToastItem({
  toast,
  bottomOffset,
  zIndex,
  onDismiss,
}: {
  toast: ToastType;
  bottomOffset: number;
  zIndex: number;
  onDismiss: (id: string) => void;
}) {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide up and fade in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
          tension: 70,
          friction: 12,
      }),
      Animated.timing(opacity, {
        toValue: 1,
          duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismissToast = () => {
    // Slide down and fade out
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 40,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  // Swipe down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          // Swiped down enough to dismiss
          dismissToast();
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const config = toastConfig[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          opacity,
          transform: [{ translateY }],
          zIndex,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.toast, { borderLeftColor: config.color }]}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        
        <Text style={styles.message}>{toast.message}</Text>
        
        <TouchableOpacity
          onPress={dismissToast}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export function Toast() {
  const { toasts, hideToast } = useToastContext();

  if (toasts.length === 0) {
    return null;
  }

  // toasts array is newest-first (we prepend in context). Render in that order,
  // and overlap all toasts at the same bottom offset. zIndex ensures newest is on top.

  return (
    <>
      {toasts.map((toast, index) => {
        const bottomOffset = BASE_BOTTOM;
        const zIndex = 10000 + (toasts.length - index); // newest (index 0) highest

        return (
          <ToastItem
            key={toast.id}
            toast={toast}
            bottomOffset={bottomOffset}
            zIndex={zIndex}
            onDismiss={hideToast}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    width: TOAST_WIDTH,
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

