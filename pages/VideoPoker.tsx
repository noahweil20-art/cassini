import React, { useState, useEffect } from 'react';
import { useCasino } from '../context/CasinoContext';
import { Card } from '../types';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, RefreshCw, Hand } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Utils ---
const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const getDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    VALUES.forEach(value => {
      let num = parseInt(value);
      if (value === 'J') num = 11;
      if (value === 'Q') num = 12;
      if (value === 'K') num = 13;
      if (value === 'A') num = 14;
      deck.push({ suit, value, numericValue: num });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const PAYTABLE = [
  { name: 'ROYAL FLUSH', multiplier: 250 }, // 800 on max bet usually, kept simple
  { name: 'STRAIGHT FLUSH', multiplier: 50 },
  { name: 'FOUR OF A KIND', multiplier: 25 },
  { name: 'FULL HOUSE', multiplier: 9 },
  { name: 'FLUSH', multiplier: 6 },
  { name: 'STRAIGHT', multiplier: 4 },
  { name: 'THREE OF A KIND', multiplier: 3 },
  { name: 'TWO PAIR', multiplier: 2 },
  { name: 'JACKS OR BETTER', multiplier: 1 },
];

const evaluateHand = (hand: Card[]) => {
  if (hand.length < 5) return null;
  
  const sorted = [...hand].sort((a, b) => a.numericValue - b.numericValue);
  const values = sorted.map(c => c.numericValue);
  const suits = sorted.map(c => c.suit);
  
  // Helpers
  const isFlush = suits.every(s => s === suits[0]);
  
  let isStraight = true;
  for (let i = 0; i < 4; i++) {
    if (values[i+1] !== values[i] + 1) {
       // Check Wheel (A, 2, 3, 4, 5)
       if (i === 3 && values[4] === 14 && values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5) {
         // Wheel straight
       } else {
         isStraight = false;
         break;
       }
    }
  }

  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const countsArr = Object.values(counts);
  
  const isFourOfAKind = countsArr.includes(4);
  const isFullHouse = countsArr.includes(3) && countsArr.includes(2);
  const isThreeOfAKind = countsArr.includes(3);
  const pairsCount = countsArr.filter(c => c === 2).length;
  
  // Jacks or Better logic
  const jacksOrBetter = Object.keys(counts).some(k => {
    const val = parseInt(k);
    return counts[val] === 2 && val >= 11; // J=11, Q=12, K=13, A=14
  });

  if (isFlush && isStraight && values[0] === 10) return PAYTABLE[0]; // Royal
  if (isFlush && isStraight) return PAYTABLE[1];
  if (isFourOfAKind) return PAYTABLE[2];
  if (isFullHouse) return PAYTABLE[3];
  if (isFlush) return PAYTABLE[4];
  if (isStraight) return PAYTABLE[5];
  if (isThreeOfAKind) return PAYTABLE[6];
  if (pairsCount === 2) return PAYTABLE[7];
  if (jacksOrBetter) return PAYTABLE[8];

  return null;
};

// --- Components ---
const PokerCard: React.FC<{ card: Card; isHeld: boolean; onClick: () => void; disabled: boolean }> = ({ card, isHeld, onClick, disabled }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <motion.div 
      whileHover={!disabled ? { y: -10 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative w-20 h-32 md:w-32 md:h-48 rounded-xl shadow-2xl border-4 
        flex flex-col items-center justify-center cursor-pointer transition-all duration-200
        ${isHeld ? 'border-yellow-400 -translate-y-4 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'border-slate-300'}
        bg-white
      `}
    >
      {isHeld && (
        <div className="absolute -top-4 bg-yellow-500 text-black font-black text-xs md:text-sm px-3 py-1 rounded-full shadow-lg z-10">
          HELD
        </div>
      )}
      
      <div className={`absolute top-2 left-2 text-lg md:text-2xl font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.value}
        <div className="text-xs md:text-base">{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}</div>
      </div>
      
      <div className={`text-5xl md:text-7xl ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
      </div>

      <div className={`absolute bottom-2 right-2 text-lg md:text-2xl font-bold rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
          {card.value}
          <div className="text-xs md:text-base">{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}</div>
      </div>
    </motion.div>
  );
};

const VideoPoker: React.FC = () => {
  const { user, updateBalance } = useCasino();
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [heldIndices, setHeldIndices] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'holding' | 'result'>('betting');
  const [bet, setBet] = useState(10);
  const [winHand, setWinHand] = useState<{name: string, multiplier: number} | null>(null);
  const [msg, setMsg] = useState('Faça sua aposta para começar');

  useEffect(() => {
    // Initial deck setup purely for visuals if needed, but logic handles it per game
  }, []);

  const deal = () => {
    if (user.balance < bet) {
      setMsg("Saldo insuficiente!");
      return;
    }
    updateBalance(-bet);
    const newDeck = getDeck();
    const newHand = [newDeck.pop()!, newDeck.pop()!, newDeck.pop()!, newDeck.pop()!, newDeck.pop()!];
    
    setDeck(newDeck);
    setHand(newHand);
    setHeldIndices([]);
    setWinHand(null);
    setGameState('holding');
    setMsg("Escolha as cartas para segurar");
    
    // Auto-hold logic (simple helper)
    const initialEval = evaluateHand(newHand);
    if (initialEval) {
      // Very basic auto-hold suggestions could go here, but let's let the user play
    }
  };

  const toggleHold = (index: number) => {
    if (gameState !== 'holding') return;
    setHeldIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const draw = () => {
    setGameState('result');
    const currentDeck = [...deck];
    const finalHand = hand.map((card, index) => {
      if (heldIndices.includes(index)) return card;
      return currentDeck.pop()!;
    });
    
    setHand(finalHand);
    
    const result = evaluateHand(finalHand);
    if (result) {
      const winAmount = bet * result.multiplier;
      updateBalance(winAmount);
      setWinHand(result);
      setMsg(`Venceu! ${result.name} (+$${winAmount})`);
    } else {
      setMsg("Sem vitória. Tente novamente.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center p-4">
      <Link to="/" className="absolute top-24 left-4 md:left-12 flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </Link>

      <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4 mt-8 uppercase tracking-widest">
        Video Poker
      </h1>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Paytable */}
        <div className="lg:col-span-3 bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-lg h-fit">
          <h3 className="text-center text-slate-400 font-bold mb-2 uppercase text-xs tracking-wider">Tabela de Pagamentos</h3>
          <div className="flex flex-col gap-1 text-sm">
            {PAYTABLE.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex justify-between px-2 py-1.5 rounded ${winHand?.name === item.name ? 'bg-yellow-500 text-black font-bold animate-pulse' : 'odd:bg-slate-700/50 text-slate-300'}`}
              >
                <span>{item.name}</span>
                <span className="font-mono">{item.multiplier}x</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {/* Screen / Cards */}
          <div className="bg-blue-900/40 rounded-3xl border-4 border-blue-800 p-4 md:p-8 min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(30,58,138,0.3)]">
             {/* Scanline effect */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none rounded-2xl bg-[length:100%_4px,3px_100%]"></div>
             
             {hand.length > 0 ? (
               <div className="flex justify-center gap-2 md:gap-4 z-10 flex-wrap">
                 {hand.map((card, i) => (
                   <PokerCard 
                      key={i} 
                      card={card} 
                      isHeld={heldIndices.includes(i)} 
                      onClick={() => toggleHold(i)} 
                      disabled={gameState !== 'holding'}
                   />
                 ))}
               </div>
             ) : (
               <div className="text-blue-300/30 text-6xl font-black uppercase tracking-widest z-10">
                 Jacks or Better
               </div>
             )}

             <div className="mt-8 h-8 z-10">
               <span className={`text-xl font-bold px-6 py-2 rounded-full ${msg.includes('Venceu') ? 'bg-yellow-500 text-black animate-bounce' : 'bg-slate-900/80 text-blue-200'}`}>
                 {msg}
               </span>
             </div>
          </div>

          {/* Controls */}
          <div className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-xl border border-slate-700">
               <span className="text-slate-400 text-sm">Aposta:</span>
               <button 
                 onClick={() => setBet(Math.max(10, bet - 10))}
                 disabled={gameState === 'holding'}
                 className="w-10 h-10 bg-slate-700 rounded-lg hover:bg-slate-600 font-bold disabled:opacity-50"
               >-</button>
               <span className="text-2xl font-mono text-yellow-400 w-16 text-center">${bet}</span>
               <button 
                 onClick={() => setBet(Math.min(user.balance, bet + 10))}
                 disabled={gameState === 'holding'}
                 className="w-10 h-10 bg-slate-700 rounded-lg hover:bg-slate-600 font-bold disabled:opacity-50"
               >+</button>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
               {gameState === 'holding' ? (
                 <button 
                   onClick={draw}
                   className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-xl py-4 px-12 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   DRAW <RefreshCw size={24} />
                 </button>
               ) : (
                 <button 
                   onClick={deal}
                   className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xl py-4 px-12 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   DEAL <Play size={24} fill="currentColor" />
                 </button>
               )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default VideoPoker;