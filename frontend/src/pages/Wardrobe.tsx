import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shirt,
  Search,
  X,
  Trash2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import StyleDashboard from '../components/StyleDashboard';
import {
  useWardrobeQuery,
  useWardrobeStatsQuery,
  useVerifyItemMutation,
  useDeleteItemMutation,
} from '../hooks/useWardrobe';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { cn } from '../lib/utils';
import type { ClothingItem } from '../types';

export default function Wardrobe() {
  const { data: items = [], isLoading: itemsLoading, error: itemsError, refetch } = useWardrobeQuery();
  const { data: stats, isLoading: statsLoading } = useWardrobeStatsQuery();

  const verifyItemMutation = useVerifyItemMutation();
  const deleteItemMutation = useDeleteItemMutation();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Focus traps for accessible dialogs
  const deleteModalRef = useFocusTrap<HTMLDivElement>(itemToDelete !== null);
  const editModalRef = useFocusTrap<HTMLDivElement>(selectedItem !== null);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (selectedItem || itemToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem, itemToDelete]);

  // Keyboard accessibility: Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (itemToDelete) setItemToDelete(null);
        else if (selectedItem) setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, itemToDelete]);

  // Derive unique categories for filtering
  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);
    return ['All', ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.sub_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vibe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.material.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      await verifyItemMutation.mutateAsync({
        itemId: selectedItem.id,
        data: selectedItem,
      });
      setSelectedItem(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update item';
      alert(message);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItemMutation.mutateAsync(itemToDelete);
      setItemToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete item';
      alert(message);
    }
  };

  if (itemsLoading && items.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center bg-soft-bg" role="status" aria-live="polite">
        <Loader2 className="animate-spin text-soft-accent mb-6" size={52} strokeWidth={1.5} aria-hidden="true" />
        <p className="text-soft-muted font-bold uppercase tracking-[0.3em] text-xs animate-pulse">
          Syncing Wardrobe Collection...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-20 bg-soft-bg min-h-screen relative transition-colors duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 pt-8">
        <div className="space-y-3 text-left">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-soft-bg shadow-inset-sm text-soft-accent text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles size={13} aria-hidden="true" /> Curated Closet
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold font-display italic tracking-tighter leading-none text-soft-fg"
          >
            The <span className="text-soft-accent not-italic">Wardrobe</span>
          </motion.h1>
          <p className="text-soft-muted font-medium text-base max-w-md leading-relaxed tracking-tight">
            Digital fashion artifacts preserved. Click any item to inspect and edit details.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative w-full sm:w-[300px]">
            <input
              id="wardrobe-search"
              name="wardrobe-search"
              type="search"
              aria-label="Search clothing by vibe, color, or category"
              placeholder="Search by vibe, color, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-bg shadow-inset rounded-2xl h-13 pl-11 pr-10 text-sm font-bold text-soft-fg focus:shadow-inset-deep focus:ring-2 focus:ring-soft-accent outline-none transition-all placeholder:text-soft-muted/60"
            />
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-muted pointer-events-none" aria-hidden="true" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-soft-muted hover:text-soft-fg p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-soft-accent outline-none"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          <Link to="/">
            <Button variant="primary" className="w-full sm:w-auto whitespace-nowrap">
              + New Scan
            </Button>
          </Link>
        </div>
      </header>

      {/* Style Analytics Dashboard */}
      <StyleDashboard stats={stats} isLoading={statsLoading} />

      {/* Category Pills Filter */}
      {categories.length > 2 && (
        <div role="toolbar" aria-label="Category filters" className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <Filter size={15} className="text-soft-muted mr-1 shrink-0" aria-hidden="true" />
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-300 shrink-0",
                "focus-visible:ring-2 focus-visible:ring-soft-accent outline-none",
                selectedCategory === cat
                  ? "bg-soft-accent text-soft-accent-fg shadow-extruded-sm font-black"
                  : "bg-soft-bg text-soft-muted shadow-extruded-sm hover:text-soft-fg hover:scale-[1.02]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {itemsError && (
        <div role="alert" aria-live="assertive" className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center mb-10">
          <p className="text-rose-600 font-bold mb-3">Unable to sync wardrobe from database.</p>
          <Button onClick={() => refetch()} variant="secondary">
            Retry Sync
          </Button>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && !itemsLoading && (
        <div className="mx-auto max-w-lg text-center py-20 px-8 rounded-container bg-soft-bg shadow-extruded space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-soft-bg shadow-inset flex items-center justify-center text-soft-muted">
              <Shirt size={28} aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-display">
              {items.length === 0 ? "Your Closet is Empty" : "No Matching Pieces Found"}
            </h3>
            <p className="text-soft-muted text-sm font-medium">
              {items.length === 0
                ? "Digitize your first fashion pieces using the Vision Scanner."
                : "Try adjusting your search keywords or category filters."}
            </p>
          </div>
          {items.length === 0 ? (
            <Link to="/">
              <Button variant="primary">Start First Scan</Button>
            </Link>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Wardrobe Grid */}
      <section aria-label="Wardrobe Garments Collection" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
        <AnimatePresence>
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative bg-soft-bg shadow-extruded rounded-container overflow-hidden hover:shadow-extruded-hover hover:translate-y-[-3px] active:translate-y-[0.5px] transition-all duration-400 border border-white/20 dark:border-white/5"
            >
              {/* Delete Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setItemToDelete(item.id);
                }}
                aria-label={`Delete ${item.sub_category} (${item.category})`}
                className="absolute top-4 right-4 z-40 h-9 w-9 rounded-xl bg-soft-bg/90 backdrop-blur-md shadow-extruded-sm text-soft-muted hover:text-rose-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all flex items-center justify-center border border-white/10 outline-none focus-visible:ring-2 focus-visible:ring-soft-accent"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>

              <div
                onClick={() => setSelectedItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedItem(item);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${item.sub_category}, Category: ${item.category}, Color: ${item.color}, Vibe: ${item.vibe}`}
                className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-soft-accent rounded-container block"
              >
                <div className="aspect-[4/5] overflow-hidden m-3 rounded-[1.8rem] bg-soft-bg shadow-inset-sm relative">
                  <img
                    src={api.getImageUrl(item.file_path)}
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                    alt={item.sub_category}
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-soft-bg/85 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-soft-accent">
                    {item.category}
                  </div>
                </div>
                <div className="px-5 pb-6 pt-2 text-left">
                  <h3 className="text-base font-extrabold font-display text-soft-fg leading-tight capitalize truncate tracking-tight">
                    {item.sub_category}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold text-soft-accent uppercase tracking-wider">
                      {item.vibe}
                    </span>
                    <span className="text-soft-muted/40 text-xs" aria-hidden="true">•</span>
                    <span className="text-[10px] font-medium text-soft-muted capitalize truncate">
                      {item.color}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* DELETE CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {itemToDelete !== null && (
          <div
            ref={deleteModalRef}
            tabIndex={-1}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-soft-bg/70 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-soft-bg shadow-extruded rounded-[2.5rem] p-10 text-center space-y-6 border border-white/20 dark:border-white/5"
            >
              <div className="mx-auto h-16 w-16 rounded-2xl bg-soft-bg shadow-inset flex items-center justify-center text-rose-500" aria-hidden="true">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h2 id="delete-dialog-title" className="text-2xl font-black font-display tracking-tight">Delete Item?</h2>
                <p id="delete-dialog-desc" className="text-soft-muted text-sm font-medium leading-relaxed px-2">
                  This action is permanent and will remove the garment metadata and cache from your collection.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button onClick={() => setItemToDelete(null)} variant="secondary">
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="danger"
                  disabled={deleteItemMutation.isPending}
                >
                  {deleteItemMutation.isPending ? 'Deleting...' : 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL & EDIT MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div
            ref={editModalRef}
            tabIndex={-1}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            aria-describedby="edit-modal-desc"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-soft-bg/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="relative w-full max-w-4xl bg-soft-bg shadow-extruded rounded-[2.8rem] overflow-hidden grid lg:grid-cols-[1fr_380px] border border-white/20 dark:border-white/5"
            >
              <div className="p-6 bg-soft-bg shadow-inset m-6 rounded-[2rem] flex items-center justify-center overflow-hidden">
                <img
                  src={api.getImageUrl(selectedItem.file_path)}
                  className="max-h-[55vh] rounded-2xl shadow-extruded-sm object-contain"
                  alt={selectedItem.sub_category}
                />
              </div>
              <div className="p-8 space-y-6 text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 id="edit-modal-title" className="text-2xl font-black font-display text-soft-fg tracking-tight italic">
                        Refine Artifact
                      </h2>
                      <p id="edit-modal-desc" className="sr-only">
                        Edit category, sub-category, color, material, and vibe attributes for this garment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      aria-label="Close modal dialog"
                      className="h-9 w-9 rounded-full shadow-extruded flex items-center justify-center text-soft-muted hover:text-soft-accent transition-all focus-visible:ring-2 focus-visible:ring-soft-accent outline-none"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdate();
                    }}
                    className="space-y-3.5"
                  >
                    {(['category', 'sub_category', 'color', 'material', 'vibe'] as const).map((key) => (
                      <div key={key} className="space-y-1">
                        <label
                          htmlFor={`edit-item-${key}`}
                          className="text-[9px] font-black uppercase tracking-[0.25em] text-soft-muted ml-1 block"
                        >
                          {key.replace('_', ' ')}
                        </label>
                        <input
                          id={`edit-item-${key}`}
                          type="text"
                          value={selectedItem[key] || ''}
                          onChange={(e) =>
                            setSelectedItem({ ...selectedItem, [key]: e.target.value })
                          }
                          className="w-full bg-soft-bg shadow-inset rounded-xl h-10 px-3.5 text-[13px] font-bold text-soft-fg focus:shadow-inset-deep focus:ring-2 focus:ring-soft-accent outline-none font-body transition-all"
                        />
                      </div>
                    ))}
                  </form>
                </div>
                <Button
                  onClick={handleUpdate}
                  variant="primary"
                  disabled={verifyItemMutation.isPending}
                  className="w-full h-12"
                >
                  {verifyItemMutation.isPending ? 'Saving Corrections...' : 'Update & Persist'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
