import React, { useState, useEffect } from 'react';
import { useCasino } from '../context/CasinoContext';
import { Card, GameType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const getDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    VALUES.forEach(value => {
      let numeric = parseInt(value);
      if (['J', 'Q', 'K'].includes(value)) numeric = 10;
      if (value === 'A') numeric = 11;
      deck.push({ suit, value, numericValue: numeric });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = (hand: Card[]) => {
  let score = hand.reduce((acc, card) => acc + card.numericValue, 0);
  let aces = hand.filter(card => card.value === 'A').length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
};

const CardView: React.FC<{ card: Card; hidden?: boolean; index: number }> = ({ card, hidden, index }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -50, rotate: -10 }}
      animate={{ opacity: 1, y: 0, rotate: index * 5 - 5 }}
      className={`relative w-24 h-36 rounded-lg shadow-xl border-2 border-slate-200 flex flex-col items-center justify-center m-1 ${hidden ? 'bg-blue-800' : 'bg-white'}`}
      style={{ marginLeft: index === 0 ? 0 : '-40px' }}
    >
      {hidden ? (
        <div className="w-full h-full bg-pattern opacity-50 rounded-md"></div> // Back of card pattern simulation
      ) : (
        <>
          <div className={`absolute top-2 left-2 text-lg font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
            {card.value}
            <div className="text-xs">{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}</div>
          </div>
          <div className={`text-4xl ${isRed ? 'text-red-600' : 'text-black'}`}>
             {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
          </div>
          <div className={`absolute bottom-2 right-2 text-lg font-bold rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
             {card.value}
             <div className="text-xs">{card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}</div>
          </div>
        </>
      )}
    </motion.div>
  );
};

const Blackjack: React.FC = () => {
  const { user, updateBalance } = useCasino();
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'gameOver'>('betting');
  const [bet, setBet] = useState(20);
  const [message, setMessage] = useState('');

  const startGame = () => {
    if (user.balance < bet) {
      setMessage("Saldo insuficiente!");
      return;
    }
    updateBalance(-bet);
    const newDeck = getDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setMessage('');

    if (calculateScore(pHand) === 21) {
      endGame(pHand, dHand, 'blackjack');
    }
  };

  const hit = () => {
    const newCard = deck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck([...deck]); // Update deck ref

    if (calculateScore(newHand) > 21) {
      endGame(newHand, dealerHand, 'bust');
    }
  };

  const stand = () => {
    setGameState('dealerTurn');
    let dHand = [...dealerHand];
    let currentDeck = [...deck];
    
    // Simple dealer AI: Hit until 17
    while (calculateScore(dHand) < 17) {
      dHand.push(currentDeck.pop()!);
    }
    
    setDealerHand(dHand);
    setDeck(currentDeck);
    endGame(playerHand, dHand, 'compare');
  };

  const endGame = (pHand: Card[], dHand: Card[], reason: string) => {
    setGameState('gameOver');
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);

    if (reason === 'blackjack') {
      setMessage('Blackjack! Você ganhou!');
      updateBalance(bet * 2.5);
    } else if (reason === 'bust') {
      setMessage('Estourou! A casa venceu.');
    } else {
      if (dScore > 21) {
        setMessage('Dealer estourou! Você venceu!');
        updateBalance(bet * 2);
      } else if (dScore > pScore) {
        setMessage(`Dealer (${dScore}) venceu Jogador (${pScore}).`);
      } else if (pScore > dScore) {
        setMessage(`Jogador (${pScore}) venceu Dealer (${dScore})!`);
        updateBalance(bet * 2);
      } else {
        setMessage('Empate! Aposta devolvida.');
        updateBalance(bet);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center pt-8 px-4">
      <Link to="/" className="absolute top-24 left-4 md:left-12 flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </Link>

      <div className="bg-green-900/40 p-2 rounded-full mb-8 px-6 border border-green-700">
        <h1 className="text-2xl font-bold text-green-400">BLACKJACK PAYS 3 TO 2</h1>
      </div>

      <div className="flex flex-col items-center gap-12 w-full max-w-4xl">
        {/* Dealer Area */}
        <div className="flex flex-col items-center min-h-[180px]">
          <h3 className="text-slate-400 mb-2 text-sm uppercase tracking-wider">Dealer {gameState === 'gameOver' ? `(${calculateScore(dealerHand)})` : ''}</h3>
          <div className="flex justify-center">
            {dealerHand.map((card, i) => (
              <CardView 
                key={i} 
                card={card} 
                index={i} 
                hidden={gameState === 'playing' && i === 1} 
              />
            ))}
            {dealerHand.length === 0 && <div className="w-24 h-36 border-2 border-slate-700 rounded-lg border-dashed opacity-50"></div>}
          </div>
        </div>

        {/* Message Area */}
        <div className="h-12 flex items-center justify-center">
           {message && (
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }}
               className="bg-black/50 px-6 py-2 rounded-full border border-yellow-500 text-yellow-400 font-bold"
             >
               {message}
             </motion.div>
           )}
        </div>

        {/* Player Area */}
        <div className="flex flex-col items-center min-h-[180px]">
          <h3 className="text-slate-400 mb-2 text-sm uppercase tracking-wider">Você {playerHand.length > 0 ? `(${calculateScore(playerHand)})` : ''}</h3>
          <div className="flex justify-center">
            {playerHand.map((card, i) => (
              <CardView key={i} card={card} index={i} />
            ))}
             {playerHand.length === 0 && <div className="w-24 h-36 border-2 border-slate-700 rounded-lg border-dashed opacity-50"></div>}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-md p-6 bg-slate-800 rounded-2xl shadow-xl border-t border-slate-700">
          {gameState === 'betting' || gameState === 'gameOver' ? (
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-slate-700 p-3 rounded-lg">
                  <span className="text-slate-300">Aposta:</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setBet(Math.max(10, bet - 10))} className="w-8 h-8 rounded bg-slate-600 font-bold">-</button>
                    <span className="font-mono font-bold w-12 text-center">${bet}</span>
                    <button onClick={() => setBet(Math.min(user.balance, bet + 10))} className="w-8 h-8 rounded bg-slate-600 font-bold">+</button>
                  </div>
                </div>
                <button 
                  onClick={startGame} 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {gameState === 'gameOver' ? 'JOGAR NOVAMENTE' : 'DAR CARTAS'}
                </button>
             </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={hit} 
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
              >
                HIT (Carta)
              </button>
              <button 
                onClick={stand} 
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
              >
                STAND (Parar)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blackjack;
