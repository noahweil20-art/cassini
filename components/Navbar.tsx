import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCasino } from '../context/CasinoContext';
import { Coins, Dice5, Home, Plus, LogOut, User } from 'lucide-react';
import BankModal from './BankModal';

const Navbar: React.FC = () => {
  const { user, logout } = useCasino();
  const location = useLocation();
  const [isBankOpen, setIsBankOpen] = useState(false);

  // Do not render navbar on login page
  if (!user.isLoggedIn) return null;

  const isActive = (path: string) => location.pathname === path ? 'text-yellow-400' : 'text-gray-400 hover:text-white';

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-700 p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-yellow-500 tracking-wider">
            <Dice5 size={28} />
            <span className="hidden md:inline">ROYAL<span className="text-white">MOCK</span></span>
          </Link>

          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/" className={`hidden md:flex items-center gap-2 font-medium transition-colors ${isActive('/')}`}>
              <Home size={20} /> Lobby
            </Link>
            
            <div className="flex items-center gap-2 bg-slate-800 pl-4 pr-1.5 py-1.5 rounded-full border border-slate-700 shadow-inner">
              <Coins className="text-yellow-400" size={18} />
              <span className="font-mono font-bold text-lg text-white">${user.balance.toLocaleString()}</span>
              <button 
                onClick={() => setIsBankOpen(true)}
                className="ml-2 bg-green-600 hover:bg-green-500 text-white rounded-full p-1 transition-transform hover:scale-105"
                title="Recarregar Saldo"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
               <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                   <User size={16} />
                 </div>
                 <span className="hidden md:inline">{user.username}</span>
               </div>
               <button 
                 onClick={logout}
                 className="text-slate-500 hover:text-red-400 transition-colors p-2"
                 title="Sair"
               >
                 <LogOut size={20} />
               </button>
            </div>
          </div>
        </div>
      </nav>

      <BankModal isOpen={isBankOpen} onClose={() => setIsBankOpen(false)} />
    </>
  );
};

export default Navbar;