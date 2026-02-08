export function isCredentialInUseError(code?: string) {
  return code === "auth/credential-already-in-use" || code === "auth/email-already-in-use";
}
