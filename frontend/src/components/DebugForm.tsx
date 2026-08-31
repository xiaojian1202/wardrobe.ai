import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Bug, ChevronRight } from 'lucide-react';
import type { ItemVerificationPayload } from '../types';

interface DebugFormProps {
  form: Partial<ItemVerificationPayload> | null;
  setForm: React.Dispatch<React.SetStateAction<Partial<ItemVerificationPayload> | null>>;
  verified: boolean;
  onVerify: () => void;
  visible: boolean;
}

export default function DebugForm({ form, setForm, verified, onVerify, visible }: DebugFormProps) {
  if (!visible || !form) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      aria-label="Extraction Inspector"
      className="fixed bottom-8 right-8 z-[100] w-[380px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-stone-900/90 p-8 backdrop-blur-2xl shadow-2xl shadow-black/50"
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500" aria-hidden="true">
            <Bug size={18} />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Extraction Inspector</h2>
            <p className="text-[10px] font-medium text-stone-400 italic">TritonAI Vision Analysis</p>
          </div>
        </div>
        {verified && <CheckCircle2 size={24} className="text-emerald-400" aria-label="Schema verified" />}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onVerify();
        }}
        className="space-y-6"
      >
        {Object.entries(form).map(([key, value], index) => {
          if (key === 'is_clothing' || key === 'id' || key === 'file_path') return null;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="space-y-1.5"
            >
              <label
                htmlFor={`debug-field-${key}`}
                className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 block"
              >
                {key.replace('_', ' ')}
              </label>
              <input
                id={`debug-field-${key}`}
                type="text"
                value={value || ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border-b border-white/15 bg-transparent pb-2 text-sm font-bold text-white outline-none focus:border-amber-400 transition-all placeholder:text-white/10"
              />
            </motion.div>
          );
        })}

        <motion.button
          type="submit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          disabled={!form.category || verified}
          aria-disabled={!form.category || verified}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-amber-600/20 transition-all hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          Verify Schema
          <ChevronRight size={14} aria-hidden="true" />
        </motion.button>
      </form>
    </motion.aside>
  );
}
