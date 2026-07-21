import { useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Chart.js colours that follow the active theme. Canvas cannot read CSS custom
 * properties, so we resolve concrete values from the resolved theme here.
 */
export function useChartTheme() {
  const { resolved } = useTheme();

  return useMemo(() => {
    const dark = resolved === "dark";
    return {
      isDark: dark,
      grid: dark ? "rgba(226,232,240,0.10)" : "rgba(15,23,42,0.08)",
      axis: dark ? "#94a3b8" : "#64748b",
      text: dark ? "#e8edf6" : "#0f172a",
      tooltipBg: dark ? "#e2e8f0" : "#0f172a",
      tooltipText: dark ? "#0f172a" : "#f8fafc",
      surface: dark ? "#131a2a" : "#ffffff"
    };
  }, [resolved]);
}
