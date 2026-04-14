import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContextObject";

const THEME_STORAGE_KEY = "workoutshedule-theme";
const DEFAULT_THEME = "dark";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeTheme(theme) {
  return theme === "light" ? "light" : "dark";
}

function getInitialTheme() {
  if (!canUseLocalStorage()) {
    return DEFAULT_THEME;
  }

  return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

function applyTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  const normalizedTheme = normalizeTheme(theme);
  document.documentElement.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme =
    normalizedTheme === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    return initialTheme;
  });

  useEffect(() => {
    applyTheme(theme);

    if (canUseLocalStorage()) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDarkTheme: theme === "dark",
      isLightTheme: theme === "light",
      setTheme(nextTheme) {
        setThemeState(normalizeTheme(nextTheme));
      },
      toggleTheme() {
        setThemeState((previousTheme) =>
          previousTheme === "light" ? "dark" : "light",
        );
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
