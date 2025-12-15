import React, { useState, useEffect } from 'react';
import { useCasino } from '../context/CasinoContext';
import { Card } from '../types';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Poker Logic & Evaluation (Simplified) ---
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

// Simplified Hand Ranking Logic for UI Mock
const evaluateHand = (hand: Card[]) => {
  // Sort by value descending
  const sorted = [...hand].sort((a, b) => b.numericValue - a.numericValue);
  const values = sorted.map(c => c.numericValue);
  const suits = sorted.map(c => c.suit);

  // Check Flash
  const suitCounts: Record<string, number> = {};
  let flushSuit = '';
  suits.forEach(s => { suitCounts[s] = (suitCounts[s] || 0) + 1; if(suitCounts[s] >= 5) flushSuit = s; });
  const isFlush = !!flushSuit;

  // Check Straight
  const uniqueValues = Array.from(new Set(values));
  let isStraight = false;
  let straightHigh = 0;
  for (let i = 0; i < uniqueValues.length - 4; i++) {
    if (uniqueValues[i] - uniqueValues[i+4] === 4) {
      isStraight = true;
      straightHigh = uniqueValues[i];
      break;
    }
  }
  // Wheel (A-5)
  if (!isStraight && uniqueValues.includes(14) && uniqueValues.includes(2) && uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
    isStraight = true;
    straightHigh = 5;
  }

  // Count Pairs/Trips/Quads
  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const countValues = Object.values(counts);
  const isQuads = countValues.includes(4);
  const isTrips = countValues.includes(3);
  const pairs = Object.keys(counts).filter(k => counts[parseInt(k)] === 2).length;
  const isFullHouse = isTrips && pairs >= 1;

  // Score Hand (Arbitrary scale for comparison)
  let rank = 0;
  let label = "High Card";
  let tieBreaker = values[0];

  if (isFlush && isStraight) { rank = 800; label = "Straight Flush"; }
  else if (isQuads) { rank = 700; label = "Four of a Kind"; }
  else if (isFullHouse) { rank = 600; label = "Full House"; }
  else if (isFlush) { rank = 500; label = "Flush"; }
  else if (isStraight) { rank = 400; label = "Straight"; tieBreaker = straightHigh; }
  else if (isTrips) { rank = 300; label = "Three of a Kind"; }
  else if (pairs >= 2) { rank = 200; label = "Two Pair"; }
  else if (pairs === 1) { rank = 100; label = "Pair"; }

  // Simple Tie breaking enhancement
  const rankVal = rank + tieBreaker;
  
  return { rankVal, label };
};

