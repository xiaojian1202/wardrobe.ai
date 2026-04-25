import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shirt, LayoutGrid, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const navItems = [
    { to: '/', label: 'Scanner', icon: PlusCircle },
    { to: '/wardrobe', label: 'Wardrobe', icon: LayoutGrid },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] h-20 bg-soft-bg/80 backdrop-blur-xl border-b border-white/20">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
        {/* Brand Anchor - Extruded Slabs */}
        <NavLink to="/" className="flex items-center gap-3 no-underline group focus-visible:ring-2 focus-visible:ring-soft-accent rounded-xl px-2 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-soft-bg shadow-extruded-sm group-hover:scale-105 group-active:scale-95 transition-all duration-300 text-soft-accent">
            <Shirt size={22} strokeWidth={2.5} />
          </div>
          <span className="text-[19px] font-extrabold tracking-tight text-soft-fg font-display">
            Wardrobe.<span className="text-soft-accent">AI</span>
          </span>
        </NavLink>

        {/* Navigation - Inset Active State */}
        <div className="flex items-center gap-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-2xl px-5 py-2.5 text-[14px] font-bold tracking-wide transition-all duration-300",
                  "focus-visible:ring-2 focus-visible:ring-soft-accent outline-none",
                  isActive 
                    ? "bg-soft-bg text-soft-accent shadow-inset-sm translate-y-[1px]" 
                    : "text-soft-muted hover:text-soft-fg hover:translate-y-[-1px] active:translate-y-[0.5px]"
                )
              }
            >
              <Icon size={18} strokeWidth={2.5} />
              <span className="hidden sm:block font-display">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
