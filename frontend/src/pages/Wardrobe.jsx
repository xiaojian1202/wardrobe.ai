import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Shirt, Tag, Palette, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Clean Single-Item Wardrobe Gallery
 */
export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWardrobe = async () => {
      try {
        const data = await api.getWardrobe();
        setItems(data);
      } catch (err) {
        setError("Could not load collection.");
      } finally {
        setLoading(false);
      }
    };
    fetchWardrobe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-fuchsia-500 mb-4" size={48} />
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Accessing Atelier...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-white font-['Inter']">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter">
            The <span className="text-fuchsia-500">Collection</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-wide">{items.length} pieces curated</p>
        </div>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-fuchsia-500/50 hover:text-fuchsia-500 transition-all shadow-xl"
        >
          Scan New Piece →
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-slate-900 rounded-[3rem] p-24 text-center bg-slate-950/50">
          <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">Atelier Empty</p>
          <p className="text-slate-700 text-xs mt-2 italic">Upload single pieces to begin</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-10">
          {items.map(item => (
            <div key={item.id} className="group relative bg-slate-950 border border-slate-900 rounded-[2.5rem] overflow-hidden hover:border-fuchsia-500/30 transition-all duration-700 shadow-2xl">
              
              <div className="aspect-[4/5] overflow-hidden relative bg-slate-900">
                <img 
                  src={api.getImageUrl(item.file_path)} 
                  alt={item.sub_category} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                
                <div className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-white">
                  {item.category}
                </div>
              </div>

              {/* Metadata Section */}
              <div className="p-6 space-y-4">
                <h3 className="text-base font-bold text-white leading-tight capitalize truncate">
                  {item.sub_category}
                </h3>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Palette size={10} className="text-slate-700" />
                    <span className="truncate">{item.color}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-fuchsia-500/60 uppercase tracking-widest italic">
                    <Sparkles size={10} />
                    <span className="truncate text-fuchsia-200/80">{item.vibe}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
