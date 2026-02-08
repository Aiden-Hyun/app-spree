import { statusCodes } from "@react-native-google-signin/google-signin";

const AUTH_DEBUG_URL =
  "http://127.0.0.1:7242/ingest/abd8d170-6f53-45be-bd37-3634e6180c4d";

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

  fetch(AUTH_DEBUG_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId,
    }),
  }).catch(() => {});
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === statusCodes.SIGN_IN_CANCELLED || code === "12501";
}

export function isAppleSignInCancelled(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "ERR_CANCELED" || code === "ERR_REQUEST_CANCELED";
}
