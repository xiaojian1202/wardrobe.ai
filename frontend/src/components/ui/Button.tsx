import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Neumorphic Button Component
 * Mimics physical depth and tactile feedback through dual-shadow play.
 */
export default function Button({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled = false,
  icon: Icon,
  type = 'button',
  ...props
}: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    // High-intent CTA with dynamic high-contrast foreground
    primary: "bg-soft-accent text-soft-accent-fg shadow-extruded hover:bg-soft-accent-light hover:shadow-extruded-hover",
    // Standard "Molded" button, part of the base surface
    secondary: "bg-soft-bg text-soft-fg shadow-extruded hover:shadow-extruded-hover",
    // Pressed/Well variant for non-essential actions
    ghost: "bg-transparent text-soft-fg hover:bg-soft-bg hover:shadow-inset-sm",
    // Specialized success variant
    success: "bg-soft-secondary text-white shadow-extruded hover:brightness-105",
    // Specialized danger variant
    danger: "bg-rose-700 text-white shadow-extruded hover:bg-rose-600",
  };

  return (
    <motion.button
      type={type}
      whileHover={!disabled ? { y: -1, scale: 1.01 } : undefined}
      whileTap={!disabled ? { y: 0.5, scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        "group relative flex items-center justify-center gap-2.5 rounded-2xl px-7 py-3.5",
        "text-[13px] font-bold uppercase tracking-[0.15em] font-display transition-all duration-300",
        "outline-none focus-visible:ring-2 focus-visible:ring-soft-accent focus-visible:ring-offset-2 focus-visible:ring-offset-soft-bg",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon size={18} className="transition-transform group-hover:-translate-y-0.5" strokeWidth={2.2} aria-hidden="true" />}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
