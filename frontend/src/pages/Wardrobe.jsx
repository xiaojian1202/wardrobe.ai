import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Shirt, Tag, Palette, Sparkles, Loader2, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import StyleDashboard from '../components/StyleDashboard';
import { cn } from '../lib/utils';

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedItem]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wardrobeData, statsData] = await Promise.all([
        api.getWardrobe(),
        api.getWardrobeStats()
      ]);
      setItems(wardrobeData);
      setStats(statsData);
    } catch (err) {
      setError("Database connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setIsUpdating(true);
    try {
      await api.verifyItem(selectedItem.id, selectedItem);
      setSelectedItem(null);
      await fetchData(); 
    } catch (err) {
      alert("Failed to update: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.sub_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vibe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center bg-soft-bg">
        <Loader2 className="animate-spin text-soft-accent mb-6" size={56} strokeWidth={1} />
        <p className="text-soft-muted font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Wardrobe...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-20 bg-soft-bg min-h-screen relative">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-12">
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl md:text-7xl font-extrabold font-display italic tracking-tighter leading-none text-soft-fg"
          >
            The <span className="text-soft-accent not-italic">Wardrobe</span>
          </motion.h1>
          <p className="text-soft-muted font-medium text-lg max-w-md leading-relaxed tracking-tight">
            Start your fashion collection today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-full sm:w-[320px]">
            <input 
              type="text" 
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-bg shadow-inset rounded-2xl h-14 px-12 text-sm font-bold text-soft-fg focus:shadow-inset-deep focus:ring-2 focus:ring-soft-accent outline-none transition-all placeholder:text-soft-muted/50"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-muted" />
          </div>
          
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              New Upload
            </Button>
          </Link>
        </div>
      </header>

      {/* DASHBOARD FEATURE (Aggregation Value-Add) */}
      <StyleDashboard stats={stats} />

      {/* Wardrobe Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 sm:gap-14">
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className="group cursor-pointer relative bg-soft-bg shadow-extruded rounded-container overflow-hidden hover:shadow-extruded-hover hover:translate-y-[-4px] active:translate-y-[0.5px] transition-all duration-500"
            >
              <div className="aspect-[4/5] overflow-hidden m-4 rounded-[2rem] bg-soft-bg shadow-inset-sm">
                <img src={api.getImageUrl(item.file_path)} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700" alt={item.sub_category} />
              </div>
              <div className="px-8 pb-10 pt-4">
                <h3 className="text-lg font-extrabold font-display text-soft-fg leading-tight capitalize truncate tracking-tight">
                  {item.sub_category}
                </h3>
                <p className="text-[10px] font-bold text-soft-accent uppercase tracking-widest mt-1 italic">{item.vibe}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* DETAIL / EDIT MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-soft-bg/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-soft-bg shadow-extruded rounded-[3rem] overflow-hidden grid lg:grid-cols-[1fr_400px]"
            >
              <div className="p-8 bg-soft-bg shadow-inset m-6 rounded-[2rem] flex items-center justify-center">
                <img src={api.getImageUrl(selectedItem.file_path)} className="max-h-[60vh] rounded-2xl shadow-extruded-sm" alt="Selected" />
              </div>

              <div className="p-10 space-y-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black font-display text-soft-fg tracking-tight italic">Refine</h2>
                  <button onClick={() => setSelectedItem(null)} className="h-10 w-10 rounded-full shadow-extruded flex items-center justify-center text-soft-muted hover:text-soft-accent transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {['category', 'sub_category', 'color', 'material', 'vibe'].map(key => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-soft-muted ml-1">{key.replace('_', ' ')}</label>
                      <input 
                        type="text" 
                        value={selectedItem[key]} 
                        onChange={(e) => setSelectedItem({...selectedItem, [key]: e.target.value})}
                        className="w-full bg-soft-bg shadow-inset rounded-xl h-11 px-4 text-[14px] font-bold text-soft-fg focus:shadow-inset-deep focus:ring-2 focus:ring-soft-accent outline-none transition-all font-body"
                      />
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleUpdate}
                  variant="primary"
                  disabled={isUpdating}
                  className="w-full h-14"
                >
                  {isUpdating ? 'Saving...' : 'Update Artifact'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
