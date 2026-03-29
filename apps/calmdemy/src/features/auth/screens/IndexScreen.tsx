import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@core/providers/contexts/AuthContext";
import { LoadingScreen } from "@shared/ui/LoadingScreen";
import { getHasSeenOnboarding } from "@features/auth/utils/onboardingStorage";

export default function Index() {
  const { user, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    console.log("[Index] mount");
    let isMounted = true;

    getHasSeenOnboarding()
      .then((value) => {
        if (isMounted) {
          console.log("[Index] getHasSeenOnboarding resolved", {
            value,
            userUid: user?.uid ?? null,
            isAnonymous: user?.isAnonymous ?? null,
          });
          setHasSeenOnboarding(value);
        }
      })
      .catch(() => {
        if (isMounted) {
          console.log("[Index] getHasSeenOnboarding failed, defaulting false");
          setHasSeenOnboarding(false);
        }
      });

    return () => {
      isMounted = false;
      console.log("[Index] unmount");
    };
  }, [user?.isAnonymous, user?.uid]);

  useEffect(() => {
    console.log("[Index] state snapshot", {
      loading,
      hasSeenOnboarding,
      userUid: user?.uid ?? null,
      isAnonymous: user?.isAnonymous ?? null,
    });
  }, [hasSeenOnboarding, loading, user?.isAnonymous, user?.uid]);

  if (loading || hasSeenOnboarding === null) {
    console.log("[Index] rendering loading screen");
    return <LoadingScreen message="Preparing your first session..." />;
  }

  if (!hasSeenOnboarding && (!user || user.isAnonymous)) {
    console.log("[Index] redirecting to onboarding");
    return <Redirect href="/onboarding" />;
  }

  console.log("[Index] redirecting to final destination", {
    destination: user ? "/(tabs)/home" : "/login",
  });
  return user ? <Redirect href="/(tabs)/home" /> : <Redirect href="/login" />;
}
