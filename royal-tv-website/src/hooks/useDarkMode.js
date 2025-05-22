import { useEffect, useState } from 'react';

export default function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (stored === 'dark' || (!stored && prefersDark)) {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const isDark = root.classList.contains('dark');

    if (isDark) {
      root.classList.contains('dark');

      if (isDark) {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }

      setIsDark(!isDark);
    }
  };
  return [isDark, toggleTheme];
}

// How to use the component:
/* 
import useDarkMode from '@/hooks/useDarkMode';

const ThemeToggle = () => {
  const [isDark, toggleTheme] = useDarkMode();

  return (
    <button onClick={toggleTheme} className="p-2 rounded">
      {isDark ? '🌞 Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}; */
