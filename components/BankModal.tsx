import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Coins, Banknote, ShieldCheck } from 'lucide-react';
import { useCasino } from '../context/CasinoContext';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BankModal: React.FC<BankModalProps> = ({ isOpen, onClose }) => {
  const { user, updateBalance } = useCasino();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDeposit = (amount: number, label: string) => {
    updateBalance(amount);
    setSuccessMsg(`+ $${amount} adicionados!`);
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <div className="flex items-center gap-3 z-10">
              <div className="bg-yellow-500/20 p-2 rounded-xl border border-yellow-500/50">
                <CreditCard className="text-yellow-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Caixa Royal</h2>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Recarga de Fichas</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="z-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-center mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <span className="text-slate-400 text-sm">Saldo Atual</span>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 font-mono mt-1">
                ${user.balance.toLocaleString()}
              </div>
            </div>

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-center bg-green-900/50 text-green-300 text-sm font-bold py-2 rounded-lg border border-green-800"
              >
                {successMsg}
              </motion.div>
            )}

            <div className="space-y-3">
              <button 
                onClick={() => handleDeposit(1000, 'Básico')}
                className="w-full group flex items-center justify-between p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-900/30 p-2 rounded-lg text-blue-400 group-hover:text-blue-300">
                    <Coins size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Pacote Iniciante</div>
                    <div className="text-xs text-slate-500">Recarga Rápida</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-blue-400 text-lg">+$1,000</span>
              </button>

              <button 
                onClick={() => handleDeposit(5000, 'Pro')}
                className="w-full group flex items-center justify-between p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-900/30 p-2 rounded-lg text-purple-400 group-hover:text-purple-300">
                    <Banknote size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Pacote Jogador</div>
                    <div className="text-xs text-slate-500">Bônus Popular</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-purple-400 text-lg">+$5,000</span>
              </button>

              <button 
                onClick={() => handleDeposit(10000, 'VIP')}
                className="w-full group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800 hover:from-yellow-900/20 hover:to-slate-800 border border-slate-700 hover:border-yellow-500 transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-900/30 p-2 rounded-lg text-yellow-400 group-hover:text-yellow-300">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Pacote High Roller</div>
                    <div className="text-xs text-slate-500">Para apostas altas</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-yellow-400 text-lg">+$10,000</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 text-center text-xs text-slate-500">
            Dinheiro fictício. Sem valor real. Divirta-se!
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BankModal;