const CardView: React.FC<{ card: Card; hidden?: boolean; index: number }> = ({ card, hidden, index }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`relative w-16 h-24 md:w-20 md:h-28 rounded-lg shadow-xl border-2 border-slate-300 flex flex-col items-center justify-center m-1 ${hidden ? 'bg-orange-800' : 'bg-white'}`}
    >
      {hidden ? (
        <div className="w-full h-full bg-pattern opacity-30 rounded-md flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-orange-200"></div>
        </div>
      ) : (
        <>
          <div className={`absolute top-1 left-1 md:top-2 md:left-2 text-base font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
            {card.value}
            <div className="text-[10px]">{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}</div>
          </div>
          <div className={`text-3xl ${isRed ? 'text-red-600' : 'text-black'}`}>
             {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
          </div>
        </>
      )}
    </motion.div>
  );
};

const TexasHoldem: React.FC = () => {
  const { user, updateBalance } = useCasino();
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  
  const [pot, setPot] = useState(0);
  const [phase, setPhase] = useState<'start' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'>('start');
  const [msg, setMsg] = useState('');
  const [betAmount, setBetAmount] = useState(50);

  useEffect(() => {
    setDeck(getDeck());
  }, []);

  const dealGame = () => {
    if (user.balance < betAmount) {
      setMsg("Saldo Insuficiente!");
      return;
    }
    
    updateBalance(-betAmount);
    setPot(betAmount * 2); // Dealer matches bet instantly for simplicity
    
    const newDeck = getDeck();
    setPlayerHand([newDeck.pop()!, newDeck.pop()!]);
    setDealerHand([newDeck.pop()!, newDeck.pop()!]);
    setDeck(newDeck);
    setCommunityCards([]);
    setPhase('preflop');
    setMsg("Pre-Flop: Check ou Raise?");
  };

  const nextPhase = (action: 'check' | 'bet' | 'fold') => {
    if (action === 'fold') {
      setMsg("Você desistiu. Dealer vence.");
      setPhase('start');
      setPot(0);
      return;
    }

    if (action === 'bet') {
      if (user.balance < 50) {
        setMsg("Sem saldo para aumentar!");
        return;
      }
      updateBalance(-50);
      setPot(prev => prev + 100); // Dealer calls
    }

    const currentDeck = [...deck];
    
    if (phase === 'preflop') {
      setCommunityCards([currentDeck.pop()!, currentDeck.pop()!, currentDeck.pop()!]);
      setPhase('flop');
      setMsg("Flop: Ação?");
    } else if (phase === 'flop') {
      setCommunityCards(prev => [...prev, currentDeck.pop()!]);
      setPhase('turn');
      setMsg("Turn: Ação?");
    } else if (phase === 'turn') {
      setCommunityCards(prev => [...prev, currentDeck.pop()!]);
      setPhase('river');
      setMsg("River: Última chance!");
    } else if (phase === 'river') {
      setPhase('showdown');
      determineWinner();
    }
    setDeck(currentDeck);
  };

  const determineWinner = () => {
    const playerEval = evaluateHand([...playerHand, ...communityCards]);
    const dealerEval = evaluateHand([...dealerHand, ...communityCards]);

    if (playerEval.rankVal > dealerEval.rankVal) {
      updateBalance(pot);
      setMsg(`Você Venceu com ${playerEval.label}! (+$${pot})`);
    } else if (dealerEval.rankVal > playerEval.rankVal) {
      setMsg(`Dealer Venceu com ${dealerEval.label}.`);
    } else {
      updateBalance(pot / 2);
      setMsg(`Empate! (${playerEval.label})`);
    }
  };

  const reset = () => {
    setPhase('start');
    setPlayerHand([]);
    setDealerHand([]);
    setCommunityCards([]);
    setPot(0);
    setMsg("");
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center p-4">
      <Link to="/" className="absolute top-24 left-4 md:left-12 flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </Link>

      <div className="bg-orange-900/40 p-2 rounded-full mb-4 px-6 border border-orange-700 mt-8">
        <h1 className="text-2xl font-bold text-orange-400 uppercase tracking-widest">Texas Hold'em</h1>
      </div>

      <div className="relative w-full max-w-4xl bg-green-800 rounded-[50px] border-8 border-yellow-900 shadow-2xl p-4 md:p-8 flex flex-col items-center justify-between min-h-[500px]">
        {/* Felt Texture */}
        <div className="absolute inset-0 rounded-[40px] border-4 border-green-900 opacity-50 pointer-events-none"></div>

        {/* Dealer Hand */}
        <div className="flex flex-col items-center mb-4 z-10">
          <div className="flex gap-2">
             {dealerHand.length > 0 ? dealerHand.map((c, i) => (
               <CardView key={i} card={c} index={i} hidden={phase !== 'showdown'} />
             )) : (
               <>
                <div className="w-16 h-24 border-2 border-dashed border-green-600 rounded-lg"></div>
                <div className="w-16 h-24 border-2 border-dashed border-green-600 rounded-lg"></div>
               </>
             )}
          </div>
          <span className="text-green-300 text-xs font-bold uppercase mt-2 bg-green-900 px-2 rounded">Dealer</span>
        </div>

        {/* Community Cards & Pot */}
        <div className="flex flex-col items-center gap-4 z-10">
           <div className="bg-black/30 px-6 py-2 rounded-full border border-yellow-600 text-yellow-400 font-bold text-xl flex items-center gap-2">
             <span className="text-yellow-600 text-sm">POT:</span> ${pot}
           </div>

           <div className="flex gap-2 min-h-[100px]">
             {communityCards.map((c, i) => <CardView key={i} card={c} index={i} />)}
             {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                <div key={i} className="w-16 h-24 border-2 border-dashed border-green-600/50 rounded-lg bg-green-900/20"></div>
             ))}
           </div>
           
           <div className="h-8">
             {msg && <span className="bg-black/50 text-white px-4 py-1 rounded-lg animate-pulse">{msg}</span>}
           </div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center mt-4 z-10">
          <span className="text-blue-300 text-xs font-bold uppercase mb-2 bg-blue-900 px-2 rounded">Você</span>
          <div className="flex gap-2">
             {playerHand.length > 0 ? playerHand.map((c, i) => (
               <CardView key={i} card={c} index={i} />
             )) : (
               <>
                <div className="w-16 h-24 border-2 border-dashed border-green-600 rounded-lg"></div>
                <div className="w-16 h-24 border-2 border-dashed border-green-600 rounded-lg"></div>
               </>
             )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-2xl mt-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col gap-4">
         {phase === 'start' ? (
           <div className="flex flex-col items-center gap-4">
              <span className="text-slate-400">Ante: $50</span>
              <button 
                onClick={dealGame}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl shadow-lg hover:from-orange-400 hover:to-red-500 transition-all text-xl"
              >
                DEAL CARDS
              </button>
           </div>
         ) : phase === 'showdown' ? (
            <button 
              onClick={reset}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-500 transition-all"
            >
              NOVA MÃO
            </button>
         ) : (
           <div className="grid grid-cols-3 gap-4">
             <button 
               onClick={() => nextPhase('fold')}
               className="bg-red-900/50 text-red-400 font-bold py-4 rounded-xl border border-red-800 hover:bg-red-900 transition-colors"
             >
               FOLD
             </button>
             <button 
               onClick={() => nextPhase('check')}
               className="bg-slate-700 text-white font-bold py-4 rounded-xl border border-slate-600 hover:bg-slate-600 transition-colors"
             >
               CHECK / CALL
             </button>
             <button 
               onClick={() => nextPhase('bet')}
               className="bg-green-600 text-white font-bold py-4 rounded-xl border-b-4 border-green-800 hover:bg-green-500 active:border-b-0 active:translate-y-1 transition-all"
             >
               BET $50
             </button>
           </div>
         )}
      </div>

    </div>
  );
};

export default TexasHoldem;
