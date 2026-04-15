'use client';

import { useState, useEffect } from 'react';
import PlinkoBoard from '@/components/PlinkoBoard';
import { Volume2, VolumeX, ShieldCheck, Trophy, Coins, Settings } from 'lucide-react';
import Link from 'next/link';

type GameState = 'MENU' | 'PLAYING';

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [level, setLevel] = useState<number>(1);
  const [dropsAtCurrentLevel, setDropsAtCurrentLevel] = useState<number>(0);
  
  const [roundId, setRoundId] = useState<string | null>(null);
  const [commitHex, setCommitHex] = useState<string>('');
  const [nonce, setNonce] = useState<string>('');
  const [clientSeed, setClientSeed] = useState<string>('');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [dropColumn, setDropColumn] = useState<number>(6); 
  
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [path, setPath] = useState<('L' | 'R')[]>([]);
  const [muted, setMuted] = useState<boolean>(false);
  
  const [balance, setBalance] = useState<number>(10000); 
  const [lastResult, setLastResult] = useState<any>(null);

  // Update background based on level
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const bgIndex = ((level - 1) % 3) + 1; // Cycle through 1-3
      document.body.style.backgroundImage = `url('/backgrounds/level-${bgIndex}.png')`;
    } else {
      document.body.style.backgroundImage = 'none';
    }
  }, [level, gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (document.activeElement?.tagName === 'INPUT') return; 
      
      if (e.key === 'ArrowLeft') {
        setDropColumn(c => Math.max(0, c - 1));
      } else if (e.key === 'ArrowRight') {
        setDropColumn(c => Math.min(12, c + 1));
      } else if (e.key === ' ' && !isDropping && roundId) {
        e.preventDefault(); 
        handleDrop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDropping, roundId, clientSeed, betAmount, dropColumn, gameState]);

  useEffect(() => {
    setClientSeed((Math.random() + 1).toString(36).substring(2, 10));
    prepareNewRound();
  }, []);

  const prepareNewRound = async () => {
    try {
      const res = await fetch('/api/rounds/commit', { method: 'POST' });
      const data = await res.json();
      setRoundId(data.roundId);
      setCommitHex(data.commitHex);
      setNonce(data.nonce);
      setLastResult(null); 
    } catch (err) {
      console.error('Failed to commit round', err);
    }
  };

  const startGame = () => {
    setGameState('PLAYING');
  };

  const quitGame = () => {
    setGameState('MENU');
    setLevel(1);
    setDropsAtCurrentLevel(0);
  };

  const handleDrop = async () => {
    if (!roundId || isDropping || balance < betAmount) return;

    setIsDropping(true);
    setBalance(b => b - betAmount);

    try {
      const res = await fetch(`/api/rounds/${roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSeed,
          betCents: betAmount,
          dropColumn
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPath(data.path);
    } catch (err) {
      console.error(err);
      setIsDropping(false);
      setBalance(b => b + betAmount); 
    }
  };

  const handleDropComplete = async () => {
    setIsDropping(false);
    
    // Level Up logic: 10 drops per level
    const newDropsCount = dropsAtCurrentLevel + 1;
    if (newDropsCount >= 10) {
      setDropsAtCurrentLevel(0);
      setLevel(l => l + 1);
    } else {
      setDropsAtCurrentLevel(newDropsCount);
    }

    if (!roundId) return;

    try {
      const res = await fetch(`/api/rounds/${roundId}/reveal`, { method: 'POST' });
      const data = await res.json();
      
      setLastResult(data);
      if (data.payoutMultiplier) {
          setBalance(b => b + (data.betCents * data.payoutMultiplier));
      }
      
      prepareNewRound();
      setClientSeed(prev => (parseInt(prev, 36) + 1).toString(36).substring(0, 8) || "hello");

    } catch (err) {
      console.error('Failed to reveal round', err);
    }
  };

  if (gameState === 'MENU') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 relative" style={{
        backgroundImage: "url('/backgrounds/menu.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}>
        {/* Animated Bubbles Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
           {[...Array(10)].map((_, i) => (
             <div 
               key={i}
               className="absolute rounded-full bg-cyan-200/20 blur-sm animate-pulse"
               style={{
                 width: Math.random() * 100 + 20 + 'px',
                 height: Math.random() * 100 + 20 + 'px',
                 left: Math.random() * 100 + '%',
                 top: Math.random() * 100 + '%',
                 animationDelay: Math.random() * 5 + 's',
                 animationDuration: Math.random() * 10 + 5 + 's'
               }}
             />
           ))}
        </div>

        <div className="w-full max-w-lg aquatic-panel p-12 flex flex-col items-center gap-8 relative z-10 border-t-4 border-t-cyan-400 bg-black/40 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-2 mb-4">
            <h1 className="text-5xl font-black tracking-widest text-white text-center drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] uppercase">
              Pond <span className="text-cyan-400">of</span> Plinko
            </h1>
            <div className="h-1 w-24 bg-cyan-400 rounded-full" />
          </div>

          <div className="w-full flex flex-col gap-6">
            <button 
              onClick={startGame}
              className="tactile-btn btn-primary w-full text-2xl py-6 flex items-center justify-center gap-3 shadow-[0_4px_0_#b8860b]"
            >
              Start Adventure
            </button>
            <button 
              onClick={() => {}}
              className="tactile-btn w-full text-xl py-4 flex items-center justify-center gap-3 opacity-50 grayscale cursor-not-allowed"
            >
              High Scores
            </button>
            <button 
              onClick={() => alert('See you next time on the Plinko Pond!')}
              className="tactile-btn btn-danger w-full text-xl py-4 flex items-center justify-center gap-3 shadow-[0_4px_0_#8b0000]"
            >
              Quit
            </button>
          </div>
          
          <div className="text-center text-cyan-200/80 text-sm tracking-widest uppercase mt-4 bg-black/50 px-4 py-2 rounded-lg">
            Provably Fair • Ancient Wisdom • Infinite Drops
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-7xl mx-auto gap-8 relative z-10">
      
      {/* Ancient Stone Header */}
      <header className="w-full h-20 aquatic-panel flex justify-between items-center px-8 mb-4 border-b-8 border-[#3b2517]">
        <div className="flex items-center gap-6">
          <button 
            onClick={quitGame}
            className="tactile-btn px-6 py-2 text-xs"
            disabled={isDropping}
          >
            Menu
          </button>
          <div className="hidden md:flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-widest text-sm drop-shadow-md">
             <Trophy className="w-4 h-4 text-yellow-300" />
             <span className="text-white drop-shadow-md">Level {level}</span>
          </div>
        </div>
        
        <div className="hidden lg:block">
           <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic drop-shadow-lg">
             Pond <span className="text-yellow-400 drop-shadow-lg">of</span> Plinko
           </h2>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center bg-[#4a2f1d] px-6 py-2 border-4 border-[#25170e] rounded-lg gap-3 shadow-inner">
              <Coins className="w-5 h-5 text-yellow-400 drop-shadow-md" />
              <span className="font-mono text-xl text-white font-bold tracking-tight drop-shadow-md">
                {(balance / 100).toFixed(2)}
              </span>
           </div>
           
           <button 
             onClick={() => setMuted(!muted)} 
             className="tactile-btn p-3"
           >
             {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full mt-2">
        {/* Controls Sidebar (Left) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           <div className="aquatic-panel p-6 flex flex-col gap-8">
              <h3 className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-2 drop-shadow-md border-b-4 border-[#4a2f1d] pb-2">Sacred Offerings</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] text-white uppercase font-black tracking-widest block ml-1 drop-shadow-md">Bet Amount</label>
                <div className="relative">
                  <input 
                      type="number" 
                      value={betAmount / 100}
                      onChange={e => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0) * 100)}
                      className="w-full bg-[#3b2517] border-4 border-[#25170e] rounded-lg px-4 py-4 text-white font-mono text-xl focus:outline-none focus:border-[#fca311] transition-colors shadow-inner"
                      disabled={isDropping}
                   />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] text-white uppercase font-black tracking-widest px-1 drop-shadow-md">
                  <span>Drop Portal</span>
                  <span className="text-yellow-400 text-lg drop-shadow-md">{dropColumn}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="12" 
                  value={dropColumn} 
                  onChange={e => setDropColumn(parseInt(e.target.value))}
                  className="w-full h-4 bg-[#25170e] rounded-lg appearance-none cursor-pointer accent-[#fca311] shadow-inner"
                  disabled={isDropping}
                />
              </div>

              <button 
                onClick={handleDrop} 
                disabled={isDropping || !roundId || balance < betAmount}
                className="tactile-btn btn-primary w-full py-6 text-xl mt-4"
              >
                {isDropping ? 'Summoning...' : 'Summon Sphere'}
              </button>
           </div>

           <div className="aquatic-panel p-4 flex flex-col gap-3">
             <div className="flex items-center gap-2 text-yellow-400 text-[10px] uppercase font-black">
               <Settings className="w-3 h-3" />
               Round Config
             </div>
             <input 
                 type="text" 
                 value={clientSeed}
                 onChange={e => setClientSeed(e.target.value)}
                 className="w-full bg-[#3b2517] border-4 border-[#25170e] rounded-lg px-3 py-2 text-xs text-white/70 font-mono focus:outline-none"
                 disabled={isDropping}
              />
           </div>
        </div>

        {/* Game Area (Center) */}
        <div className="lg:col-span-3 flex flex-col gap-6 w-full">
            <PlinkoBoard 
                path={path} 
                isDropping={isDropping} 
                dropColumn={dropColumn} 
                onDropComplete={handleDropComplete}
                muted={muted}
            />
            
            <div className="flex flex-wrap gap-4 items-center justify-between w-full">
               {/* Provably Fair Info Bar */}
               <div className="flex-1 aquatic-panel py-3 px-6 flex items-center justify-between text-[10px] tracking-[0.2em] font-bold min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 drop-shadow-md" />
                    <span className="text-white drop-shadow-md">COMMITMENT_ID:</span>
                  </div>
                  <span className="truncate ml-4 font-mono text-yellow-400 drop-shadow-md">{commitHex}</span>
               </div>

               {/* Last Result Card */}
               {lastResult && (
                 <div className="aquatic-panel py-3 px-8 flex items-center gap-8 shrink-0">
                    <div className="flex flex-col">
                       <span className="text-[9px] uppercase font-black text-white drop-shadow-md tracking-wider">Multiplier</span>
                       <span className={`text-xl font-bold drop-shadow-md ${lastResult.payoutMultiplier >= 1 ? 'text-emerald-400' : 'text-[#d62828]'}`}>
                         {lastResult.payoutMultiplier}x
                       </span>
                    </div>
                    <div className="h-8 w-px bg-white/30" />
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] uppercase font-black text-white drop-shadow-md tracking-wider">Sacred Payout</span>
                       <span className="text-xl font-bold text-yellow-400 drop-shadow-md">
                         {((lastResult.betCents * lastResult.payoutMultiplier) / 100).toFixed(2)}
                       </span>
                    </div>
                    <Link 
                      href={`/verify?serverSeed=${lastResult.serverSeed}&clientSeed=${lastResult.clientSeed}&nonce=${lastResult.nonce}&dropColumn=${lastResult.dropColumn}`}
                      className="ml-2 tactile-btn px-4 py-2 text-[8px] bg-[#3b2517] border-[#25170e]"
                      target="_blank"
                    >
                      Audit Hash
                    </Link>
                 </div>
               )}
            </div>
        </div>
      </div>
    </main>
  );
}
