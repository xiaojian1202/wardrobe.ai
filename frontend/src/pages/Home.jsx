import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import { Upload, Scan, Loader2, Sparkles, X, Check, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Home() {
  const [file, setFile] = useState(null);
  const [itemId, setItemId] = useState(null); 
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setForm(null);
    setItemId(null);
    setError('');
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.scanImage(file);
      setForm(data.items[0]);
      setItemId(data.items[0]?.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!itemId || !form) return;
    setVerifying(true);
    setError('');
    try {
      await api.verifyItem(itemId, form);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-32 pb-40 px-8 overflow-hidden">
      {/* Decorative Background Physics */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full shadow-extruded animate-float opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] rounded-full shadow-inset-deep opacity-30 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-24">
        {/* Editorial Hero */}
        <section className="text-center space-y-6">
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-none font-display text-soft-fg"
          >
            Catalog your <br/>
            <span className="text-soft-accent italic">Aesthetic.</span>
          </motion.h1>
        </section>

        {/* Upload Station - The Deep Well */}
        <div className="grid gap-16 lg:grid-cols-[1fr_400px]">
          <section className="space-y-10">
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.label
                  key="empty"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  whileHover={{ scale: 1.005 }}
                  htmlFor="upload"
                  className="group relative flex min-h-[480px] cursor-pointer flex-col items-center justify-center rounded-container bg-soft-bg shadow-inset-deep transition-all duration-500 hover:shadow-inset"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-soft-bg shadow-extruded group-hover:scale-110 group-active:scale-95 transition-all duration-500 text-soft-muted group-hover:text-soft-accent">
                    <Upload size={32} strokeWidth={1.5} />
                  </div>
                  <div className="mt-8 text-center">
                    <p className="text-xl font-bold font-display text-soft-fg">Select an item</p>
                    <p className="mt-2 text-sm text-soft-muted font-medium">JPEG, PNG, or HEIC</p>
                  </div>
                  <input id="upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </motion.label>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square overflow-hidden rounded-container bg-soft-bg shadow-extruded p-4"
                >
                  <img src={previewUrl} className="h-full w-full rounded-2xl object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700" alt="Preview" />
                  
                  <button 
                    onClick={() => setFile(null)}
                    className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-soft-bg shadow-extruded text-soft-muted hover:text-soft-accent transition-all active:shadow-inset-sm active:translate-y-[1px] flex items-center justify-center"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>

                  {!form && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-10 inset-x-0 flex justify-center"
                    >
                      <Button onClick={handleUpload} icon={Scan} variant="primary">
                        Upload
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-6 rounded-2xl bg-soft-bg shadow-inset text-soft-muted border-l-4 border-soft-accent"
              >
                <ShieldAlert size={20} className="text-soft-accent" />
                <p className="text-sm font-bold tracking-tight">{error}</p>
              </motion.div>
            )}
          </section>

          {/* Verification Protocol - Extruded Sidebar */}
          <aside className="relative">
            <div className={cn(
              "sticky top-32 space-y-8 rounded-container bg-soft-bg p-10 shadow-extruded transition-all duration-700",
              !form && "opacity-30 grayscale blur-[1px] scale-95 pointer-events-none"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold font-display leading-tight">Validation</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-muted">User modification</p>
                </div>
                {success && (
                  <div className="h-10 w-10 rounded-full bg-soft-secondary flex items-center justify-center text-white shadow-extruded-sm animate-bounce">
                    <Check size={20} strokeWidth={3} />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {form && Object.keys(form)
                  .filter(k => k !== 'id' && k !== 'file_path' && k !== 'is_verified' && k !== 'bounding_box' && k !== 'rejection_reason')
                  .map(key => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-soft-muted ml-1">
                      {key.replace('_', ' ')}
                    </label>
                    <input 
                      type="text" 
                      value={form[key]} 
                      onChange={(e) => setForm({...form, [key]: e.target.value})}
                      className="w-full bg-soft-bg shadow-inset rounded-xl h-12 px-5 text-[15px] font-bold text-soft-fg focus:shadow-inset-deep focus:ring-2 focus:ring-soft-accent outline-none transition-all font-body"
                    />
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleVerify} 
                variant={success ? "success" : "primary"}
                disabled={verifying || success}
                className="w-full"
              >
                {verifying ? "Processing..." : success ? "Verified" : "Submit"}
              </Button>
            </div>

            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-container bg-soft-bg/60 backdrop-blur-md">
                <Loader2 size={48} className="animate-spin text-soft-accent" strokeWidth={1} />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-soft-muted">Neural Synthesis...</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
