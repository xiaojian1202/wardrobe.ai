import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Shirt, LayoutGrid, PlusCircle, LogIn, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import ThemeToggle from './ui/ThemeToggle';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { to: '/', label: 'Scan', icon: PlusCircle },
    { to: '/wardrobe', label: 'Wardrobe', icon: LayoutGrid },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav aria-label="Main Navigation" className="fixed top-0 left-0 right-0 z-[100] h-20 bg-soft-bg/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5 transition-colors duration-300">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 sm:px-8">
        {/* Brand Anchor - Extruded Slabs */}
        <NavLink
          to="/"
          aria-label="Wardrobe.AI Home"
          className="flex items-center gap-3 no-underline group focus-visible:ring-2 focus-visible:ring-soft-accent rounded-xl px-2 py-1 text-soft-fg"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-soft-bg shadow-extruded-sm group-hover:scale-105 group-active:scale-95 transition-all duration-300 text-soft-accent">
            <Shirt size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <span className="text-[19px] font-extrabold tracking-tight font-display">
            Wardrobe.<span className="text-soft-accent">AI</span>
          </span>
        </NavLink>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2" role="menubar">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-2xl px-4 sm:px-5 py-2.5 text-[14px] font-bold tracking-wide transition-all duration-300",
                    "focus-visible:ring-2 focus-visible:ring-soft-accent outline-none",
                    isActive
                      ? "bg-soft-bg text-soft-accent shadow-inset-sm translate-y-[1px]"
                      : "text-soft-muted hover:text-soft-fg hover:translate-y-[-1px] active:translate-y-[0.5px]"
                  )
                }
              >
                <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
                <span className="hidden sm:block font-display">{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-soft-muted/20 hidden sm:block" />

          {/* Theme Mode Toggle */}
          <ThemeToggle />

          {/* User Auth Section */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-soft-bg hover:bg-slate-100 dark:hover:bg-slate-800 text-soft-fg text-sm font-semibold border border-slate-200/60 dark:border-slate-800 transition-all shadow-sm"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                  {user.email.charAt(0)}
                </div>
                <span className="max-w-[110px] truncate text-xs sm:text-sm font-medium hidden sm:inline-block">
                  {user.email.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-soft-muted" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-2 py-2 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
