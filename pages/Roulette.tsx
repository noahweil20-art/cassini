import React, { useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCw, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RouletteBet } from '../types';

// Standard European Roulette Numbers order for visual reference (simplified logic uses index)
// Red numbers: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (n: number) => {
  if (n === 0) return 'green';
  return RED_NUMBERS.includes(n) ? 'red' : 'black';
};

const CHIPS = [10, 50, 100, 500];

const Roulette: React.FC = () => {
  const { user, updateBalance } = useCasino();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [selectedChip, setSelectedChip] = useState(10);
  const [message, setMessage] = useState('');

  const totalBet = bets.reduce((acc, bet) => acc + bet.amount, 0);

  const placeBet = (type: RouletteBet['type'], value: string | number) => {
    if (spinning) return;
    if (user.balance < totalBet + selectedChip) {
      setMessage("Saldo insuficiente para adicionar fichas!");
      return;
    }
    setMessage('');
    
    setBets(prev => {
      // Check if bet already exists to stack it
      const existing = prev.find(b => b.type === type && b.value === value);
      if (existing) {
        return prev.map(b => b === existing ? { ...b, amount: b.amount + selectedChip } : b);
      }
      return [...prev, { type, value, amount: selectedChip }];
    });
  };

  const clearBets = () => {
    if (spinning) return;
    setBets([]);
    setMessage('');
  };

  const spinWheel = () => {
    if (bets.length === 0) {
      setMessage("Faça uma aposta primeiro!");
      return;
    }
    if (user.balance < totalBet) {
      setMessage("Saldo insuficiente!");
      return;
    }

    // Deduct balance
    updateBalance(-totalBet);
    setMessage("Girando...");
    setSpinning(true);
    setResultNumber(null);

    // Random result 0-36
    const winNum = Math.floor(Math.random() * 37);
    
    // Calculate rotation: 
    // Add 5-10 full spins (360 * 5) + random angle
    const randomSpins = 1800 + Math.random() * 360; 
    setRotation(prev => prev + randomSpins);

    setTimeout(() => {
      setSpinning(false);
      setResultNumber(winNum);
      resolveBets(winNum);
    }, 3000);
  };

  const resolveBets = (winNum: number) => {
    let winnings = 0;
    const winColor = getNumberColor(winNum);
    const winParity = winNum === 0 ? 'none' : (winNum % 2 === 0 ? 'even' : 'odd');

    bets.forEach(bet => {
      let won = false;
      let multiplier = 0;

      if (bet.type === 'number' && bet.value === winNum) {
        won = true;
        multiplier = 35; // Pays 35 to 1
      } else if (bet.type === 'color' && bet.value === winColor) {
        won = true;
        multiplier = 1; // Pays 1 to 1
      } else if (bet.type === 'parity' && bet.value === winParity) {
        won = true;
        multiplier = 1; // Pays 1 to 1
      }

      if (won) {
        // Return original bet + profit
        winnings += bet.amount + (bet.amount * multiplier);
      }
    });

    if (winnings > 0) {
      updateBalance(winnings);
      setMessage(`O número foi ${winNum} (${winColor === 'red' ? 'Vermelho' : winColor === 'black' ? 'Preto' : 'Verde'}). Você ganhou $${winnings}!`);
    } else {
      setMessage(`O número foi ${winNum}. Tente novamente!`);
    }
  };

  const renderNumberGrid = () => {
    const grid = [];
    for (let i = 1; i <= 36; i++) {
      const color = getNumberColor(i);
      const activeBet = bets.find(b => b.type === 'number' && b.value === i);
      
      grid.push(
        <button
          key={i}
          onClick={() => placeBet('number', i)}
          disabled={spinning}
          className={`
            relative h-12 md:h-16 flex items-center justify-center font-bold text-lg md:text-xl border border-slate-600 rounded
            ${color === 'red' ? 'bg-red-700 hover:bg-red-600' : 'bg-slate-900 hover:bg-slate-800'}
            transition-colors
          `}
        >
          {i}
          {activeBet && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-black text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg border border-white z-10">
              ${activeBet.amount}
            </div>
          )}
        </button>
      );
    }
    return grid;
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center p-4 pb-20">
      <Link to="/" className="absolute top-24 left-4 md:left-12 flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </Link>

      <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-8 mt-8">
        ROLETA EUROPEIA
      </h1>

      <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start w-full max-w-6xl">
        
        {/* Wheel Section */}
        <div className="flex flex-col items-center">
          <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full border-8 border-yellow-700 shadow-2xl bg-slate-900 overflow-hidden">
             {/* Simple Wheel Representation */}
             <motion.div 
               className="w-full h-full rounded-full"
               style={{ 
                 background: 'conic-gradient(green 0deg 9.7deg, red 9.7deg 19.4deg, black 19.4deg 29.1deg, red 29.1deg 38.8deg, black 38.8deg 48.5deg, red 48.5deg 58.2deg, black 58.2deg 67.9deg, red 67.9deg 77.6deg, black 77.6deg 87.3deg, red 87.3deg 97deg, black 97deg 106.7deg, red 106.7deg 116.4deg, black 116.4deg 126.1deg, red 126.1deg 135.8deg, black 135.8deg 145.5deg, red 145.5deg 155.2deg, black 155.2deg 164.9deg, red 164.9deg 174.6deg, black 174.6deg 184.3deg, red 184.3deg 194deg, black 194deg 203.7deg, red 203.7deg 213.4deg, black 213.4deg 223.1deg, red 223.1deg 232.8deg, black 232.8deg 242.5deg, red 242.5deg 252.2deg, black 252.2deg 261.9deg, red 261.9deg 271.6deg, black 271.6deg 281.3deg, red 281.3deg 291deg, black 291deg 300.7deg, red 300.7deg 310.4deg, black 310.4deg 320.1deg, red 320.1deg 329.8deg, black 329.8deg 339.5deg, red 339.5deg 349.2deg, black 349.2deg 360deg)'
               }}
               animate={{ rotate: rotation }}
               transition={{ duration: 3, ease: "circOut" }}
             >
               {/* Inner Circle for style */}
               <div className="absolute inset-8 bg-slate-800 rounded-full border-4 border-yellow-600/50"></div>
               <div className="absolute inset-24 bg-yellow-500 rounded-full shadow-inner flex items-center justify-center">
                  <div className="w-4 h-4 bg-slate-900 rounded-full"></div>
               </div>
             </motion.div>
             
             {/* Pointer */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 z-10">
               <div className="w-0 h-0 border-l-[10px] border-l-transparent border-t-[20px] border-t-white border-r-[10px] border-r-transparent drop-shadow-lg"></div>
             </div>

             {/* Result Display */}
             {resultNumber !== null && !spinning && (
               <motion.div 
                 initial={{ scale: 0 }} animate={{ scale: 1 }}
                 className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm"
               >
                 <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl font-black border-4 border-white shadow-2xl ${getNumberColor(resultNumber) === 'red' ? 'bg-red-600' : getNumberColor(resultNumber) === 'black' ? 'bg-slate-900' : 'bg-green-600'}`}>
                   {resultNumber}
                 </div>
               </motion.div>
             )}
          </div>
          
          <div className="mt-8 text-center h-12">
            {message && (
              <div className="bg-slate-800 border border-slate-600 px-4 py-2 rounded-lg text-yellow-400 font-bold animate-pulse">
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Betting Table */}
        <div className="flex-1 w-full max-w-2xl bg-green-900/30 p-6 rounded-3xl border border-green-800 shadow-xl">
          
          {/* Zero Row */}
          <div className="mb-2">
             <button
                onClick={() => placeBet('number', 0)}
                disabled={spinning}
                className="relative w-full h-12 flex items-center justify-center bg-green-700 hover:bg-green-600 rounded border border-green-500 font-bold text-xl transition-colors"
              >
                0
                {bets.find(b => b.type === 'number' && b.value === 0) && (
                  <div className="absolute top-1 right-2 w-6 h-6 bg-yellow-400 text-black text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg border border-white">
                    ${bets.find(b => b.type === 'number' && b.value === 0)?.amount}
                  </div>
                )}
             </button>
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {renderNumberGrid()}
          </div>

          {/* Outside Bets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
             <button onClick={() => placeBet('parity', 'even')} className="relative py-4 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 font-bold uppercase tracking-wider">
               PAR
               {bets.find(b => b.type === 'parity' && b.value === 'even') && <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-400 text-black text-[10px] rounded-full flex items-center justify-center font-bold">${bets.find(b => b.type === 'parity' && b.value === 'even')?.amount}</div>}
             </button>
             <button onClick={() => placeBet('parity', 'odd')} className="relative py-4 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 font-bold uppercase tracking-wider">
               ÍMPAR
               {bets.find(b => b.type === 'parity' && b.value === 'odd') && <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-400 text-black text-[10px] rounded-full flex items-center justify-center font-bold">${bets.find(b => b.type === 'parity' && b.value === 'odd')?.amount}</div>}
             </button>
             <button onClick={() => placeBet('color', 'red')} className="relative py-4 bg-red-700 hover:bg-red-600 rounded border border-red-500 font-bold uppercase tracking-wider">
               VERMELHO
               {bets.find(b => b.type === 'color' && b.value === 'red') && <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-400 text-black text-[10px] rounded-full flex items-center justify-center font-bold">${bets.find(b => b.type === 'color' && b.value === 'red')?.amount}</div>}
             </button>
             <button onClick={() => placeBet('color', 'black')} className="relative py-4 bg-black hover:bg-gray-900 rounded border border-slate-600 font-bold uppercase tracking-wider">
               PRETO
               {bets.find(b => b.type === 'color' && b.value === 'black') && <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-400 text-black text-[10px] rounded-full flex items-center justify-center font-bold">${bets.find(b => b.type === 'color' && b.value === 'black')?.amount}</div>}
             </button>
          </div>

          {/* Controls */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-sm">Valor da Ficha:</span>
              <div className="flex gap-2">
                {CHIPS.map(val => (
                  <button 
                    key={val}
                    onClick={() => setSelectedChip(val)}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg transition-transform hover:scale-110 ${selectedChip === val ? 'border-yellow-400 bg-yellow-500 text-black scale-110' : 'border-slate-500 bg-slate-700 text-slate-300'}`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm">
                <p className="text-slate-400">Total Apostado:</p>
                <p className="text-xl font-mono text-white">${totalBet}</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={clearBets}
                  disabled={spinning || bets.length === 0}
                  className="p-3 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg disabled:opacity-30 transition-colors"
                  title="Limpar Apostas"
                >
                  <Trash2 size={24} />
                </button>
                <button 
                  onClick={spinWheel}
                  disabled={spinning || bets.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black py-3 px-8 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all"
                >
                  <RotateCw size={24} className={spinning ? 'animate-spin' : ''} />
                  GIRAR
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Roulette;
