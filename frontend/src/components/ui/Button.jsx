import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Neumorphic Button Component
 * Mimics physical depth and tactile feedback through dual-shadow play.
 */
export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled,
  icon: Icon
}) {
  const variants = {
    // High-intent CTA with soft violet gradient
    primary: "bg-soft-accent text-white shadow-extruded hover:bg-soft-accent-light",
    // Standard "Molded" button, part of the base surface
    secondary: "bg-soft-bg text-soft-fg shadow-extruded hover:shadow-extruded-hover",
    // Pressed/Well variant for non-essential actions
    ghost: "bg-transparent text-soft-muted hover:bg-soft-bg hover:shadow-inset-sm",
    // Specialized success variant
    success: "bg-soft-secondary text-white shadow-extruded hover:brightness-105"
  };

  return (
    <motion.button
      // Use whileHover for slight vertical lift, reinforcing the "raised" illusion
      whileHover={!disabled ? { y: -1, scale: 1.01 } : {}}
      // Physical press down moves the element into the surface
      whileTap={!disabled ? { y: 0.5, scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4",
        "text-[13px] font-bold uppercase tracking-[0.15em] font-display transition-all duration-300",
        "outline-none focus-visible:ring-2 focus-visible:ring-soft-accent focus-visible:ring-offset-2 focus-visible:ring-offset-soft-bg",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
        variants[variant],
        className
      )}
    >
      {Icon && <Icon size={18} className="transition-transform group-hover:-translate-y-0.5" />}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
