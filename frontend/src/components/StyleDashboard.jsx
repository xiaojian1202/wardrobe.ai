import React from 'react';
import { Sparkles, Palette, Layers, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Style Dashboard Component
 * Visualizes aggregated wardrobe data using Neumorphic slabs.
 */
export default function StyleDashboard({ stats }) {
  if (!stats) return null;

  const cards = [
    { label: 'Top Vibe', value: stats.top_vibe, icon: Sparkles, color: 'text-soft-accent' },
    { label: 'Top Category', value: stats.top_category, icon: Layers, color: 'text-soft-fg' },
    { label: 'Signature Color', value: stats.top_color, icon: Palette, color: 'text-soft-muted' },
    { label: 'Collection Size', value: `${stats.total} pieces`, icon: PieChart, color: 'text-soft-secondary' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-soft-bg shadow-extruded rounded-[2rem] p-6 flex items-center gap-5 transition-all hover:shadow-extruded-hover"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-bg shadow-inset-sm shrink-0">
            <card.icon size={20} className={card.color} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-muted mb-1 truncate">
              {card.label}
            </p>
            <p className="text-[15px] font-extrabold text-soft-fg truncate capitalize font-display">
              {card.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
