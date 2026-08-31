import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/useTheme';
import { cn } from '../../lib/utils';
import type { ThemeMode } from '../../types';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const modes: { mode: ThemeMode; label: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' | 'false' }> }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode switcher"
      className="flex items-center gap-1 bg-soft-bg shadow-inset-sm rounded-2xl p-1 border border-white/10"
    >
      {modes.map(({ mode, label, icon: Icon }) => {
        const isActive = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            onClick={() => setTheme(mode)}
            aria-label={`${label} theme`}
            aria-checked={isActive}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
              "focus-visible:ring-2 focus-visible:ring-soft-accent outline-none",
              isActive
                ? "bg-soft-bg text-soft-accent shadow-extruded-sm scale-105 font-bold"
                : "text-soft-muted hover:text-soft-fg hover:scale-100"
            )}
          >
            <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
