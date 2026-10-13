import { useSyncExternalStore } from "react";
import { currentUser, subscribe } from "../services/store.js";

export function useUser() {
  return useSyncExternalStore(subscribe, currentUser, currentUser);
}
