import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@core/providers/contexts/ThemeContext";
import { useAuth } from "@core/providers/contexts/AuthContext";
import {
  PurchasesPackage,
  useSubscription,
} from "@core/providers/contexts/SubscriptionContext";
import { markOnboardingSeen } from "@features/auth/utils/onboardingStorage";
import { Theme } from "@/theme";

const FREE_CONTENT_ITEMS = [
  { icon: "leaf-outline", label: "Guided meditations" },
  { icon: "moon-outline", label: "Sleep stories" },
  { icon: "musical-notes-outline", label: "White noise" },
] as const;

const COURSE_ITEMS = [
  { icon: "school-outline", label: "Structured self-help" },
  { icon: "sparkles-outline", label: "CBT, ACT, and more" },
  { icon: "checkmark-done-outline", label: "Practical mental tools" },
] as const;

type OnboardingDestination = "/login" | "/(tabs)/home";

const pressableStyle = (
  baseStyle: StyleProp<ViewStyle>,
  pressedStyle?: StyleProp<ViewStyle>
) => ({ pressed }: { pressed: boolean }) => [
  baseStyle,
  pressed && pressedStyle,
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user, loading: authLoading, signInAnonymously } = useAuth();
  const {
    currentOffering,
    purchasePackage,
    isLoading: subscriptionLoading,
  } = useSubscription();

  const [step, setStep] = useState(0);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [pendingPackage, setPendingPackage] =
    useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPreparingGuestCheckout, setIsPreparingGuestCheckout] =
    useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const monthlyPackage =
    currentOffering?.monthly ||
    currentOffering?.availablePackages?.find(
      (pkg) =>
        pkg.identifier === "$rc_monthly" ||
        pkg.identifier.toLowerCase().includes("monthly")
    ) ||
    null;

  const annualPackage =
    currentOffering?.annual ||
    currentOffering?.availablePackages?.find(
      (pkg) =>
        pkg.identifier === "$rc_annual" ||
        pkg.identifier.toLowerCase().includes("annual") ||
        pkg.identifier.toLowerCase().includes("yearly")
    ) ||
    null;

  useEffect(() => {
    if (annualPackage) {
      setSelectedPackage((current) => current ?? annualPackage);
      return;
    }

    if (monthlyPackage) {
      setSelectedPackage((current) => current ?? monthlyPackage);
    }
  }, [annualPackage, monthlyPackage]);

  const annualSavings = useMemo(() => {
    if (!monthlyPackage || !annualPackage) return null;

    const monthlyPrice = monthlyPackage.product.price;
    const annualPrice = annualPackage.product.price;
    const yearlyIfMonthly = monthlyPrice * 12;
    const savings = Math.round(
      ((yearlyIfMonthly - annualPrice) / yearlyIfMonthly) * 100
    );

    return savings > 0 ? savings : null;
  }, [annualPackage, monthlyPackage]);

  const completeOnboarding = useCallback(async (target: OnboardingDestination) => {
    await markOnboardingSeen();
    router.replace(target);
  }, [router]);

  const executePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      setIsPurchasing(true);

      try {
        const success = await purchasePackage(pkg);
        if (success) {
          await completeOnboarding("/(tabs)/home");
        }
      } finally {
        setIsPurchasing(false);
      }
    },
    [completeOnboarding, purchasePackage]
  );

  useEffect(() => {
    if (!pendingPackage || authLoading || !user || subscriptionLoading || isPurchasing) {
      return;
    }

    const pkg = pendingPackage;
    setPendingPackage(null);
    void executePurchase(pkg);
  }, [
    authLoading,
    executePurchase,
    isPurchasing,
    pendingPackage,
    subscriptionLoading,
    user,
  ]);

  const handleNext = useCallback(() => {
    setStep((current) => Math.min(current + 1, 2));
  }, []);

  const handleSignIn = useCallback(async () => {
    await completeOnboarding("/login");
  }, [completeOnboarding]);

  const handleSubscribe = useCallback(async () => {
    if (!selectedPackage || isPurchasing) {
      return;
    }

    if (!user) {
      try {
        setPendingPackage(selectedPackage);
        setIsPreparingGuestCheckout(true);
        await signInAnonymously();
      } catch (error: any) {
        setPendingPackage(null);
        Alert.alert(
          "Unable to start checkout",
          error?.message || "Please try again in a moment."
        );
      } finally {
        setIsPreparingGuestCheckout(false);
      }
      return;
    }

    await executePurchase(selectedPackage);
  }, [executePurchase, isPurchasing, selectedPackage, signInAnonymously, user]);

  const ctaBusy =
    isPurchasing || isPreparingGuestCheckout || (subscriptionLoading && !currentOffering);

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[styles.dot, index === step && styles.dotActive]}
        />
      ))}
    </View>
  );

  const renderFeatureList = (
    items: ReadonlyArray<{
      icon: keyof typeof Ionicons.glyphMap;
      label: string;
    }>
  ) => (
    <View style={styles.featureList}>
      {items.map((item) => (
        <View key={item.label} style={styles.featureRow}>
          <View style={styles.featureIconWrap}>
            <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.featureText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderPlanCard = (
    title: string,
    description: string,
    pkg: PurchasesPackage | null,
    highlight?: string
  ) => {
    const isSelected = selectedPackage?.identifier === pkg?.identifier;

    return (
      <Pressable
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          !pkg && styles.planCardDisabled,
        ]}
        onPress={() => pkg && setSelectedPackage(pkg)}
        disabled={!pkg}
      >
        <View style={styles.planTopRow}>
          <View style={styles.planCopy}>
            <Text style={styles.planTitle}>{title}</Text>
            <Text style={styles.planPrice}>
              {pkg ? pkg.product.priceString : "Loading..."}
              {title === "Monthly" ? "/month" : "/year"}
            </Text>
            <Text style={styles.planDescription}>{description}</Text>
          </View>
          <View
            style={[
              styles.planRadio,
              isSelected && styles.planRadioSelected,
            ]}
          >
            {isSelected && <View style={styles.planRadioInner} />}
          </View>
        </View>

        {highlight ? (
          <View style={styles.highlightBadge}>
            <Text style={styles.highlightText}>{highlight}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderFreeContentStep = () => (
    <>
      <LinearGradient
        colors={
          isDark
            ? [theme.colors.surface, theme.colors.background]
            : [theme.colors.primaryLight, theme.colors.background]
        }
        style={styles.heroPanel}
      >
        <View style={styles.heroIconBubble}>
          <Ionicons name="leaf" size={38} color="#fff" />
        </View>
        <Text style={styles.eyebrow}>Start free</Text>
        <Text style={styles.title}>Free content to begin</Text>
        <Text style={styles.body}>
          Guided meditations, sleep stories, and white noise are available
          without a subscription.
        </Text>
      </LinearGradient>

      {renderFeatureList(FREE_CONTENT_ITEMS)}
    </>
  );

  const renderCoursesStep = () => (
    <>
      <LinearGradient
        colors={
          isDark
            ? [theme.colors.surfaceElevated, theme.colors.background]
            : [theme.colors.secondaryLight, theme.colors.background]
        }
        style={styles.heroPanel}
      >
        <View style={[styles.heroIconBubble, { backgroundColor: theme.colors.secondary }]}>
          <Ionicons name="school" size={38} color="#fff" />
        </View>
        <Text style={styles.eyebrow}>Go beyond meditation</Text>
        <Text style={styles.title}>Psychology-based courses</Text>
        <Text style={styles.body}>
          Explore self-help courses inspired by CBT, ACT, and other practical
          approaches to emotional wellbeing.
        </Text>
      </LinearGradient>

      {renderFeatureList(COURSE_ITEMS)}
    </>
  );

  const renderSubscribeStep = () => (
    <>
      <View style={styles.topBar}>
        <View />
        <Pressable
          onPress={handleSignIn}
          hitSlop={8}
          style={pressableStyle(styles.signInButton, styles.buttonPressed)}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={
          isDark
            ? [theme.colors.primaryDark, theme.colors.background]
            : [theme.colors.accentLight, theme.colors.background]
        }
        style={styles.heroPanel}
      >
        <View style={[styles.heroIconBubble, { backgroundColor: theme.colors.accent }]}>
          <Ionicons name="sparkles" size={38} color="#fff" />
        </View>
        <Text style={styles.eyebrow}>Unlock full access</Text>
        <Text style={styles.title}>Choose your subscription</Text>
        <Text style={styles.body}>
          Subscribe to access every course and the full premium library.
        </Text>
      </LinearGradient>

      <View style={styles.planList}>
        {renderPlanCard("Monthly", "Flexible access", monthlyPackage)}
        {renderPlanCard(
          "Yearly",
          annualSavings ? `Best value · save ${annualSavings}%` : "Best value",
          annualPackage,
          annualSavings ? `Save ${annualSavings}%` : "Best value"
        )}
      </View>

      {!monthlyPackage && !annualPackage ? (
        <Text style={styles.subscriptionHint}>
          Subscription plans are loading. If they do not appear, use Sign In and
          try again from inside the app.
        </Text>
      ) : (
        <Text style={styles.subscriptionHint}>
          Full access includes all courses and the premium meditation, sleep,
          and sound library.
        </Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {step === 0 && renderFreeContentStep()}
        {step === 1 && renderCoursesStep()}
        {step === 2 && renderSubscribeStep()}

        <View style={styles.footer}>
          {renderDots()}

          {step < 2 ? (
            <Pressable
              onPress={handleNext}
              hitSlop={8}
              style={pressableStyle(styles.primaryButton, styles.buttonPressed)}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSubscribe}
              hitSlop={8}
              style={({ pressed }) => [
                styles.primaryButton,
                (!selectedPackage || ctaBusy) && styles.primaryButtonDisabled,
                pressed && !ctaBusy && styles.buttonPressed,
              ]}
              disabled={!selectedPackage || ctaBusy}
            >
              {ctaBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Continue with Subscription
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      justifyContent: "space-between",
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.sm,
    },
    signInButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.sm,
    },
    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    signInButtonText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 14,
      color: theme.colors.text,
    },
    heroPanel: {
      borderRadius: theme.borderRadius.xxl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xxl,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xl,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? theme.colors.border : `${theme.colors.primary}20`,
    },
    heroIconBubble: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.lg,
      ...theme.shadows.md,
    },
    eyebrow: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 13,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      color: theme.colors.textLight,
      marginBottom: theme.spacing.sm,
    },
    title: {
      fontFamily: theme.fonts.display.bold,
      fontSize: 32,
      lineHeight: 38,
      color: theme.colors.text,
      textAlign: "center",
      marginBottom: theme.spacing.md,
    },
    body: {
      fontFamily: theme.fonts.body.regular,
      fontSize: 16,
      lineHeight: 25,
      color: theme.colors.textLight,
      textAlign: "center",
      maxWidth: 320,
    },
    featureList: {
      gap: theme.spacing.md,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: theme.colors.surface,
      ...theme.shadows.sm,
    },
    featureIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
    },
    featureText: {
      flex: 1,
      fontFamily: theme.fonts.ui.medium,
      fontSize: 15,
      color: theme.colors.text,
    },
    planList: {
      gap: theme.spacing.md,
    },
    planCard: {
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    planCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: isDark ? theme.colors.surfaceElevated : "#FFFFFF",
    },
    planCardDisabled: {
      opacity: 0.7,
    },
    planTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    planCopy: {
      flex: 1,
    },
    planTitle: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: 6,
    },
    planPrice: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 24,
      color: theme.colors.text,
      marginBottom: 6,
    },
    planDescription: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.textLight,
    },
    planRadio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    planRadioSelected: {
      borderColor: theme.colors.primary,
    },
    planRadioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    highlightBadge: {
      alignSelf: "flex-start",
      marginTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      backgroundColor: `${theme.colors.primary}16`,
    },
    highlightText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 12,
      color: theme.colors.primaryDark,
    },
    subscriptionHint: {
      marginTop: theme.spacing.md,
      fontFamily: theme.fonts.ui.regular,
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.textLight,
      textAlign: "center",
    },
    footer: {
      paddingTop: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: theme.spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.gray[300],
    },
    dotActive: {
      width: 24,
      backgroundColor: theme.colors.primary,
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.lg,
      ...theme.shadows.md,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.textOnPrimary,
    },
  });
