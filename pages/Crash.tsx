import React, { useState, useEffect, useRef } from 'react';
import { useCasino } from '../context/CasinoContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Rocket, TrendingUp, AlertTriangle, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';

const Crash: React.FC = () => {
  const { user, updateBalance } = useCasino();
  
  // Game State
  const [gameState, setGameState] = useState<'IDLE' | 'COUNTDOWN' | 'RUNNING' | 'CRASHED'>('IDLE');
  const [multiplier, setMultiplier] = useState(1.00);
  const [bet, setBet] = useState(10);
  const [hasBet, setHasBet] = useState(false); // Did user bet in this round?
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(10); // Changed to 10s per request
  const [msg, setMsg] = useState('Preparando motores...');

  // Animation Refs
  const reqRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // --- Auto Start Logic ---
  useEffect(() => {
    // Start the loop immediately on mount if IDLE
    if (gameState === 'IDLE') {
      startGameLoop();
    }
    // Cleanup on unmount
    return () => cancelAnimationFrame(reqRef.current);
  }, []);

  // --- Logic ---

  // Generate Crash Point
  const generateCrashPoint = () => {
    // E = 0.99 / (1 - random)
    // 1% chance of instant crash at 1.00x
    const r = Math.random();
    const result = 0.99 / (1 - r);
    return Math.max(1.00, Math.floor(result * 100) / 100);
  };

  const placeBet = () => {
    if (gameState !== 'COUNTDOWN' && gameState !== 'IDLE') return; // Can only bet during countdown
    if (user.balance < bet) {
      setMsg("Saldo insuficiente!");
      return;
    }
    setHasBet(true);
    updateBalance(-bet);
    setMsg("Aposta confirmada! Aguardando decolagem...");
  };

  const cancelBet = () => {
    if (gameState !== 'COUNTDOWN' && gameState !== 'IDLE') return;
    setHasBet(false);
    updateBalance(bet);
    setMsg("Aposta cancelada.");
  };

  const cashOut = () => {
    if (gameState !== 'RUNNING' || !hasBet || cashedOutAt) return;
    
    const winAmount = bet * multiplier;
    updateBalance(winAmount);
    setCashedOutAt(multiplier);
    setMsg(`Saque realizado! Ganhou $${winAmount.toFixed(2)}`);
  };

  // Start Cycle
  const startGameLoop = () => {
    setCrashPoint(generateCrashPoint());
    setGameState('COUNTDOWN');
    setCountdown(10); // 10 Seconds Betting Phase
    setMultiplier(1.00);
    setCashedOutAt(null);
    setHasBet(false); // Reset bet status for the NEW round
    setMsg("Faça sua aposta (10s)");
  };

  // Countdown Effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (gameState === 'COUNTDOWN') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        setGameState('RUNNING');
        startTimeRef.current = Date.now();
        runGame();
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  // Running Loop
  const runGame = () => {
    const update = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000; // seconds
      
      // Exponential growth curve
      const growth = Math.pow(Math.E, 0.12 * elapsed); 
      const currentM = Math.max(1.00, parseFloat(growth.toFixed(2)));

      if (currentM >= crashPoint) {
        setMultiplier(crashPoint);
        crash();
      } else {
        setMultiplier(currentM);
        reqRef.current = requestAnimationFrame(update);
      }
    };
    reqRef.current = requestAnimationFrame(update);
  };

  const crash = () => {
    cancelAnimationFrame(reqRef.current);
    setGameState('CRASHED');
    setHistory(prev => [crashPoint, ...prev].slice(0, 10));
    
    if (hasBet && !cashedOutAt) {
      setMsg("A nave explodiu! Você perdeu a aposta.");
    } else if (hasBet && cashedOutAt) {
      // Already handled msg in cashOut
    } else {
      setMsg(`Crash em ${crashPoint.toFixed(2)}x`);
    }

    // Auto restart after 5s (Cooldown)
    setTimeout(() => {
      startGameLoop();
    }, 5000);
  };

  // --- Visual Helpers ---
  const visualProgress = Math.min((multiplier - 1) / 10, 1);
  const rocketY = visualProgress * 80;
  const rocketX = visualProgress * 80;

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center p-4">
      <Link to="/" className="absolute top-24 left-4 md:left-12 flex items-center text-slate-400 hover:text-white transition-colors z-20">
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </Link>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
        
        {/* Game Area (Left/Top) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* History Bar */}
          <div className="bg-slate-800 p-2 rounded-lg flex items-center gap-2 overflow-x-auto border border-slate-700 h-12">
            <span className="text-slate-500 text-xs uppercase font-bold px-2 sticky left-0 bg-slate-800">Histórico</span>
            {history.map((h, i) => (
              <div 
                key={i} 
                className={`px-3 py-1 rounded text-xs font-bold font-mono whitespace-nowrap ${h >= 2.0 ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-400'}`}
              >
                {h.toFixed(2)}x
              </div>
            ))}
          </div>

          {/* Canvas / Animation Area */}
          <div className="relative bg-slate-900 rounded-3xl border-4 border-slate-700 h-[400px] overflow-hidden shadow-2xl flex items-center justify-center">
             {/* Grid Background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"></div>

             {/* Game Logic Visuals */}
             {gameState === 'IDLE' && (
               <div className="z-10 text-center animate-pulse">
                 <h2 className="text-2xl font-bold text-slate-400">Carregando...</h2>
               </div>
             )}

             {gameState === 'COUNTDOWN' && (
               <div className="z-10 text-center w-full">
                 <div className="text-8xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-150 animate-ping absolute opacity-10 left-1/2 -translate-x-1/2">
                    {countdown}
                 </div>
                 <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 relative z-20">
                   {countdown}s
                 </div>
                 <div className="mt-4 flex flex-col items-center gap-2">
                    <p className="text-yellow-200 font-bold tracking-widest uppercase animate-pulse">Faça sua aposta</p>
                    {/* Progress Bar for countdown */}
                    <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
                        <motion.div 
                            className="h-full bg-yellow-500" 
                            initial={{ width: '100%' }} 
                            animate={{ width: '0%' }} 
                            transition={{ duration: 10, ease: 'linear' }} 
                        />
                    </div>
                 </div>
               </div>
             )}

             {gameState === 'RUNNING' && (
                <>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                    <div className="text-7xl md:text-8xl font-black font-mono text-white tracking-tighter drop-shadow-2xl">
                      {multiplier.toFixed(2)}x
                    </div>
                    {cashedOutAt && (
                      <div className="mt-2 bg-green-500/20 text-green-400 px-4 py-1 rounded-full border border-green-500/50 backdrop-blur font-bold animate-fade-in-up">
                        Saque: {cashedOutAt.toFixed(2)}x
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0">
                     <motion.div 
                        className="absolute bottom-10 left-10 w-12 h-12"
                        animate={{ 
                          x: `calc(${rocketX}%)`, 
                          y: `calc(-${rocketY}%)`,
                        }}
                        transition={{ duration: 0.1, ease: "linear" }}
                     >
                       <Rocket 
                         size={48} 
                         className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] transform rotate-45" 
                         fill="currentColor"
                       />
                       <div className="absolute top-8 -left-4 w-12 h-20 bg-gradient-to-t from-transparent to-orange-500 opacity-80 blur-md transform rotate-45"></div>
                     </motion.div>
                     
                     <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                        <path 
                          d={`M 40 ${400-40} Q ${40 + (rocketX*4)} ${400-40}, ${40 + (rocketX*5)} ${400-40 - (rocketY*4)}`} 
                          fill="none" 
                          stroke="yellow" 
                          strokeWidth="2" 
                        />
                     </svg>
                  </div>
                </>
             )}

             {gameState === 'CRASHED' && (
                <div className="z-10 text-center flex flex-col items-center">
                   <AlertTriangle size={80} className="text-red-500 mb-4 animate-bounce" />
                   <h2 className="text-6xl font-black text-red-500 uppercase tracking-tighter mb-2">EXPLODIU!</h2>
                   <div className="text-4xl font-mono text-white mb-4">
                     {crashPoint.toFixed(2)}x
                   </div>
                   <div className="text-slate-400 text-sm animate-pulse">
                     Próxima rodada em 5 segundos...
                   </div>
                </div>
             )}

          </div>
        </div>

        {/* Controls (Right) */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 flex flex-col h-[452px]"> 
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-yellow-500" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Painel de Controle</h2>
          </div>

          <div className="flex-1 flex flex-col gap-6">
             
             {/* Bet Input */}
             <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
               <label className="text-slate-400 text-xs uppercase font-bold mb-2 block">Valor da Aposta</label>
               <div className="flex items-center gap-2">
                 <button onClick={() => setBet(Math.max(10, bet - 10))} disabled={hasBet} className="w-10 h-10 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold">-</button>
                 <div className="flex-1 bg-slate-800 h-10 rounded flex items-center justify-center font-mono font-bold text-xl text-white border border-slate-600">
                   ${bet}
                 </div>
                 <button onClick={() => setBet(Math.min(user.balance, bet + 10))} disabled={hasBet} className="w-10 h-10 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold">+</button>
               </div>
               <div className="grid grid-cols-4 gap-2 mt-2">
                 {[10, 50, 100, 500].map(val => (
                   <button 
                     key={val} 
                     onClick={() => setBet(val)}
                     disabled={hasBet}
                     className="bg-slate-800 hover:bg-slate-700 text-xs font-bold py-1 rounded text-slate-300 transition-colors"
                   >
                     ${val}
                   </button>
                 ))}
               </div>
             </div>

             {/* Info Box */}
             <div className="bg-black/20 rounded-xl p-4 flex-1 border border-slate-700/50 flex items-center justify-center text-center">
                <p className={`text-lg font-bold ${msg.includes('Perdeu') || msg.includes('explodiu') ? 'text-red-400' : msg.includes('Ganhou') || msg.includes('Saque') ? 'text-green-400' : 'text-slate-300'}`}>
                  {msg}
                </p>
             </div>

             {/* Main Button */}
             <div className="mt-auto">
               {gameState === 'COUNTDOWN' ? (
                 hasBet ? (
                   <button 
                     onClick={cancelBet}
                     className="w-full py-6 rounded-xl bg-red-900/50 border border-red-500/50 text-red-200 font-bold text-xl uppercase hover:bg-red-900 transition-colors"
                   >
                     Cancelar Aposta
                   </button>
                 ) : (
                    <button 
                      onClick={placeBet}
                      className="w-full py-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-2xl uppercase shadow-lg transform active:scale-95 transition-all"
                    >
                      APOSTAR
                    </button>
                 )
               ) : gameState === 'RUNNING' ? (
                  hasBet && !cashedOutAt ? (
                    <button 
                      onClick={cashOut}
                      className="w-full py-6 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-2xl uppercase shadow-[0_0_20px_rgba(234,179,8,0.5)] transform active:scale-95 transition-all animate-pulse"
                    >
                      SAQUE ${(bet * multiplier).toFixed(0)}
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full py-6 rounded-xl bg-slate-800 text-slate-500 font-bold text-xl uppercase border border-slate-700"
                    >
                      {cashedOutAt ? 'Saque Realizado' : 'Aguardando...'}
                    </button>
                  )
               ) : ( // CRASHED or IDLE
                  <button 
                    disabled
                    className="w-full py-6 rounded-xl bg-slate-700 text-slate-400 font-bold text-xl uppercase border border-slate-600"
                  >
                    {gameState === 'CRASHED' ? 'EXPLODIU' : 'Carregando...'}
                  </button>
               )}
             </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Crash;