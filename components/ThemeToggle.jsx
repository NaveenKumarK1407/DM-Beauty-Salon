'use client';
// Light/dark theme toggle icon for the navbar. Shows a moon in light mode
// (tap to go dark) and a sun in dark mode (tap to go light).
import { useAppearance } from '@/lib/appearance';
import { IconSun, IconMoon } from '@/lib/data';

export function ThemeToggle({ className = '' }) {
  const { tweaks, toggleTheme } = useAppearance();
  const isDark = tweaks.theme === 'dark';
  return (
    <button
      type="button"
      className={'theme-toggle ' + className}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
