import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Slots from './pages/Slots';
import Blackjack from './pages/Blackjack';
import Roulette from './pages/Roulette';
import Baccarat from './pages/Baccarat';
import TexasHoldem from './pages/TexasHoldem';
import VideoPoker from './pages/VideoPoker';
import Crash from './pages/Crash';
import Mines from './pages/Mines';
import Login from './pages/Login';
import PitBoss from './components/PitBoss';
import { useCasino } from './context/CasinoContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useCasino();
  if (!user.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-yellow-500 selection:text-black pb-20">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/slots" element={<ProtectedRoute><Slots /></ProtectedRoute>} />
          <Route path="/blackjack" element={<ProtectedRoute><Blackjack /></ProtectedRoute>} />
          <Route path="/roulette" element={<ProtectedRoute><Roulette /></ProtectedRoute>} />
          <Route path="/baccarat" element={<ProtectedRoute><Baccarat /></ProtectedRoute>} />
          <Route path="/holdem" element={<ProtectedRoute><TexasHoldem /></ProtectedRoute>} />
          <Route path="/videopoker" element={<ProtectedRoute><VideoPoker /></ProtectedRoute>} />
          <Route path="/crash" element={<ProtectedRoute><Crash /></ProtectedRoute>} />
          <Route path="/mines" element={<ProtectedRoute><Mines /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PitBoss />
      </div>
    </Router>
  );
};

export default App;