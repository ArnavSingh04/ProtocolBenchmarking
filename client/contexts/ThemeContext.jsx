import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

const STORAGE_KEY = "theme"; // "light" | "dark" | "system"

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolveTheme(preference) {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return systemPrefersDark() ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState("system");
  const [resolved, setResolved] = useState("light");

  // Read the stored preference once mounted (the pre-hydration script already
  // set the correct attribute, so there is no flash).
  useEffect(() => {
    let stored = "system";
    try {
      stored = localStorage.getItem(STORAGE_KEY) || "system";
    } catch {
      stored = "system";
    }
    setPreference(stored);
    setResolved(resolveTheme(stored));
  }, []);

  // Apply the resolved theme to <html> and persist the preference.
  useEffect(() => {
    const next = resolveTheme(preference);
    setResolved(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
    }
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* ignore storage errors (private mode) */
    }
  }, [preference]);

  // Follow OS changes while in "system" mode.
  useEffect(() => {
    if (preference !== "system" || typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(resolveTheme("system"));
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [preference]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = resolved;
    }
  }, [resolved]);

  const toggleTheme = useCallback(() => {
    // Simple two-state toggle from whatever is currently shown.
    setPreference(resolved === "dark" ? "light" : "dark");
  }, [resolved]);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, toggleTheme }),
    [preference, resolved, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
