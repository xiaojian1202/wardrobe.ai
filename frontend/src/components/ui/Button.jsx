import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * A reusable, modular button component with high-fidelity interactions.
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
    primary: "bg-white text-black hover:bg-fuchsia-500 hover:text-white shadow-[0_0_30px_rgba(255,255,255,0.1)]",
    secondary: "bg-slate-900 text-white border border-slate-800 hover:border-fuchsia-500/50 hover:bg-slate-800",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
    emerald: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {Icon && <Icon size={16} className="transition-transform group-hover:-translate-y-0.5" />}
      {children}
    </motion.button>
  );
}
