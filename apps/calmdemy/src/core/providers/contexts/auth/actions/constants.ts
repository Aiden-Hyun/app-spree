import * as AppleAuthentication from "expo-apple-authentication";

export const APPLE_SCOPES = [
  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
  AppleAuthentication.AppleAuthenticationScope.EMAIL,
];
