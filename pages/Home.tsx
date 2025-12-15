import React from 'react';
import { Link } from 'react-router-dom';
import { Joystick, Spade, CircleDollarSign, Gem, Skull, Tv, Rocket, Bomb } from 'lucide-react';
import { motion } from 'framer-motion';

const GameCard: React.FC<{ to: string; title: string; icon: React.ReactNode; color: string; desc: string }> = ({ to, title, icon, color, desc }) => (
  <Link to={to} className="group relative">
    <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300 blur-xl`}></div>
    <div className="relative bg-slate-800 border border-slate-700 hover:border-slate-500 p-8 rounded-2xl transition-all duration-300 transform group-hover:-translate-y-2 h-full flex flex-col items-center text-center shadow-xl">
      <div className="mb-6 p-4 bg-slate-900 rounded-full shadow-inner">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{desc}</p>
      <div className="mt-6 px-6 py-2 bg-slate-700 rounded-full text-sm font-semibold group-hover:bg-yellow-500 group-hover:text-black transition-colors">
        JOGAR AGORA
      </div>
    </div>
  </Link>
);

const Home: React.FC = () => {
  return (
    <div className="min-h-screen pt-12 pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600"
          >
            CASSINO ROYAL
          </motion.h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            O melhor lugar para perder dinheiro fictício com estilo. <br/>Escolha seu jogo e desafie a sorte!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GameCard 
              to="/crash" 
              title="Crash / Aviator" 
              desc="Ejete antes que o foguete exploda! Multiplicadores infinitos."
              icon={<Rocket size={48} className="text-yellow-500" />}
              color="from-yellow-600 to-orange-600"
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GameCard 
              to="/mines" 
              title="Mines" 
              desc="Evite as bombas e encontre os diamantes para multiplicar."
              icon={<Bomb size={48} className="text-cyan-400" />}
              color="from-cyan-600 to-blue-600"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GameCard 
              to="/slots" 
              title="Super Slots" 
              desc="Gire os rolos e combine os símbolos. Blasting Wilds chegou!"
              icon={<Joystick size={48} className="text-purple-500" />}
              color="from-purple-600 to-pink-600"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GameCard 
              to="/blackjack" 
              title="Blackjack" 
              desc="Chegue perto de 21 sem estourar. Vença a casa!"
              icon={<Spade size={48} className="text-blue-500" />}
              color="from-blue-600 to-cyan-600"
            />
          </motion.div>

           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <GameCard 
              to="/roulette" 
              title="Roleta" 
              desc="Aposte no Vermelho, Preto ou no seu número da sorte!"
              icon={<CircleDollarSign size={48} className="text-red-500" />}
              color="from-red-600 to-slate-600"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <GameCard 
              to="/baccarat" 
              title="Baccarat" 
              desc="James Bond Style. Aposte Player, Banker ou Par!"
              icon={<Gem size={48} className="text-emerald-400" />}
              color="from-emerald-600 to-teal-600"
            />
          </motion.div>

           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <GameCard 
              to="/holdem" 
              title="Texas Hold'em" 
              desc="All-in! Vença o Dealer na melhor mão de 5 cartas."
              icon={<Skull size={48} className="text-orange-500" />}
              color="from-orange-600 to-red-600"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <GameCard 
              to="/videopoker" 
              title="Video Poker" 
              desc="Clássico Jacks or Better. Habilidade e Sorte combinadas."
              icon={<Tv size={48} className="text-indigo-400" />}
              color="from-indigo-600 to-violet-600"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;