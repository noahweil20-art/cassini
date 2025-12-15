import React, { useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, LayoutGrid, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Configuration Types ---
interface SlotTheme {
  id: string;
  name: string;
  description: string;
  symbols: string[]; // High value to low value
  wildSymbol: string;
  colors: {
    bgFrom: string;
    bgTo: string;
    border: string;
    reelBg: string;
    accent: string;
    button: string;
  };
}

// --- Themes Data ---
const SLOT_THEMES: SlotTheme[] = [
  {
    id: 'blasting',
    name: 'Blasting Wilds',
    description: 'Exploda as frutas para multiplicar seus ganhos!',
    symbols: ['💎', '7️⃣', '🔔', '🍉', '🍇', '🍋', '🍒'],
    wildSymbol: '💣',
    colors: {
      bgFrom: 'from-purple-900',
      bgTo: 'to-slate-950',
      border: 'border-yellow-600',
      reelBg: 'bg-purple-950/80',
      accent: 'text-yellow-400',
      button: 'bg-gradient-to-b from-yellow-500 to-orange-600'
    }
  },
  {
    id: 'olympus',
    name: 'Gates of Gods',
    description: 'A fúria de Zeus traz multiplicadores divinos.',
    symbols: ['👑', '⏳', '💍', '🏆', '🍷', '🟦', '🟩'],
    wildSymbol: '⚡',
    colors: {
      bgFrom: 'from-blue-600',
      bgTo: 'to-indigo-950',
      border: 'border-yellow-300',
      reelBg: 'bg-indigo-950/80',
      accent: 'text-cyan-300',
      button: 'bg-gradient-to-b from-cyan-500 to-blue-700'
    }
  },
  {
    id: 'sweet',
    name: 'Sugar Rush',
    description: 'Um mundo doce com vitórias em cascata.',
    symbols: ['🍭', '🍬', '🍩', '🍪', '🍎', '🍇', '🍌'],
    wildSymbol: '🧁',
    colors: {
      bgFrom: 'from-pink-500',
      bgTo: 'to-rose-900',
      border: 'border-white',
      reelBg: 'bg-pink-950/50',
      accent: 'text-white',
      button: 'bg-gradient-to-b from-pink-400 to-rose-600'
    }
  }
];

const REELS = 5;
const ROWS = 3;

const Slots: React.FC = () => {
  const { user, updateBalance } = useCasino();
  const [selectedTheme, setSelectedTheme] = useState<SlotTheme | null>(SLOT_THEMES[0]);
  
  // Game State: 5 Reels, 3 Rows each
  const [grid, setGrid] = useState<string[][]>(
    Array(REELS).fill(Array(ROWS).fill('?'))
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [msg, setMsg] = useState('');
  const [winLines, setWinLines] = useState<number[]>([]); // Indices of winning rows/diagonals (simplified)

  // --- Logic ---

  const selectGame = (theme: SlotTheme) => {
    setSelectedTheme(theme);
    // Initialize with random symbols
    setGrid(Array.from({ length: REELS }, () => 
       Array.from({ length: ROWS }, () => theme.symbols[Math.floor(Math.random() * theme.symbols.length)])
    ));
    setMsg('');
    setWinLines([]);
  };

  const spin = async () => {
    if (!selectedTheme) return;
    if (user.balance < bet) {
      setMsg("Saldo insuficiente!");
      return;
    }

    setIsSpinning(true);
    setMsg('');
    setWinLines([]);
    updateBalance(-bet);

    // Animation simulation
    let iterations = 0;
    const interval = setInterval(() => {
      setGrid(prev => prev.map(() => 
         Array.from({ length: ROWS }, () => {
            // Include wild in random generation
            const pool = [...selectedTheme.symbols, selectedTheme.wildSymbol];
            return pool[Math.floor(Math.random() * pool.length)];
         })
      ));
      iterations++;
      if (iterations > 10) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 100);
  };

  const finalizeSpin = () => {
    if (!selectedTheme) return;
    
    // Generate Final Grid
    const newGrid: string[][] = [];
    const pool = [...selectedTheme.symbols, selectedTheme.wildSymbol];
    
    for (let i = 0; i < REELS; i++) {
        const col: string[] = [];
        for(let j=0; j<ROWS; j++) {
            // Weighted random (Lower index symbols are rarer)
            const r = Math.random();
            let symbol;
            if (r > 0.95) symbol = selectedTheme.wildSymbol; // 5% Wild
            else if (r > 0.90) symbol = pool[0]; // Jackpot symbol
            else if (r > 0.80) symbol = pool[1];
            else symbol = pool[Math.floor(Math.random() * (pool.length - 2)) + 2];
            col.push(symbol);
        }
        newGrid.push(col);
    }

    setGrid(newGrid);
    setIsSpinning(false);
    checkWin(newGrid, selectedTheme);
  };

  const checkWin = (currentGrid: string[][], theme: SlotTheme) => {
    let totalWin = 0;
    let winOccurred = false;

    // Simplified Logic: Check for 3+ matching symbols anywhere (Scatter-like) for simplicity in this mock
    // In a real slot, we'd check paylines (e.g. Row 1, Row 2, V-shape, etc)
    // Let's implement basic "Counts" logic
    
    const counts: Record<string, number> = {};
    currentGrid.flat().forEach(sym => {
        counts[sym] = (counts[sym] || 0) + 1;
    });

    const wildCount = counts[theme.wildSymbol] || 0;
    
    // Check payouts
    theme.symbols.forEach((sym, index) => {
        const baseCount = counts[sym] || 0;
        // Simple wild logic: Wilds add to the count of the highest paying symbol present? 
        // Or just act as scatter. Let's just say specific count of symbols wins.
        
        const totalCount = baseCount; // + wildCount (Simplified: Wilds are their own payout or substitute. Let's make Wilds pay huge independently and act as scatter multiplier visually)
        
        if (totalCount >= 8) { // 8+ matching symbols anywhere (Cluster pays style)
             const multiplier = (theme.symbols.length - index) * 2; // Rarity based
             totalWin += bet * multiplier;
             winOccurred = true;
        } else if (totalCount >= 5) {
             const multiplier = (theme.symbols.length - index) * 0.5;
             totalWin += bet * multiplier;
             winOccurred = true;
        }
    });

    // Wild Payout
    if (wildCount >= 3) {
        totalWin += bet * 20;
        winOccurred = true;
        setMsg("BOMBA! Wilds explodiram seus ganhos!");
    }

    if (winOccurred && totalWin > 0) {
        updateBalance(totalWin);
        setMsg(`VITÓRIA! Ganhou $${totalWin.toFixed(2)}`);
    } else {
        setMsg("Sem sorte. Tente novamente!");
    }
  };

  // --- Render Selection Screen ---
  if (!selectedTheme) {
      // (Theme selection logic kept similar to previous version if user backs out)
      return null; 
  }

  // --- Render Game Screen ---
  return (
    <div className={`min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 transition-colors duration-500 bg-gradient-to-b ${selectedTheme.colors.bgFrom} ${selectedTheme.colors.bgTo}`}>
       
       <div className="absolute top-24 left-4 flex gap-4 z-20">
            <Link to="/" className="flex items-center text-slate-400 hover:text-white transition-colors bg-black/30 px-3 py-1 rounded-full">
                <ArrowLeft size={16} className="mr-2" /> Lobby
            </Link>
            
            <div className="relative group">
                <button className="flex items-center text-slate-400 hover:text-white transition-colors bg-black/30 px-3 py-1 rounded-full">
                    <LayoutGrid size={16} className="mr-2" /> Temas
                </button>
                <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg p-2 w-48 hidden group-hover:block z-50 shadow-xl">
                    {SLOT_THEMES.map(t => (
                        <button key={t.id} onClick={() => selectGame(t)} className="block w-full text-left px-4 py-2 hover:bg-slate-700 rounded text-sm text-white">
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>
       </div>

      <div className={`w-full max-w-4xl relative mt-8`}>
        
        {/* Machine Header */}
        <div className="text-center mb-6 relative">
             <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]`}>
                {selectedTheme.name}
             </h1>
             <div className="text-yellow-400 text-sm font-bold tracking-[0.5em] mt-2">VIDEO SLOTS</div>
        </div>

        {/* Machine Body */}
        <div className={`bg-slate-900/50 backdrop-blur-md p-4 md:p-8 rounded-[40px] border-[6px] ${selectedTheme.colors.border} shadow-[0_0_50px_rgba(0,0,0,0.5)] relative`}>
            
            {/* The Grid (5 Reels x 3 Rows) */}
            <div className="grid grid-cols-5 gap-1 md:gap-2 bg-black/80 p-2 md:p-4 rounded-2xl border-inner border-2 border-white/10 shadow-inner overflow-hidden relative">
                
                {/* Payline indicators (Visual) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full text-xs text-white/30 hidden md:flex flex-col gap-8">
                    <span>1</span><span>2</span><span>3</span>
                </div>

                {grid.map((col, colIndex) => (
                    <div key={colIndex} className={`flex flex-col gap-1 md:gap-2 ${selectedTheme.colors.reelBg} rounded-lg py-1 md:py-2`}>
                        {col.map((symbol, rowIndex) => (
                            <div key={rowIndex} className="aspect-square flex items-center justify-center relative overflow-hidden group">
                                <motion.div
                                    key={`${isSpinning}-${symbol}-${rowIndex}`}
                                    initial={isSpinning ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-4xl md:text-6xl filter drop-shadow-md transform group-hover:scale-110 transition-transform"
                                >
                                    {symbol}
                                </motion.div>
                                {/* Scanline/Shine */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10 pointer-events-none rounded"></div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Info Bar */}
             <div className={`mt-6 text-center h-10 font-bold text-xl md:text-2xl ${msg.includes('VITÓRIA') || msg.includes('BOMBA') ? 'text-yellow-400 animate-bounce' : 'text-white'}`}>
                {msg || <span className="text-white/30 text-sm font-normal uppercase tracking-widest">Boa Sorte!</span>}
            </div>

            {/* Controls */}
            <div className="mt-6 bg-black/40 rounded-full p-2 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10">
                
                {/* Balance & Win */}
                <div className="flex gap-6 px-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Créditos</span>
                        <span className="text-white font-mono font-bold">${user.balance.toFixed(0)}</span>
                    </div>
                </div>

                {/* Spin Button & Bet */}
                <div className="flex items-center gap-4">
                     <div className="flex items-center bg-slate-800 rounded-full px-2 py-1 border border-slate-600">
                        <button onClick={() => setBet(Math.max(10, bet - 10))} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs">-</button>
                        <div className="flex flex-col items-center w-16 mx-2">
                             <span className="text-[8px] text-slate-400 uppercase font-bold">Aposta</span>
                             <span className="text-yellow-400 font-bold">${bet}</span>
                        </div>
                        <button onClick={() => setBet(Math.min(user.balance, bet + 10))} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs">+</button>
                     </div>

                     <button
                        onClick={spin}
                        disabled={isSpinning}
                        className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 shadow-xl flex items-center justify-center transform active:scale-95 transition-all ${isSpinning ? 'bg-slate-600 grayscale' : selectedTheme.colors.button}`}
                     >
                        {isSpinning ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        ) : (
                            <Play size={32} fill="white" className="text-white ml-1" />
                        )}
                     </button>
                </div>

                 {/* Paytable hint */}
                 <div className="hidden md:block px-4">
                    <button className="text-slate-400 hover:text-white transition-colors">
                        <Info size={24} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Slots;
