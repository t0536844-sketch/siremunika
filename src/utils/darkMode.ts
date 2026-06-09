/**
 * Utility: apply dark mode class to <html>
 * Called from AppContext whenever theme changes.
 */
export function applyDarkMode(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
