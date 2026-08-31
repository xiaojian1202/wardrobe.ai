import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Upload,
  Scan,
  Loader2,
  X,
  Check,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import { useBatchScanMutation, useVerifyItemMutation } from '../hooks/useWardrobe';
import { cn } from '../lib/utils';
import type { QueueItem, ItemVerificationPayload } from '../types';

interface ValidationPanelProps {
  item: QueueItem | null;
  isLoading: boolean;
  isVerifying: boolean;
  onVerify: (data: ItemVerificationPayload) => Promise<void>;
  currentIndex: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}

function ValidationPanel({
  item,
  isLoading,
  isVerifying,
  onVerify,
  currentIndex,
  totalItems,
  onPrev,
  onNext,
}: ValidationPanelProps) {
  const [formData, setFormData] = useState<ItemVerificationPayload>({
    category: item?.category || '',
    sub_category: item?.sub_category || '',
    color: item?.color || '',
    material: item?.material || '',
    vibe: item?.vibe || '',
  });

  const handleSubmit = async () => {
    if (!item || item.verified) return;
    await onVerify(formData);
  };

  return (
    <aside className="relative" aria-label="Garment Verification">
      <div
        className={cn(
          "sticky top-28 space-y-6 rounded-container bg-soft-bg p-8 shadow-extruded border border-white/20 dark:border-white/5 transition-all duration-500",
          (!item || isLoading) && "opacity-30 grayscale blur-[1px] scale-95 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold font-display leading-tight">Verification</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-muted">
              {item?.verified ? "Verified in Wardrobe" : "Review AI Draft"}
            </p>
          </div>
          {item?.verified && (
            <div className="h-9 w-9 rounded-full bg-soft-secondary flex items-center justify-center text-white shadow-extruded-sm" aria-label="Item verified">
              <Check size={18} strokeWidth={3} aria-hidden="true" />
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          {(['category', 'sub_category', 'color', 'material', 'vibe'] as const).map((key) => (
            <div key={key} className="space-y-1">
              <label
                htmlFor={`verify-${key}`}
                className="text-[9px] font-black uppercase tracking-[0.25em] text-soft-muted ml-1 block"
              >
                {key.replace('_', ' ')}
              </label>
              <input
                id={`verify-${key}`}
                type="text"
                value={formData[key]}
                onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                disabled={item?.verified || isVerifying}
                aria-disabled={item?.verified || isVerifying}
                className="w-full bg-soft-bg shadow-inset rounded-xl h-11 px-4 text-[14px] font-bold text-soft-fg focus:shadow-inset-deep focus:ring-2 focus:ring-soft-accent outline-none transition-all font-body disabled:opacity-70"
              />
            </div>
          ))}
        </form>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            variant={item?.verified ? "success" : "primary"}
            disabled={isVerifying || !item || item.verified}
            className="w-full"
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Verifying...
              </span>
            ) : item?.verified ? (
              "Verified"
            ) : (
              "Verify & Save"
            )}
          </Button>

          <div className="flex justify-between items-center px-1 pt-1" role="group" aria-label="Queue item navigation">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentIndex === 0}
              aria-label="Previous item in queue"
              className="p-1.5 text-soft-muted hover:text-soft-accent disabled:opacity-30 transition-colors focus-visible:ring-2 focus-visible:ring-soft-accent rounded-lg outline-none"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest text-soft-muted" aria-live="polite" aria-atomic="true">
              {totalItems > 0 ? `Item ${currentIndex + 1} of ${totalItems}` : '—'}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={currentIndex >= totalItems - 1}
              aria-label="Next item in queue"
              className="p-1.5 text-soft-muted hover:text-soft-accent disabled:opacity-30 transition-colors focus-visible:ring-2 focus-visible:ring-soft-accent rounded-lg outline-none"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-container bg-soft-bg/80 backdrop-blur-md"
        >
          <Loader2 size={44} className="animate-spin text-soft-accent mb-3" strokeWidth={2} aria-hidden="true" />
          <p className="text-[11px] font-black uppercase tracking-widest text-soft-muted">
            Parallel Ingestion Running...
          </p>
        </div>
      )}
    </aside>
  );
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [batchFinished, setBatchFinished] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const batchScanMutation = useBatchScanMutation();
  const verifyItemMutation = useVerifyItemMutation();

  const currentItem = useMemo(() => queue[currentIndex] || null, [queue, currentIndex]);

  const handleFileSelection = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setFiles(selectedFiles);
    setQueue([]);
    setCurrentIndex(0);
    setError('');
    setBatchFinished(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelection(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (droppedFiles.length > 0) {
        handleFileSelection(droppedFiles);
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setError('');

    try {
      const results = await batchScanMutation.mutateAsync(files);
      const newQueue: QueueItem[] = [];
      const errors: string[] = [];

      results.forEach((res) => {
        if (res.status === 'success' || res.status === 'duplicate') {
          res.items.forEach((item) => {
            newQueue.push({
              ...item,
              filename: res.filename,
              status: res.status,
              verified: item.is_verified,
            });
          });
        } else {
          errors.push(`${res.filename}: ${res.detail || 'Validation rejected'}`);
        }
      });

      if (newQueue.length === 0 && errors.length > 0) {
        throw new Error(errors.join(' | '));
      }

      setQueue(newQueue);
      if (errors.length > 0) {
        setError(`Some items failed: ${errors.join(', ')}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Scanning failed';
      setError(message);
    }
  };

  const handleVerify = async (verifiedFormData: ItemVerificationPayload) => {
    if (!currentItem || currentItem.verified) return;
    setError('');

    try {
      await verifyItemMutation.mutateAsync({
        itemId: currentItem.id,
        data: verifiedFormData,
      });

      const updatedQueue = [...queue];
      updatedQueue[currentIndex] = {
        ...updatedQueue[currentIndex],
        ...verifiedFormData,
        verified: true,
      };
      setQueue(updatedQueue);

      // Advance to next unverified item
      const nextUnverified = updatedQueue.findIndex(
        (item, idx) => idx > currentIndex && !item.verified
      );
      if (nextUnverified !== -1) {
        setCurrentIndex(nextUnverified);
      } else {
        const anyUnverified = updatedQueue.some((item) => !item.verified);
        if (!anyUnverified) {
          setBatchFinished(true);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
    }
  };

  const reset = useCallback(() => {
    setFiles([]);
    setQueue([]);
    setCurrentIndex(0);
    setError('');
    setBatchFinished(false);
  }, []);

  const isLoading = batchScanMutation.isPending;
  const isVerifying = verifyItemMutation.isPending;

  return (
    <div className="relative min-h-screen pt-28 pb-36 px-6 sm:px-8 overflow-hidden">
      {/* Decorative Background Physics */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full shadow-extruded animate-float opacity-40 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] rounded-full shadow-inset-deep opacity-30 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-12">
        {/* Editorial Hero */}
        <section className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-soft-bg shadow-inset-sm text-soft-accent text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles size={14} aria-hidden="true" /> Multi-Modal Single-Item Vision
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tighter leading-none font-display text-soft-fg"
          >
            Catalog your <br />
            <span className="text-soft-accent italic">Aesthetic.</span>
          </motion.h1>
        </section>

        {batchFinished ? (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-2xl text-center space-y-8 py-16 px-8 rounded-container bg-soft-bg shadow-extruded border border-white/20 dark:border-white/5"
          >
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-soft-secondary flex items-center justify-center text-white shadow-extruded animate-bounce" aria-hidden="true">
                <Check size={40} strokeWidth={3} />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display">Batch Ingestion Completed!</h2>
              <p className="text-soft-muted font-medium">
                All garments have been cataloged, verified, and saved to your digital wardrobe.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to="/wardrobe" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full">
                  View Wardrobe
                </Button>
              </Link>
              <Button onClick={reset} variant="secondary" className="w-full sm:w-auto">
                Scan More Pieces
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
            {/* Main Upload / Review Stage */}
            <section className="space-y-8" aria-label="Upload and Queue Stage">
              <AnimatePresence mode="wait">
                {queue.length === 0 ? (
                  <motion.div
                    key="empty-dropzone"
                    tabIndex={0}
                    role="button"
                    aria-label="Upload clothing photos - drag and drop files here, or press Enter to browse"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        document.getElementById('wardrobe-upload')?.click();
                      }
                    }}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    whileHover={{ scale: 1.003 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('wardrobe-upload')?.click()}
                    className={cn(
                      "group relative flex min-h-[460px] cursor-pointer flex-col items-center justify-center rounded-container bg-soft-bg p-8 transition-all duration-500",
                      "focus-visible:ring-2 focus-visible:ring-soft-accent focus-visible:ring-offset-2 outline-none",
                      isDragging
                        ? "shadow-inset-deep ring-2 ring-soft-accent scale-[1.01]"
                        : "shadow-inset-deep hover:shadow-inset"
                    )}
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-soft-bg shadow-extruded group-hover:scale-110 group-active:scale-95 transition-all duration-500 text-soft-muted group-hover:text-soft-accent">
                      <Upload size={32} strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <div className="mt-8 text-center space-y-2">
                      <p className="text-xl font-bold font-display text-soft-fg">
                        {files.length > 0 ? `${files.length} image(s) selected` : "Drag & drop photos or browse"}
                      </p>
                      <p className="text-sm text-soft-muted font-medium">Supports JPEG, PNG, WEBP, and HEIC (up to 10MB each)</p>
                    </div>
                    <input
                      id="wardrobe-upload"
                      type="file"
                      aria-label="Select clothing image files to upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                    />

                    {files.length > 0 && !isLoading && (
                      <div className="mt-8">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpload();
                          }}
                          icon={Scan}
                          variant="primary"
                        >
                          Analyze with TritonVision ({files.length})
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="active-queue-preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-container bg-soft-bg shadow-extruded p-4 border border-white/20 dark:border-white/5">
                      <img
                        src={api.getImageUrl(currentItem?.file_path)}
                        className="h-full w-full rounded-2xl object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-500"
                        alt={currentItem?.sub_category || 'Clothing preview'}
                      />

                      <div className="absolute top-8 left-8 h-10 px-4 rounded-xl bg-soft-bg/90 backdrop-blur-md shadow-extruded-sm flex items-center gap-2 border border-white/10" aria-label={`Item ${currentIndex + 1} of ${queue.length}`}>
                        <span className="text-[11px] font-black uppercase tracking-widest text-soft-muted">
                          {currentIndex + 1} / {queue.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={reset}
                        aria-label="Discard scan queue and reset"
                        className="absolute top-8 right-8 h-11 w-11 rounded-2xl bg-soft-bg shadow-extruded text-soft-muted hover:text-soft-accent transition-all active:shadow-inset-sm active:translate-y-[1px] flex items-center justify-center border border-white/10 focus-visible:ring-2 focus-visible:ring-soft-accent outline-none"
                      >
                        <X size={18} strokeWidth={2.5} aria-hidden="true" />
                      </button>
                    </div>

                    {/* Review Queue Carousel */}
                    <div className="relative" role="region" aria-label="Scan item thumbnails">
                      <div className="flex gap-3 overflow-x-auto pb-4 px-1 no-scrollbar scroll-smooth">
                        {queue.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCurrentIndex(idx)}
                            aria-label={`Select item ${idx + 1}: ${item.sub_category || 'Garment'}`}
                            aria-current={idx === currentIndex ? 'true' : undefined}
                            className={cn(
                              "relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-extruded-sm transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-soft-accent",
                              idx === currentIndex
                                ? "ring-3 ring-soft-accent scale-105"
                                : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100",
                              item.verified && "grayscale-0"
                            )}
                          >
                            <img
                              src={api.getImageUrl(item.file_path)}
                              alt={item.sub_category || `Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {item.verified && (
                              <div className="absolute inset-0 bg-soft-secondary/40 flex items-center justify-center text-white backdrop-blur-[1px]" aria-label="Verified">
                                <Check size={16} strokeWidth={3.5} aria-hidden="true" />
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
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-5 rounded-2xl bg-soft-bg shadow-inset text-soft-muted border-l-4 border-rose-500"
                >
                  <ShieldAlert size={20} className="text-rose-500 shrink-0" aria-hidden="true" />
                  <p className="text-sm font-bold tracking-tight text-soft-fg">{error}</p>
                </motion.div>
              )}
            </section>

            {/* Validation Panel keyed by item.id */}
            <ValidationPanel
              key={currentItem ? `${currentItem.id}-${currentIndex}` : 'none'}
              item={currentItem}
              isLoading={isLoading}
              isVerifying={isVerifying}
              onVerify={handleVerify}
              currentIndex={currentIndex}
              totalItems={queue.length}
              onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setCurrentIndex((prev) => Math.min(queue.length - 1, prev + 1))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
