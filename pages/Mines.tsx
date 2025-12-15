import React, { useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Diamond, Bomb, TrendingUp, HandCoins } from 'lucide-react';
import { Link } from 'react-router-dom';

const GRID_SIZE = 25; // 5x5

const Mines: React.FC = () => {
  const { user, updateBalance } = useCasino();
  
  // State
  const [bet, setBet] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER' | 'CASHED_OUT'>('IDLE');
  const [mines, setMines] = useState<number[]>([]); // Indices of mines
  const [revealed, setRevealed] = useState<number[]>([]); // Indices of revealed tiles
  const [msg, setMsg] = useState('Configure sua aposta e cuidado com as bombas!');
  
  // Derived state
  const isGameActive = gameState === 'PLAYING';
  const diamondsFound = revealed.length;
  
  // Calculate Multiplier based on probability
  // Formula simplified: (Total Tiles / Safe Tiles Left) * ...
  const calculateMultiplier = (found: number, mines: number) => {
    let mult = 1;
    for (let i = 0; i < found; i++) {
      // Logic: (25 - i) / (25 - i - mines) * HouseEdge (0.99)
      const totalAvailable = 25 - i;
      const safeAvailable = 25 - i - mines;
      mult *= (totalAvailable / safeAvailable);
    }
    return mult * 0.95; // 5% house edge for realism
  };

  const currentMultiplier = diamondsFound === 0 ? 1 : calculateMultiplier(diamondsFound, mineCount);
  const nextTileMultiplier = calculateMultiplier(diamondsFound + 1, mineCount);
  const currentProfit = bet * currentMultiplier;

  const startGame = () => {
    if (user.balance < bet) {
      setMsg("Saldo insuficiente!");
      return;
    }
    updateBalance(-bet);
    
    // Generate random mines
    const newMines = new Set<number>();
    while (newMines.size < mineCount) {
      newMines.add(Math.floor(Math.random() * GRID_SIZE));
    }

    setMines(Array.from(newMines));
    setRevealed([]);
    setGameState('PLAYING');
    setMsg("Encontre os diamantes!");
  };

  const revealTile = (index: number) => {
    if (!isGameActive || revealed.includes(index)) return;

    if (mines.includes(index)) {
      // Boom
      setRevealed([...revealed, index]); // Reveal the clicked bomb
      setGameState('GAME_OVER');
      setMsg("BOOM! Você pisou na mina.");
    } else {
      // Diamond
      const newRevealed = [...revealed, index];
      setRevealed(newRevealed);
      
      // Check auto win (all diamonds found)
      if (newRevealed.length === GRID_SIZE - mineCount) {
        cashOut(newRevealed.length);
      }
    }
  };

  const cashOut = (count = diamondsFound) => {
    if (gameState !== 'PLAYING') return;
    const finalMult = calculateMultiplier(count, mineCount);
    const winAmount = bet * finalMult;
    
    updateBalance(winAmount);
    setGameState('CASHED_OUT');
    setMsg(`Saque realizado! Ganhou $${winAmount.toFixed(2)} (${finalMult.toFixed(2)}x)`);
  };

  const getTileContent = (index: number) => {
    if (gameState === 'IDLE') return null;

    // During game, only show revealed
    if (gameState === 'PLAYING') {
      if (revealed.includes(index)) {
        return <Diamond className="text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" size={32} fill="currentColor" />;
      }
      return null;
    }

    // Game Over / Cash Out: Show everything
    if (mines.includes(index)) {
      // If this specific mine was the one clicked to lose
      const isKillerMine = gameState === 'GAME_OVER' && revealed.includes(index) && revealed[revealed.length - 1] === index;
      return (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <Bomb className={`${isKillerMine ? 'text-red-500' : 'text-slate-400'} drop-shadow-lg`} size={32} fill={isKillerMine ? "currentColor" : "none"} />
        </motion.div>
      );
    } else {
      return (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.05 * (index % 5) }}>
           <Diamond className={`text-cyan-300 ${revealed.includes(index) ? 'opacity-100' : 'opacity-30'}`} size={32} fill="currentColor" />
        </motion.div>
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center p-4">
      <Link to="/" className="absolute top-24 left-4 md:left-12 flex items-center text-slate-400 hover:text-white transition-colors z-20">
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </Link>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
        
        {/* Sidebar Controls */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 flex flex-col h-fit lg:h-[600px]">
           <div className="mb-6 flex items-center gap-2 text-cyan-400">
             <Bomb />
             <h2 className="text-2xl font-black uppercase tracking-wider">Mines</h2>
           </div>

           <div className="flex-1 flex flex-col gap-6">
             {/* Bet Input */}
             <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
               <label className="text-slate-400 text-xs uppercase font-bold mb-2 block">Aposta</label>
               <div className="flex items-center gap-2">
                 <button onClick={() => setBet(Math.max(10, bet - 10))} disabled={isGameActive} className="w-10 h-10 rounded bg-slate-700 font-bold hover:bg-slate-600 disabled:opacity-50">-</button>
                 <div className="flex-1 bg-slate-800 h-10 rounded flex items-center justify-center font-mono font-bold text-xl text-white border border-slate-600">
                   ${bet}
                 </div>
                 <button onClick={() => setBet(Math.min(user.balance, bet + 10))} disabled={isGameActive} className="w-10 h-10 rounded bg-slate-700 font-bold hover:bg-slate-600 disabled:opacity-50">+</button>
               </div>
             </div>

             {/* Mines Count */}
             <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
               <label className="text-slate-400 text-xs uppercase font-bold mb-2 block">Número de Minas</label>
               <div className="grid grid-cols-4 gap-2">
                 {[1, 3, 5, 10, 15, 20, 24].map(num => (
                   <button
                     key={num}
                     onClick={() => setMineCount(num)}
                     disabled={isGameActive}
                     className={`py-2 rounded font-bold text-sm transition-colors ${mineCount === num ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                   >
                     {num}
                   </button>
                 ))}
               </div>
             </div>

             {/* Info Panel */}
             <div className="bg-black/20 p-4 rounded-xl border border-slate-700/50 text-center flex-1 flex flex-col justify-center">
                <div className="text-sm text-slate-400 mb-1">Próximo Multiplicador</div>
                <div className="text-3xl font-mono font-bold text-green-400 mb-4">{nextTileMultiplier.toFixed(2)}x</div>
                <div className="w-full h-px bg-slate-700 mb-4"></div>
                <div className={`font-bold ${msg.includes('BOOM') ? 'text-red-500' : msg.includes('Saque') ? 'text-green-400' : 'text-slate-300'}`}>
                  {msg}
                </div>
             </div>

             {/* Action Button */}
             {isGameActive ? (
                <button 
                  onClick={() => cashOut()}
                  disabled={diamondsFound === 0}
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-2xl uppercase shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <HandCoins size={28} />
                  <span>Sacar ${(bet * currentMultiplier).toFixed(2)}</span>
                </button>
             ) : (
                <button 
                  onClick={startGame}
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-2xl uppercase shadow-lg transform active:scale-95 transition-all"
                >
                  JOGAR
                </button>
             )}
           </div>
        </div>

        {/* Game Grid */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border-4 border-slate-700 p-4 md:p-8 shadow-2xl flex items-center justify-center relative overflow-hidden h-[500px] lg:h-[600px]">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 to-slate-950 pointer-events-none"></div>
           
           <div className="relative z-10 grid grid-cols-5 gap-3 md:gap-4 w-full max-w-[500px] aspect-square">
              {Array.from({ length: GRID_SIZE }).map((_, i) => (
                <motion.button
                  key={i}
                  whileHover={isGameActive && !revealed.includes(i) ? { scale: 1.05 } : {}}
                  whileTap={isGameActive && !revealed.includes(i) ? { scale: 0.95 } : {}}
                  onClick={() => revealTile(i)}
                  disabled={!isGameActive || revealed.includes(i)}
                  className={`
                    rounded-xl shadow-lg flex items-center justify-center transition-colors relative overflow-hidden
                    ${revealed.includes(i) 
                        ? 'bg-slate-800 border border-slate-700' 
                        : 'bg-slate-700 hover:bg-slate-600 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1'
                    }
                    ${gameState === 'GAME_OVER' && mines.includes(i) ? 'bg-slate-800' : ''}
                    ${gameState === 'CASHED_OUT' && mines.includes(i) ? 'opacity-50' : ''}
                  `}
                >
                  {getTileContent(i)}
                </motion.button>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Mines;
