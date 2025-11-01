import React from "react";
import { useOnlinePresence } from "../hooks/useOnlinePresence";

export function OnlinePresenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize online presence tracking
  useOnlinePresence();

  return <>{children}</>;
}
