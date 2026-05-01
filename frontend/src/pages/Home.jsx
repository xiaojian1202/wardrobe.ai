import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import { 
  Upload, Scan, Loader2, Sparkles, X, Check, 
  ShieldAlert, ChevronLeft, ChevronRight, Layers,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [batchFinished, setBatchFinished] = useState(false);

  const currentItem = useMemo(() => queue[currentIndex] || null, [queue, currentIndex]);

  // Sync form state with current item in queue
  useEffect(() => {
    if (currentItem) {
      // Exclude metadata from form fields
      const { id, filename, status, verified, is_verified, file_path, ...formData } = currentItem;
      setForm(formData);
    } else {
      setForm(null);
    }
  }, [currentIndex, currentItem]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    
    setFiles(selectedFiles);
    setQueue([]);
    setCurrentIndex(0);
    setError('');
    setBatchFinished(false);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const results = await api.batchScanImages(files);
      
      const newQueue = [];
      const errors = [];
      
      results.forEach(res => {
        if (res.status === 'success' || res.status === 'duplicate') {
          res.items.forEach(item => {
            newQueue.push({
              ...item,
              filename: res.filename,
              status: res.status,
              verified: item.is_verified
            });
          });
        } else {
          errors.push(`${res.filename}: ${res.detail}`);
        }
      });

      if (newQueue.length === 0 && errors.length > 0) {
        throw new Error(errors.join(' | '));
      }

      setQueue(newQueue);
      if (errors.length > 0) {
        setError(`Some items failed: ${errors.join(', ')}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!currentItem || !form || currentItem.verified) return;
    setVerifying(true);
    setError('');
    try {
      await api.verifyItem(currentItem.id, form);
      
      const updatedQueue = [...queue];
      updatedQueue[currentIndex].verified = true;
      // Sync form changes back to queue
      Object.assign(updatedQueue[currentIndex], form);
      setQueue(updatedQueue);

      // Advance to next unverified item
      const nextUnverified = updatedQueue.findIndex((item, idx) => idx > currentIndex && !item.verified);
      if (nextUnverified !== -1) {
        setCurrentIndex(nextUnverified);
      } else {
        // If no more unverified items ahead, check if any unverified items exist at all
        const anyUnverified = updatedQueue.some(item => !item.verified);
        if (!anyUnverified) {
          setBatchFinished(true);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setQueue([]);
    setCurrentIndex(0);
    setForm(null);
    setError('');
    setBatchFinished(false);
  };

  return (
    <div className="relative min-h-screen pt-32 pb-40 px-8 overflow-hidden">
      {/* Decorative Background Physics */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full shadow-extruded animate-float opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] rounded-full shadow-inset-deep opacity-30 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-16">
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

        {batchFinished ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-2xl text-center space-y-10 py-20 rounded-container bg-soft-bg shadow-extruded"
          >
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-soft-secondary flex items-center justify-center text-white shadow-extruded animate-bounce">
                <Check size={48} strokeWidth={3} />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold font-display">Upload Completed!</h2>
              <p className="text-soft-muted font-medium">All items have been verified and added to your wardrobe.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/wardrobe">
                <Button variant="primary">View Wardrobe</Button>
              </Link>
              <Button onClick={reset} variant="secondary">Upload More</Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-16 lg:grid-cols-[1fr_400px]">
            {/* Main Stage */}
            <section className="space-y-10">
              <AnimatePresence mode="wait">
                {queue.length === 0 ? (
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
                      <p className="text-xl font-bold font-display text-soft-fg">
                        {files.length > 0 ? `${files.length} items selected` : "Select items"}
                      </p>
                      <p className="mt-2 text-sm text-soft-muted font-medium">JPEG, PNG, or HEIC</p>
                    </div>
                    <input id="upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" multiple />
                    
                    {files.length > 0 && !loading && (
                      <div className="mt-10">
                        <Button onClick={(e) => { e.preventDefault(); handleUpload(); }} icon={Scan} variant="primary">
                          Upload
                        </Button>
                      </div>
                    )}
                  </motion.label>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-container bg-soft-bg shadow-extruded p-4">
                      <img 
                        src={api.getImageUrl(currentItem?.file_path)} 
                        className="h-full w-full rounded-2xl object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700" 
                        alt="Preview" 
                      />
                      
                      <div className="absolute top-8 left-8 h-10 px-4 rounded-xl bg-soft-bg/80 backdrop-blur-md shadow-extruded-sm flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-soft-muted">
                          {currentIndex + 1} / {queue.length}
                        </span>
                      </div>

                      <button 
                        onClick={reset}
                        className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-soft-bg shadow-extruded text-soft-muted hover:text-soft-accent transition-all active:shadow-inset-sm active:translate-y-[1px] flex items-center justify-center"
                      >
                        <X size={20} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Review Queue Carousel */}
                    <div className="relative group">
                      <div className="flex gap-4 overflow-x-auto pb-6 px-2 no-scrollbar scroll-smooth">
                        {queue.map((item, idx) => (
                          <button
                            key={item.id}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                              "relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-extruded-sm transition-all duration-300",
                              idx === currentIndex ? "ring-4 ring-soft-accent scale-105" : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100",
                              item.verified && "grayscale-0"
                            )}
                          >
                            <img src={api.getImageUrl(item.file_path)} className="w-full h-full object-cover" />
                            {item.verified && (
                              <div className="absolute inset-0 bg-soft-secondary/40 flex items-center justify-center text-white">
                                <Check size={16} strokeWidth={4} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
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
                (!form || loading) && "opacity-30 grayscale blur-[1px] scale-95 pointer-events-none"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold font-display leading-tight">Validation</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-muted">
                      {currentItem?.verified ? "Item Verified" : "User modification"}
                    </p>
                  </div>
                  {currentItem?.verified && (
                    <div className="h-10 w-10 rounded-full bg-soft-secondary flex items-center justify-center text-white shadow-extruded-sm">
                      <Check size={20} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {form && Object.keys(form).map(key => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-soft-muted ml-1">
                        {key.replace('_', ' ')}
                      </label>
                      <input 
                        type="text" 
                        value={form[key] || ''} 
                        onChange={(e) => setForm({...form, [key]: e.target.value})}
                        disabled={currentItem?.verified}
                        className="w-full bg-soft-bg shadow-inset rounded-xl h-12 px-5 text-[15px] font-bold text-soft-fg focus:shadow-inset-deep focus:ring-2 focus:ring-soft-accent outline-none transition-all font-body disabled:opacity-70"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={handleVerify} 
                    variant={currentItem?.verified ? "success" : "primary"}
                    disabled={verifying || currentItem?.verified}
                    className="w-full"
                  >
                    {verifying ? "Processing..." : currentItem?.verified ? "Verified" : "Verify & Next"}
                  </Button>

                  <div className="flex justify-between items-center px-2">
                    <button 
                      onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="p-2 text-soft-muted hover:text-soft-accent disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-soft-muted">
                      {currentIndex + 1} / {queue.length}
                    </span>
                    <button 
                      onClick={() => setCurrentIndex(prev => Math.min(queue.length - 1, prev + 1))}
                      disabled={currentIndex === queue.length - 1}
                      className="p-2 text-soft-muted hover:text-soft-accent disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              </div>

              {loading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-container bg-soft-bg/60 backdrop-blur-md">
                  <Loader2 size={48} className="animate-spin text-soft-accent" strokeWidth={1} />
                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-soft-muted">Loading...</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
