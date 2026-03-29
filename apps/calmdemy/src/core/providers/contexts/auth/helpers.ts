import { statusCodes } from "@react-native-google-signin/google-signin";

interface AuthDebugEvent {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
}

export function logAuthDebug({
  location,
  message,
  data,
  hypothesisId = "",
}: AuthDebugEvent) {
  if (!__DEV__) return;

  console.debug("[auth-debug]", {
    location,
    message,
    data,
    timestamp: Date.now(),
    sessionId: "debug-session",
    hypothesisId,
  });
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === statusCodes.SIGN_IN_CANCELLED || code === "12501";
}

export function isAppleSignInCancelled(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "ERR_CANCELED" || code === "ERR_REQUEST_CANCELED";
}
