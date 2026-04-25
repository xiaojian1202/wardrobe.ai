import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Bug, ChevronRight } from 'lucide-react';

export default function DebugForm({ form, setForm, verified, onVerify, visible }) {
  if (!visible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-8 right-8 z-[100] w-[380px] overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/80 p-8 backdrop-blur-2xl shadow-2xl shadow-black/50"
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-500">
            <Bug size={18} />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Extraction</h2>
            <p className="text-[10px] font-medium text-slate-500 italic">TritonAI Analysis</p>
          </div>
        </div>
        {verified && <CheckCircle2 size={24} className="text-emerald-500" />}
      </div>

      <div className="space-y-6">
        {Object.entries(form).map(([key, value], index) => {
          if (key === 'is_clothing') return null;
          return (
            <motion.div 
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-1.5"
            >
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                {key.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border-b border-white/10 bg-transparent pb-2 text-sm font-bold text-white outline-none focus:border-fuchsia-500 transition-all placeholder:text-white/5"
              />
            </motion.div>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onVerify}
        disabled={!form.category || verified}
        className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-fuchsia-500/20 transition-all hover:bg-fuchsia-500 disabled:opacity-20"
      >
        Verify Schema
        <ChevronRight size={14} />
      </motion.button>
    </motion.div>
  );
}
