import { LayoutAnimation, Platform, UIManager } from "react-native";

let isAnimationEnabled = false;

const ensureEnabled = () => {
  if (
    Platform.OS === "android" &&
    !isAnimationEnabled &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
    isAnimationEnabled = true;
  }
};

export const animateListChanges = () => {
  ensureEnabled();
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};

