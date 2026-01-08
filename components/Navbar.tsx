import React from 'react';
import { Activity, User as UserIcon, LogOut, Search } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onLogoutClick, searchTerm, onSearchChange }) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-medical-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-2 cursor-pointer transition hover:opacity-80 flex-shrink-0">
            <div className="bg-medical-600 p-2 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-medical-700 to-teal-600 hidden sm:block">
              MediVault
            </span>
          </div>

          {/* Global Search Bar - Only visible when logged in */}
          {user && (
             <div className="flex-1 max-w-lg mx-4 md:mx-8">
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-5 w-5 text-slate-400 group-focus-within:text-medical-500 transition-colors" />
                 </div>
                 <input
                   type="text"
                   className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-medical-200 focus:border-medical-500 transition-all duration-200 sm:text-sm"
                   placeholder="Search all uploaded documents..."
                   value={searchTerm}
                   onChange={(e) => onSearchChange(e.target.value)}
                 />
               </div>
             </div>
          )}

          {/* User Controls */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-700">{user.username}</span>
                  <span className="text-xs text-medical-500">Medical Staff</span>
                </div>
                <button
                  onClick={onLogoutClick}
                  className="flex items-center gap-2 px-3 py-2 md:px-4 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-medical-600 hover:bg-medical-700 rounded-full shadow-lg shadow-medical-200 transition-all hover:scale-105 active:scale-95"
              >
                <UserIcon size={18} />
                <span>Client Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};