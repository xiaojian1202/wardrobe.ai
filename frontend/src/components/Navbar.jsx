import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
      <div className="text-xl font-bold text-white">FitCheck <span className="text-fuchsia-500">Debug</span></div>
      <div className="flex gap-4">
        <NavLink to="/" className={({ isActive }) => isActive ? "text-fuchsia-500 font-bold" : "text-slate-400"}>Home</NavLink>
        <NavLink to="/wardrobe" className={({ isActive }) => isActive ? "text-fuchsia-500 font-bold" : "text-slate-400"}>Wardrobe</NavLink>
      </div>
    </nav>
  );
}
