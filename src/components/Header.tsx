import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SearchBar } from './SearchBar.jsx';
import { TrendingUp, Layers, LineChart, Star } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  const isLinkActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Identification */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/10 transition-transform group-hover:scale-105">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-lg tracking-tight text-gray-900">
                Stock<span className="text-emerald-600">Lens</span>
              </span>
              <span className="font-mono text-[10px] text-gray-400 -mt-1 tracking-wider uppercase">
                EQUITY ANALYSIS
              </span>
            </div>
          </Link>

          {/* Navigation links for desktops */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-sm font-medium transition-colors ${
                isLinkActive('/') 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Star className="h-4 w-4" />
              Watchlist
            </Link>

            <Link
              to="/screener"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-sm font-medium transition-colors ${
                isLinkActive('/screener') 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Layers className="h-4 w-4" />
              Screener
            </Link>

            <Link
              to="/market"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-sm font-medium transition-colors ${
                isLinkActive('/market') 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <LineChart className="h-4 w-4" />
              Markets
            </Link>
          </nav>
        </div>

        {/* Global Instant Search Bar & Mobile Nav Trigger */}
        <div className="flex items-center gap-4 flex-1 md:flex-none justify-end">
          <div className="w-full max-w-[280px] sm:max-w-xs md:max-w-sm">
            <SearchBar placeholder="Search 200+ global stocks..." />
          </div>
        </div>
      </div>

      {/* Sub-header Mini Mobile Nav bar for perfect compliance on narrow touch targets */}
      <div className="flex md:hidden border-t border-gray-100 bg-gray-50/70 items-center justify-around py-2">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 font-sans text-xs font-semibold ${
            isLinkActive('/') ? 'text-emerald-700' : 'text-gray-500'
          }`}
        >
          <Star className="h-4 w-4" />
          Watchlist
        </Link>
        <Link
          to="/screener"
          className={`flex flex-col items-center gap-0.5 font-sans text-xs font-semibold ${
            isLinkActive('/screener') ? 'text-emerald-700' : 'text-gray-500'
          }`}
        >
          <Layers className="h-4 w-4" />
          Screener
        </Link>
        <Link
          to="/market"
          className={`flex flex-col items-center gap-0.5 font-sans text-xs font-semibold ${
            isLinkActive('/market') ? 'text-emerald-700' : 'text-gray-500'
          }`}
        >
          <LineChart className="h-4 w-4" />
          Markets
        </Link>
      </div>
    </header>
  );
};
