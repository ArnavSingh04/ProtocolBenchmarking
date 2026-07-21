import React from "react";
import { useTheme } from "../contexts/ThemeContext";

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="6.3" y2="6.3" />
      <line x1="17.7" y1="17.7" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="6.3" y2="17.7" />
      <line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
    </g>
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <path
      d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
      fill="currentColor"
    />
  </svg>
);

function ThemeToggle() {
  const { resolved, toggleTheme } = useTheme();
  const isDark = resolved === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default ThemeToggle;
