import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-fuchsia-500/30">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
          </Routes>
        </main>
        
        {/* Subtle background glow */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full" />
        </div>
      </div>
    </Router>
  );
}

export default App;
