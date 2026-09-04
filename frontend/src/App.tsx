import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes fresh
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-soft-accent focus:text-white focus:shadow-extruded font-display text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-soft-accent focus:ring-offset-2"
            >
              Skip to main content
            </a>
            <div className="min-h-screen bg-soft-bg text-soft-fg selection:bg-soft-accent/30 font-body transition-colors duration-300">
              <Navbar />
              <AuthModal />
              <main id="main-content" tabIndex={-1} className="outline-none">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/wardrobe" element={<Wardrobe />} />
                </Routes>
              </main>

              {/* Ambient Background Glow */}
              <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 dark:bg-amber-400/10 blur-[130px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-stone-500/5 dark:bg-stone-400/10 blur-[130px] rounded-full" />
              </div>
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
