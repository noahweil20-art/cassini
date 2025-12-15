import React, { useState, useEffect } from 'react';
import { useCasino } from '../context/CasinoContext';
import { Card, BaccaratBet, BaccaratBetType } from '../types';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Card Utils ---
const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    VALUES.forEach(value => {
      deck.push({ suit, value, numericValue: 0 }); 
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const getBaccaratValue = (card: Card) => {
  if (['10', 'J', 'Q', 'K'].includes(card.value)) return 0;
  if (card.value === 'A') return 1;
  return parseInt(card.value);
};

const calculateScore = (hand: Card[]) => {
  const sum = hand.reduce((acc, card) => acc + getBaccaratValue(card), 0);
  return sum % 10;
};

// --- Card Component ---
const CardView: React.FC<{ card: Card; index: number; delay?: number }> = ({ card, index, delay = 0 }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, rotateY: 90 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: delay + index * 0.2, duration: 0.4 }}
      className={`relative w-20 h-28 md:w-24 md:h-36 rounded-lg shadow-xl border border-slate-200 flex flex-col items-center justify-center bg-white m-1`}
    >
      <div className={`absolute top-1 left-1 md:top-2 md:left-2 text-base md:text-lg font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.value}
        <div className="text-[10px] md:text-xs">{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}</div>
      </div>
      <div className={`text-2xl md:text-4xl ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
      </div>
      <div className={`absolute bottom-1 right-1 md:bottom-2 md:right-2 text-base md:text-lg font-bold rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.value}
          <div className="text-[10px] md:text-xs">{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}</div>
      </div>
    </motion.div>
  );
};

const CHIPS = [10, 50, 100, 500];
const TIMER_SECONDS = 5;

const Baccarat: React.FC = () => {
  const { user, updateBalance } = useCasino();
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [bet, setBet] = useState<BaccaratBet | null>(null);
  const [gameState, setGameState] = useState<'betting' | 'dealing' | 'result'>('betting');
  const [message, setMessage] = useState('Faça sua aposta!');
  const [selectedChip, setSelectedChip] = useState(10);
  const [history, setHistory] = useState<string[]>([]); // P, B, T
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  useEffect(() => {
    setDeck(getDeck());
  }, []);

  // Timer Interval Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const hasBet = !!bet;

    if (gameState === 'betting' && hasBet) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newVal = prev - 0.1;
          if (newVal <= 0) return 0;
          return newVal;
        });
      }, 100);
    } else {
      setTimeLeft(TIMER_SECONDS);
    }
    return () => clearInterval(interval);
  }, [gameState, !!bet]); // Only restart interval logic if gamestate or bet existence changes

  // Auto-deal trigger
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'betting' && bet) {
      dealGame();
    }
  }, [timeLeft, gameState, bet]); // Trigger when timeLeft hits 0

  const placeBet = (type: BaccaratBetType) => {
    if (gameState !== 'betting') return;
    
    const currentAmount = bet?.type === type ? bet.amount : 0;
    const newTotal = currentAmount + selectedChip;

    if (user.balance < selectedChip) {
      setMessage("Saldo insuficiente!");
      return;
    }
    
    if (bet && bet.type !== type) {
       // Switch bet
       updateBalance(bet.amount);
       if (user.balance + bet.amount < selectedChip) {
         updateBalance(-bet.amount);
         return;
       }
       updateBalance(-selectedChip);
       setBet({ type, amount: selectedChip });
    } else {
       // Add to bet
       if (user.balance < selectedChip) return;
       updateBalance(-selectedChip);
       setBet({ type, amount: newTotal });
    }
    setMessage("");
    // Removed setTimeLeft reset here to allow continuous countdown
  };

  const clearBet = () => {
    if (bet) {
      updateBalance(bet.amount);
      setBet(null);
    }
  };

  const dealGame = async () => {
    if (!bet) return; 

    setGameState('dealing');
    setMessage("Distribuindo cartas...");
    let currentDeck = [...deck];
    if (currentDeck.length < 10) currentDeck = getDeck();

    const pHand = [currentDeck.pop()!, currentDeck.pop()!];
    const bHand = [currentDeck.pop()!, currentDeck.pop()!];
    
    setPlayerHand(pHand);
    setBankerHand(bHand);
    setDeck(currentDeck);

    setTimeout(() => {
      runGameLogic(pHand, bHand, currentDeck);
    }, 1500);
  };

  const runGameLogic = (pHand: Card[], bHand: Card[], currentDeck: Card[]) => {
    let finalPHand = [...pHand];
    let finalBHand = [...bHand];
    
    const pScoreInitial = calculateScore(pHand);
    const bScoreInitial = calculateScore(bHand);
    
    let drawThird = false;

    if (pScoreInitial < 8 && bScoreInitial < 8) {
      let pThirdCardValue = -1;
      if (pScoreInitial <= 5) {
        const pCard = currentDeck.pop()!;
        finalPHand.push(pCard);
        pThirdCardValue = getBaccaratValue(pCard);
        drawThird = true;
      }

      let bankerDraws = false;
      if (finalPHand.length === 2) {
        if (bScoreInitial <= 5) bankerDraws = true;
      } else {
        if (bScoreInitial <= 2) bankerDraws = true;
        else if (bScoreInitial === 3 && pThirdCardValue !== 8) bankerDraws = true;
        else if (bScoreInitial === 4 && pThirdCardValue >= 2 && pThirdCardValue <= 7) bankerDraws = true;
        else if (bScoreInitial === 5 && pThirdCardValue >= 4 && pThirdCardValue <= 7) bankerDraws = true;
        else if (bScoreInitial === 6 && pThirdCardValue >= 6 && pThirdCardValue <= 7) bankerDraws = true;
      }

      if (bankerDraws) {
        finalBHand.push(currentDeck.pop()!);
        drawThird = true;
      }
    }

    if (drawThird) {
      setPlayerHand(finalPHand);
      setBankerHand(finalBHand);
      setDeck(currentDeck);
    }

    const pFinal = calculateScore(finalPHand);
    const bFinal = calculateScore(finalBHand);
    
    let winner: BaccaratBetType = 'TIE';
    if (pFinal > bFinal) winner = 'PLAYER';
    else if (bFinal > pFinal) winner = 'BANKER';

    setGameState('result');
    setHistory(prev => [...prev.slice(-14), winner === 'PLAYER' ? 'P' : winner === 'BANKER' ? 'B' : 'T']);

    // Determine payout
    let winAmount = 0;
    const winningScore = winner === 'PLAYER' ? pFinal : winner === 'BANKER' ? bFinal : pFinal; // TIE score is same
    const isWinnerEven = winningScore % 2 === 0;

    if (bet!.type === 'WINNER_EVEN') {
      if (isWinnerEven) {
        winAmount = bet!.amount * 2;
        setMessage(`Vitória Par! Score: ${winningScore}. Ganhou $${winAmount - bet!.amount}!`);
        updateBalance(winAmount);
      } else {
         setMessage(`Resultado Ímpar (${winningScore}). Você perdeu a aposta Par.`);
      }
    } else {
      if (winner === bet!.type) {
        if (winner === 'TIE') {
          winAmount = bet!.amount * 9;
          setMessage(`Empate! Você ganhou $${winAmount - bet!.amount}!`);
        } else {
          winAmount = bet!.amount * 2;
          setMessage(`${winner === 'PLAYER' ? 'Player' : 'Banker'} Venceu! Ganhou $${winAmount - bet!.amount}!`);
        }
        updateBalance(winAmount);
      } else {
        setMessage(`${winner === 'PLAYER' ? 'Player' : winner === 'BANKER' ? 'Banker' : 'Empate'} Venceu. Você perdeu.`);
      }
    }
  };

  const reset = () => {
    setPlayerHand([]);
    setBankerHand([]);
    setBet(null);
    setGameState('betting');
    setMessage('Faça sua aposta!');
    setTimeLeft(TIMER_SECONDS);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center p-4">
      <Link to="/" className="absolute top-24 left-4 md:left-12 flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </Link>

      <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600 mb-6 mt-8 tracking-widest uppercase">
        Baccarat
      </h1>

      {/* History Bar */}
      <div className="flex gap-2 mb-4 bg-slate-800 p-2 rounded-full border border-slate-700 min-h-[40px] px-4">
        {history.length === 0 && <span className="text-slate-500 text-sm self-center">Histórico...</span>}
        {history.map((h, i) => (
          <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${h === 'P' ? 'bg-blue-600 text-white' : h === 'B' ? 'bg-red-600 text-white' : 'bg-green-500 text-black'}`}>
            {h}
          </div>
        ))}
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Table Area */}
        <div className="bg-emerald-900/80 rounded-3xl border-8 border-emerald-950 p-6 md:p-10 shadow-2xl relative min-h-[450px] flex flex-col justify-between">
            {/* Countdown Bar */}
            {gameState === 'betting' && bet && (
              <div className="absolute top-0 left-0 right-0 h-2 bg-slate-900 rounded-t-2xl overflow-hidden">
                <motion.div 
                  className="h-full bg-yellow-500"
                  style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%` }}
                  // Removed animation transition to make it linear with state
                />
              </div>
            )}
            
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <span className="text-6xl font-serif text-yellow-500 font-bold border-4 border-yellow-500 rounded-full w-48 h-48 flex items-center justify-center">8:1</span>
            </div>

            {/* Hands */}
            <div className="flex justify-between w-full mb-8 z-10">
               <div className="flex flex-col items-center">
                 <h2 className="text-blue-400 font-bold uppercase tracking-widest mb-4 text-xl">Player</h2>
                 <div className="flex -space-x-4 min-h-[144px]">
                    {playerHand.map((c, i) => <CardView key={`p-${i}`} card={c} index={i} />)}
                    {gameState === 'dealing' && playerHand.length === 0 && <div className="w-20 h-28 border-2 border-dashed border-blue-800/50 rounded-lg"></div>}
                 </div>
                 <div className="mt-2 text-2xl font-mono text-white">
                   {playerHand.length > 0 && calculateScore(playerHand)}
                 </div>
               </div>

               <div className="self-center text-emerald-500/50 font-serif italic text-4xl">vs</div>

               <div className="flex flex-col items-center">
                 <h2 className="text-red-400 font-bold uppercase tracking-widest mb-4 text-xl">Banker</h2>
                 <div className="flex -space-x-4 min-h-[144px]">
                    {bankerHand.map((c, i) => <CardView key={`b-${i}`} card={c} index={i} />)}
                    {gameState === 'dealing' && bankerHand.length === 0 && <div className="w-20 h-28 border-2 border-dashed border-red-800/50 rounded-lg"></div>}
                 </div>
                 <div className="mt-2 text-2xl font-mono text-white">
                   {bankerHand.length > 0 && calculateScore(bankerHand)}
                 </div>
               </div>
            </div>

            {/* Betting Zones */}
            <div className="grid grid-cols-4 gap-2 md:gap-4 z-10 mt-auto">
               <button 
                 onClick={() => placeBet('PLAYER')}
                 disabled={gameState !== 'betting'}
                 className={`h-24 md:h-32 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${bet?.type === 'PLAYER' ? 'bg-blue-900/80 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-blue-900/30 border-blue-800 hover:bg-blue-900/50'}`}
               >
                 <span className="text-blue-300 font-bold text-xs md:text-xl">PLAYER</span>
                 {bet?.type === 'PLAYER' && <div className="mt-1 bg-yellow-500 text-black font-bold px-2 rounded-full text-xs">${bet.amount}</div>}
               </button>

               <button 
                 onClick={() => placeBet('TIE')}
                 disabled={gameState !== 'betting'}
                 className={`h-24 md:h-32 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${bet?.type === 'TIE' ? 'bg-green-900/80 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-green-900/30 border-green-800 hover:bg-green-900/50'}`}
               >
                 <span className="text-green-300 font-bold text-xs md:text-xl">TIE</span>
                 {bet?.type === 'TIE' && <div className="mt-1 bg-yellow-500 text-black font-bold px-2 rounded-full text-xs">${bet.amount}</div>}
               </button>

               <button 
                 onClick={() => placeBet('BANKER')}
                 disabled={gameState !== 'betting'}
                 className={`h-24 md:h-32 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${bet?.type === 'BANKER' ? 'bg-red-900/80 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-red-900/30 border-red-800 hover:bg-red-900/50'}`}
               >
                 <span className="text-red-300 font-bold text-xs md:text-xl">BANKER</span>
                 {bet?.type === 'BANKER' && <div className="mt-1 bg-yellow-500 text-black font-bold px-2 rounded-full text-xs">${bet.amount}</div>}
               </button>

                <button 
                 onClick={() => placeBet('WINNER_EVEN')}
                 disabled={gameState !== 'betting'}
                 className={`h-24 md:h-32 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${bet?.type === 'WINNER_EVEN' ? 'bg-purple-900/80 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-purple-900/30 border-purple-800 hover:bg-purple-900/50'}`}
               >
                 <span className="text-purple-300 font-bold text-xs md:text-xl text-center">PAR<br/><span className="text-[10px]">SCORE</span></span>
                 {bet?.type === 'WINNER_EVEN' && <div className="mt-1 bg-yellow-500 text-black font-bold px-2 rounded-full text-xs">${bet.amount}</div>}
               </button>
            </div>
        </div>

        {/* Controls Area */}
        <div className="flex flex-col gap-6">
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
             <div className="mb-4 text-center">
               <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-2">Selecione o valor da ficha</h3>
               <div className="flex justify-center gap-3">
                  {CHIPS.map(val => (
                    <button 
                      key={val}
                      onClick={() => setSelectedChip(val)}
                      disabled={gameState !== 'betting'}
                      className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-bold text-sm shadow-lg transition-transform hover:scale-110 disabled:opacity-50 disabled:grayscale ${selectedChip === val ? 'border-yellow-300 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black scale-110 ring-2 ring-yellow-500/50' : 'border-slate-500 bg-slate-700 text-slate-300'}`}
                    >
                      ${val}
                    </button>
                  ))}
               </div>
             </div>

             <div className="bg-slate-900/50 p-4 rounded-xl text-center mb-6 min-h-[60px] flex items-center justify-center border border-slate-700/50">
                <span className={`font-bold text-lg ${message.includes('Venceu') || message.includes('Ganhou') || message.includes('Vitória') ? 'text-yellow-400 animate-pulse' : 'text-slate-300'}`}>
                  {message}
                </span>
             </div>

             {gameState === 'betting' && bet && (
               <div className="flex items-center justify-center gap-2 mb-4 text-yellow-500 font-mono text-sm">
                 <Timer size={16} />
                 <span>Iniciando em {timeLeft.toFixed(1)}s</span>
               </div>
             )}

             <div className="grid grid-cols-2 gap-4">
               {gameState === 'result' ? (
                 <button 
                  onClick={reset}
                  className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                 >
                   <RefreshCw size={20} />
                   NOVA RODADA
                 </button>
               ) : (
                 <>
                   <button 
                     onClick={clearBet}
                     disabled={!bet || gameState !== 'betting'}
                     className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 rounded-xl border border-slate-600 disabled:opacity-50"
                   >
                     LIMPAR
                   </button>
                   <button 
                     onClick={dealGame}
                     disabled={!bet || gameState !== 'betting'}
                     className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                   >
                     JOGAR AGORA
                   </button>
                 </>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Baccarat;