import React, { useState } from 'react';
import { api } from '../services/api';

export default function Home() {
  const [file, setFile] = useState(null);
  const [itemId, setItemId] = useState(null); 
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      setForm(data.items[0]); // Adapting for single-item list
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
    <div className="max-w-4xl mx-auto p-12 space-y-8 text-white">
      <h1 className="text-3xl font-bold italic text-white">Digital <span className="text-fuchsia-500 text-opacity-100">Atelier</span> Scanner</h1>
      
      <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center bg-slate-900">
        {file ? (
          <div className="space-y-4">
            <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-64 mx-auto rounded shadow-2xl" />
            <p className="text-sm text-slate-400 font-mono">{file.name}</p>
          </div>
        ) : (
          <p className="text-slate-500 text-lg">Select an image to begin.</p>
        )}
        <input type="file" onChange={handleFileChange} className="mt-4 block mx-auto text-sm" accept="image/*" />
      </div>

      {!form ? (
        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full py-4 bg-fuchsia-600 rounded-xl font-bold disabled:bg-slate-800 transition-all hover:bg-fuchsia-500"
        >
          {loading ? 'Synthesizing...' : 'Upload & Identify'}
        </button>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Database ID</label>
              <div className="bg-slate-800 p-3 rounded font-mono text-fuchsia-400">{itemId}</div>
              
              <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest block mt-4">Raw AI Output</label>
              <pre className="bg-black p-4 rounded-lg text-[10px] border border-slate-800 overflow-auto max-h-40">
                {JSON.stringify(form, null, 2)}
              </pre>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] uppercase text-slate-500 font-black tracking-widest block">User Verification</label>
              {Object.keys(form).filter(k => k !== 'id' && k !== 'file_path').map(key => (
                <div key={key}>
                  <p className="text-[10px] text-slate-400 mb-1 capitalize">{key.replace('_', ' ')}</p>
                  <input 
                    type="text" 
                    value={form[key]} 
                    onChange={(e) => setForm({...form, [key]: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 p-3 text-sm rounded focus:border-fuchsia-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleVerify}
            disabled={verifying || success}
            className={`w-full py-4 rounded-xl font-bold transition-all ${success ? 'bg-emerald-600' : 'bg-white text-black hover:bg-fuchsia-500 hover:text-white'}`}
          >
            {verifying ? 'Saving...' : success ? 'Verified & Added to Closet' : 'Confirm & Save to Closet'}
          </button>
        </div>
      )}

      {error && <div className="p-4 bg-rose-900/30 border border-rose-500/50 rounded text-rose-200 text-xs font-bold">{error}</div>}
    </div>
  );
}
