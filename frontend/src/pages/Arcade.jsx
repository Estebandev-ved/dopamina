import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, Square, RefreshCw, Volume2, VolumeX, Copy, Check, Info, Award } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function Arcade() {
  const [activeTab, setActiveTab] = useState('catch'); // 'catch' or 'beatmaker'

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-20 overflow-hidden select-none">
        {/* Ambient Industrial Grid */}
        <div className="absolute inset-0 industrial-grid opacity-20 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold tracking-[0.3em] text-neon-purple uppercase bg-neon-purple/10 px-3 py-1 rounded-full border border-neon-purple/20" style={{ color: 'var(--color-neon)', borderColor: 'var(--color-neon-shadow-sm)', backgroundColor: 'var(--color-neon-shadow-sm)' }}>
              Zona Recreativa & Recompensas
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-wider uppercase">
              DOPAMINA ARCADE
            </h1>
            <div className="w-16 h-[2px] bg-neon-purple mx-auto mt-4" style={{ backgroundColor: 'var(--color-neon)' }} />
            <p className="text-xs text-gray-400 mt-3 max-w-md mx-auto">
              Experimenta con ritmos industriales u obtén más de 100 puntos en el arcade para reclamar tu cupón de descuento.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8 gap-4">
            <button
              onClick={() => setActiveTab('catch')}
              className={`px-6 py-3 font-mono font-bold uppercase tracking-wider text-xs border rounded transition-all duration-300 cursor-pointer ${
                activeTab === 'catch'
                  ? 'bg-neon-purple text-white border-neon-purple shadow-neon-sm'
                  : 'bg-industrial-950/40 text-gray-400 border-industrial-800 hover:text-white hover:border-neon-purple/50'
              }`}
              style={{ 
                backgroundColor: activeTab === 'catch' ? 'var(--color-neon)' : '',
                borderColor: activeTab === 'catch' ? 'var(--color-neon)' : '',
                boxShadow: activeTab === 'catch' ? '0 0 10px var(--color-neon-shadow-md)' : ''
              }}
            >
              🕹️ Dopamine Catch
            </button>
            <button
              onClick={() => setActiveTab('beatmaker')}
              className={`px-6 py-3 font-mono font-bold uppercase tracking-wider text-xs border rounded transition-all duration-300 cursor-pointer ${
                activeTab === 'beatmaker'
                  ? 'bg-neon-purple text-white border-neon-purple shadow-neon-sm'
                  : 'bg-industrial-950/40 text-gray-400 border-industrial-800 hover:text-white hover:border-neon-purple/50'
              }`}
              style={{ 
                backgroundColor: activeTab === 'beatmaker' ? 'var(--color-neon)' : '',
                borderColor: activeTab === 'beatmaker' ? 'var(--color-neon)' : '',
                boxShadow: activeTab === 'beatmaker' ? '0 0 10px var(--color-neon-shadow-md)' : ''
              }}
            >
              🎛️ Techno Beatmaker
            </button>
          </div>

          {/* Tab Contents */}
          <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 sm:p-8 relative">
            {activeTab === 'catch' ? <DopamineCatchGame /> : <TechnoBeatmaker />}
          </div>

        </div>
      </div>
    </PageTransition>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GAME 1: DOPAMINE CATCH (CANVAS GAME)
   ───────────────────────────────────────────────────────────────────────────── */
function DopamineCatchGame() {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'won', 'lost'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  // References for keeping track of fast mutations in game loop
  const stateRef = useRef({
    score: 0,
    lives: 3,
    gameState: 'idle',
    soundEnabled: true,
    playerX: 0,
    playerWidth: 90,
    playerHeight: 18,
    keys: { left: false, right: false },
    fallingObjects: [],
    spawnTimer: 0,
    speedMultiplier: 1.0,
    animationId: null
  });

  // Sync state values to ref on state changes
  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    stateRef.current.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  // Audio synthesis helpers
  const playSynthSound = (type) => {
    if (!stateRef.current.soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'point') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'damage') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3); // dropping pitch
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'win') {
        // Play chord arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major notes arpeggio
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + index * 0.08);
          osc.stop(ctx.currentTime + index * 0.08 + 0.45);
        });
      }
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game loop management
  const startGame = () => {
    setScore(0);
    setLives(3);
    setGameState('playing');
    setCopied(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset loop reference state
    stateRef.current.score = 0;
    stateRef.current.lives = 3;
    stateRef.current.playerX = canvas.width / 2 - stateRef.current.playerWidth / 2;
    stateRef.current.fallingObjects = [];
    stateRef.current.spawnTimer = 0;
    stateRef.current.speedMultiplier = 1.0;
    
    if (stateRef.current.animationId) {
      cancelAnimationFrame(stateRef.current.animationId);
    }

    stateRef.current.animationId = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas || stateRef.current.gameState !== 'playing') return;

    const ctx = canvas.getContext('2d');
    
    // Clear screen
    ctx.fillStyle = '#060609';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid details (faded blue/violet)
    ctx.strokeStyle = 'rgba(177, 78, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Move player
    const moveSpeed = 8;
    if (stateRef.current.keys.left) {
      stateRef.current.playerX = Math.max(0, stateRef.current.playerX - moveSpeed);
    }
    if (stateRef.current.keys.right) {
      stateRef.current.playerX = Math.min(canvas.width - stateRef.current.playerWidth, stateRef.current.playerX + moveSpeed);
    }

    // Draw player (DJ Deck)
    const px = stateRef.current.playerX;
    const py = canvas.height - 40;
    const pw = stateRef.current.playerWidth;
    const ph = stateRef.current.playerHeight;

    // Glowing outline
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'var(--color-neon)';
    ctx.fillStyle = 'var(--color-neon)';
    
    // Rounded deck structure
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 5);
    ctx.fill();

    // Turntables inside player deck
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(px + pw * 0.25, py + ph / 2, ph / 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + pw * 0.75, py + ph / 2, ph / 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(px + pw / 2 - 5, py + 3, 10, ph - 6);

    // Difficulty scaling
    stateRef.current.speedMultiplier = 1.0 + (stateRef.current.score / 150);

    // Spawn falling objects
    stateRef.current.spawnTimer++;
    const spawnRate = Math.max(25, 55 - Math.floor(stateRef.current.score / 10));
    if (stateRef.current.spawnTimer >= spawnRate) {
      stateRef.current.spawnTimer = 0;

      // Types of items:
      // 'dopamine' (purple orb), 'ticket' (golden ticket), 'vinyl' (cyan vinyl), 'distort' (red cross)
      const rand = Math.random();
      let type = 'dopamine';
      let color = '#FF2A85'; // Dopamine pink/purple
      let scoreVal = 10;
      let size = 10;

      if (rand < 0.2) {
        type = 'ticket';
        color = '#FFC800'; // Gold ticket
        scoreVal = 20;
        size = 12;
      } else if (rand < 0.45) {
        type = 'vinyl';
        color = '#00D8FF'; // Cyan vinyl
        scoreVal = 15;
        size = 11;
      } else if (rand < 0.65) {
        type = 'distort';
        color = '#FF3E3E'; // Red damage
        scoreVal = -25;
        size = 11;
      }

      stateRef.current.fallingObjects.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20,
        vy: (Math.random() * 2 + 3) * stateRef.current.speedMultiplier,
        type,
        color,
        scoreVal,
        size
      });
    }

    // Update and draw objects
    const objects = stateRef.current.fallingObjects;
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      obj.y += obj.vy;

      // Draw item
      ctx.shadowBlur = 8;
      ctx.shadowColor = obj.color;
      ctx.fillStyle = obj.color;

      if (obj.type === 'dopamine') {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
        ctx.fill();
        // Inner circle
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(obj.x - 3, obj.y - 3, obj.size / 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'vinyl') {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
        ctx.fill();
        // Hole
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#060609';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size / 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'ticket') {
        ctx.beginPath();
        ctx.roundRect(obj.x - obj.size, obj.y - obj.size / 1.5, obj.size * 2, obj.size * 1.3, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = '7px Courier New';
        ctx.fillText('VIP', obj.x - 6, obj.y + 2);
      } else if (obj.type === 'distort') {
        // Red X / Glitch hazard
        ctx.lineWidth = 3;
        ctx.strokeStyle = obj.color;
        ctx.beginPath();
        ctx.moveTo(obj.x - obj.size, obj.y - obj.size);
        ctx.lineTo(obj.x + obj.size, obj.y + obj.size);
        ctx.moveTo(obj.x + obj.size, obj.y - obj.size);
        ctx.lineTo(obj.x - obj.size, obj.y + obj.size);
        ctx.stroke();
      }

      // Check collision with player
      const nextPy = py;
      if (
        obj.y + obj.size >= nextPy &&
        obj.y - obj.size <= nextPy + ph &&
        obj.x + obj.size >= px &&
        obj.x - obj.size <= px + pw
      ) {
        // Collided!
        if (obj.type === 'distort') {
          stateRef.current.lives--;
          setLives(stateRef.current.lives);
          playSynthSound('damage');
          
          // Flash effect
          ctx.fillStyle = 'rgba(255, 62, 62, 0.4)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          stateRef.current.score += obj.scoreVal;
          setScore(stateRef.current.score);
          playSynthSound('point');
        }

        // Remove from list
        objects.splice(i, 1);
        continue;
      }

      // Out of bounds check
      if (obj.y - obj.size > canvas.height) {
        objects.splice(i, 1);
      }
    }

    // Check game conditions
    if (stateRef.current.score >= 100) {
      setGameState('won');
      playSynthSound('win');
      cancelAnimationFrame(stateRef.current.animationId);
      return;
    }

    if (stateRef.current.lives <= 0) {
      setGameState('lost');
      playSynthSound('damage');
      cancelAnimationFrame(stateRef.current.animationId);
      return;
    }

    stateRef.current.animationId = requestAnimationFrame(gameLoop);
  };

  const handlePointerDown = (side) => {
    if (side === 'left') stateRef.current.keys.left = true;
    if (side === 'right') stateRef.current.keys.right = true;
  };

  const handlePointerUp = () => {
    stateRef.current.keys.left = false;
    stateRef.current.keys.right = false;
  };

  const copyCoupon = () => {
    navigator.clipboard.writeText('DOPA-ARCADE-10');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Game controls and score header */}
      <div className="w-full flex flex-wrap justify-between items-center bg-black/40 border border-industrial-800/80 rounded-lg p-4 mb-6 gap-4">
        
        {/* Score & Lives */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-500 uppercase">PUNTOS</span>
            <span className="text-xl font-black text-neon-glow font-mono" style={{ textShadow: '0 0 6px var(--color-neon)' }}>
              {score} <span className="text-xs text-gray-500">/ 100</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-500 uppercase">VIDAS</span>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3].map((heart) => (
                <div 
                  key={heart} 
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    heart <= lives ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]' : 'bg-industrial-800'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Instructions Quick Box */}
        <div className="hidden md:flex items-center gap-3 text-xs text-gray-400 bg-industrial-950/50 px-4 py-2 border border-industrial-800/40 rounded font-mono">
          <Info className="w-4 h-4 text-neon-purple" style={{ color: 'var(--color-neon)' }} />
          <span>Controles: <kbd className="bg-industrial-800 px-1.5 py-0.5 rounded text-white text-[10px]">A</kbd> / <kbd className="bg-industrial-800 px-1.5 py-0.5 rounded text-white text-[10px]">D</kbd> o <kbd className="bg-industrial-800 px-1.5 py-0.5 rounded text-white text-[10px]">←</kbd> / <kbd className="bg-industrial-800 px-1.5 py-0.5 rounded text-white text-[10px]">→</kbd></span>
        </div>

        {/* Audio Toggle / Restart */}
        <div className="flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-10 h-10 border border-industrial-800 rounded bg-industrial-950/40 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-neon-purple" style={{ color: 'var(--color-neon)' }} /> : <VolumeX className="w-4 h-4" />}
          </button>

          {gameState !== 'playing' ? (
            <button
              onClick={startGame}
              className="px-4 py-2 font-mono font-bold uppercase tracking-wider text-xs bg-neon-purple border border-neon-purple text-white rounded cursor-pointer shadow-neon-sm hover:bg-neon-light transition-all flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-neon)', borderColor: 'var(--color-neon)', boxShadow: '0 0 10px var(--color-neon-shadow-sm)' }}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Jugar
            </button>
          ) : (
            <button
              onClick={() => setGameState('idle')}
              className="px-4 py-2 font-mono font-bold uppercase tracking-wider text-xs border border-red-500/40 bg-red-950/10 text-red-400 rounded cursor-pointer hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Detener
            </button>
          )}
        </div>
      </div>

      {/* Main Game Screen Board */}
      <div className="relative border border-industrial-800/80 rounded-lg overflow-hidden w-full max-w-[800px] aspect-[4/3] sm:aspect-[16/10] bg-[#060609]">
        
        {/* Canvas Element */}
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500} 
          className="w-full h-full block" 
        />

        {/* Overlay States */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col justify-center items-center text-center p-6 z-10 animate-fadeIn">
            <Trophy className="w-12 h-12 text-neon-purple mb-4 animate-bounce" style={{ color: 'var(--color-neon)' }} />
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Desafío Dopamina</h3>
            <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
              Atrapa las moléculas de dopamina, vinilos y boletas VIP. Evita a toda costa las malas vibras (rojas) que dañan tu sistema de audio.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 font-mono font-black uppercase tracking-widest text-xs bg-neon-purple text-white border border-neon-purple rounded cursor-pointer shadow-neon-md transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-neon)', borderColor: 'var(--color-neon)', boxShadow: '0 0 15px var(--color-neon-shadow-lg)' }}
            >
              INICIAR RITUAL
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col justify-center items-center text-center p-6 z-10">
            <span className="text-4xl mb-4">🔇</span>
            <h3 className="text-xl font-black text-red-500 uppercase tracking-wider mb-2">Se apagó la pista</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-6">
              Las vibras negativas distorsionaron el sistema de audio. ¡Vuelve a intentarlo para ganarte la recompensa!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 font-mono font-bold uppercase tracking-wider text-xs border border-red-500 bg-red-950/20 text-red-400 rounded cursor-pointer hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> REINTENTAR
            </button>
          </div>
        )}

        {gameState === 'won' && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col justify-center items-center text-center p-8 z-10 animate-fadeIn">
            <Award className="w-14 h-14 text-green-400 mb-3 animate-pulse" style={{ filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.4))' }} />
            <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-1">¡Sobredosis de Ritmo!</h3>
            <p className="text-[10px] font-mono text-green-400 uppercase tracking-widest mb-6">LOGRO DESBLOQUEADO: MASTER RAver</p>
            
            {/* Reward Coupon Card */}
            <div className="bg-industrial-950/80 border border-green-500/30 rounded-lg p-5 w-full max-w-xs mb-8 flex flex-col items-center shadow-lg relative">
              <span className="text-[9px] font-mono text-gray-500 uppercase mb-1">CUPÓN DE 10% DE DESCUENTO</span>
              <div className="text-lg font-black text-white tracking-widest font-mono select-all bg-black/60 px-4 py-2 border border-industrial-800 rounded">
                DOPA-ARCADE-10
              </div>
              <button
                onClick={copyCoupon}
                className="mt-3.5 flex items-center gap-1.5 text-[10px] font-mono text-gray-400 hover:text-green-400 transition-colors uppercase"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" /> Copiado con éxito
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar Código
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="px-5 py-2.5 font-mono font-bold uppercase tracking-wider text-xs border border-industrial-800 text-gray-400 hover:text-white rounded cursor-pointer transition-colors"
              >
                Volver a Jugar
              </button>
              <a
                href="/eventos"
                className="px-6 py-2.5 font-mono font-black uppercase tracking-wider text-xs bg-green-500 text-black rounded cursor-pointer shadow-[0_0_10px_rgba(74,222,128,0.45)] hover:bg-green-400 transition-all flex items-center gap-1.5"
              >
                Adquirir Boleta
              </a>
            </div>
          </div>
        )}

        {/* Touch controls for mobile */}
        {gameState === 'playing' && (
          <div className="absolute inset-x-0 bottom-0 top-1/2 flex pointer-events-none md:hidden select-none">
            <div 
              className="flex-1 pointer-events-auto active:bg-white/[0.02]" 
              onTouchStart={() => handlePointerDown('left')}
              onTouchEnd={handlePointerUp}
              onMouseDown={() => handlePointerDown('left')}
              onMouseUp={handlePointerUp}
            />
            <div 
              className="flex-1 pointer-events-auto active:bg-white/[0.02] border-l border-white/[0.01]" 
              onTouchStart={() => handlePointerDown('right')}
              onTouchEnd={handlePointerUp}
              onMouseDown={() => handlePointerDown('right')}
              onMouseUp={handlePointerUp}
            />
          </div>
        )}
      </div>

      <div className="mt-4 text-[10px] text-gray-500 font-mono flex items-center gap-1">
        <span>● Púrpura/Azul/Oro = Puntos</span>
        <span className="mx-2">|</span>
        <span>● Rojo = Peligro (-Vida)</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GAME 2: TECHNO BEATMAKER (STEP SEQUENCER)
   ───────────────────────────────────────────────────────────────────────────── */
function TechnoBeatmaker() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(132);
  const [currentStep, setCurrentStep] = useState(-1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [achievement, setAchievement] = useState(false);
  const visualizerRef = useRef(null);

  const audioCtxRef = useRef(null);
  const schedulerTimerRef = useRef(null);
  const nextNoteTimeRef = useRef(0.0);
  const bpmRef = useRef(bpm);
  const isPlayingRef = useRef(false);

  // Sound channels: Kick, Clap, Hi-hat, Bassline, Resonant Acid Lead
  const channels = [
    { name: 'KICK', key: 'kick', color: '#B14EFF' },
    { name: 'CLAP', key: 'clap', color: '#FF2A85' },
    { name: 'HI-HAT', key: 'hat', color: '#00D8FF' },
    { name: 'BASS', key: 'bass', color: '#FF6B00' },
    { name: 'ACID', key: 'acid', color: '#00FF66' }
  ];

  // Grid state: 5 channels x 16 steps
  const [grid, setGrid] = useState(() => 
    Array(5).fill(null).map(() => Array(16).fill(false))
  );

  const gridRef = useRef(grid);
  const currentStepRef = useRef(currentStep);

  // Sync refs to avoid stale closures in scheduler loop
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Audio nodes and visualizer analyzer connection
  const analyserNodeRef = useRef(null);

  // Initialize Audio Context, Analyser and run Visualizer drawing
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.connect(ctx.destination);
      
      audioCtxRef.current = ctx;
      analyserNodeRef.current = analyser;

      drawVisualizer();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Synthesize sounds on fly using Web Audio API nodes
  const playSynthesizedDrum = (type, time) => {
    if (!soundEnabled) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Connect to analyser for reactive visualizer
    const output = analyserNodeRef.current || ctx.destination;

    if (type === 'kick') {
      // 909 style deep pitch sweep kick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(output);

      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.12);
      
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      
      osc.start(time);
      osc.stop(time + 0.23);
    } else if (type === 'clap') {
      // Noise burst for clap
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;

      const gain = ctx.createGain();
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(output);

      // Multiple mini-envelopes to simulate claps rubbing
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
      gain.gain.setValueAtTime(0.2, time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.055);
      gain.gain.setValueAtTime(0.25, time + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      noise.start(time);
      noise.stop(time + 0.16);
    } else if (type === 'hat') {
      // Noise burst for high-hat
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;

      const gain = ctx.createGain();
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(output);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      noise.start(time);
      noise.stop(time + 0.045);
    } else if (type === 'bass') {
      // Deep 303 style detuned sawtooth bass note
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65.41, time); // C2

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, time);
      filter.frequency.exponentialRampToValueAtTime(80, time + 0.18);
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(output);

      osc.start(time);
      osc.stop(time + 0.21);
    } else if (type === 'acid') {
      // High pitch resonant Acid synth
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      // Acid line note selection based on step index to make it interesting
      const scale = [130.81, 146.83, 155.56, 174.61, 196.00, 220.00, 233.08, 261.63]; // C minor scale
      const stepIdx = currentStepRef.current >= 0 ? currentStepRef.current : 0;
      const noteFreq = scale[stepIdx % scale.length] * 2.0; // Higher octave
      
      osc.frequency.setValueAtTime(noteFreq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      filter.frequency.exponentialRampToValueAtTime(3200, time + 0.08);
      filter.frequency.exponentialRampToValueAtTime(300, time + 0.18);
      filter.Q.value = 12;

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(output);

      osc.start(time);
      osc.stop(time + 0.19);
    }
  };

  // Scheduler loop
  const scheduleNextStep = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const secondsPerBeat = 60.0 / bpmRef.current;
    const stepDuration = secondsPerBeat / 4.0; // 16th notes

    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const playTime = nextNoteTimeRef.current;
      const nextStep = (currentStepRef.current + 1) % 16;
      
      // Advance step inside scheduler thread
      currentStepRef.current = nextStep;
      
      // Call UI sync helper (indirectly sets state)
      // Note: React states are async, so we trigger callback
      const targetStep = nextStep;
      setTimeout(() => {
        if (isPlayingRef.current) {
          setCurrentStep(targetStep);
        }
      }, 0);

      // Trigger active sounds for this step
      const stepGrid = gridRef.current;
      channels.forEach((ch, idx) => {
        if (stepGrid[idx][nextStep]) {
          playSynthesizedDrum(ch.key, playTime);
        }
      });

      nextNoteTimeRef.current += stepDuration;
    }

    schedulerTimerRef.current = setTimeout(scheduleNextStep, 25);
  };

  // Canvas visualizer drawer loop
  const drawVisualizer = () => {
    const canvas = visualizerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserNodeRef.current;
    if (!ctx || !analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!visualizerRef.current) return;
      requestAnimationFrame(render);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#0f0f15';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bars
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.8;

        // Gradient based on theme
        const glowColor = 'var(--color-neon)';
        ctx.fillStyle = glowColor;
        ctx.shadowBlur = 6;
        ctx.shadowColor = glowColor;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
      ctx.shadowBlur = 0;
    };

    render();
  };

  const handlePlayToggle = () => {
    initAudio();
    if (isPlaying) {
      clearTimeout(schedulerTimerRef.current);
      setIsPlaying(false);
      setCurrentStep(-1);
    } else {
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduleNextStep();

      // Trigger achievement if user active beats are set
      let totalHits = 0;
      grid.forEach(row => row.forEach(cell => { if (cell) totalHits++; }));
      if (totalHits >= 4) {
        setAchievement(true);
      }
    }
  };

  const handleCellClick = (chIdx, stepIdx) => {
    initAudio();
    const newGrid = grid.map((row, rIdx) => 
      row.map((val, sIdx) => {
        if (rIdx === chIdx && sIdx === stepIdx) {
          // Play instant sound feedback
          if (!val) {
            playSynthesizedDrum(channels[chIdx].key, audioCtxRef.current.currentTime);
          }
          return !val;
        }
        return val;
      })
    );
    setGrid(newGrid);

    // Achievements check
    let totalHits = 0;
    newGrid.forEach(row => row.forEach(cell => { if (cell) totalHits++; }));
    if (totalHits >= 4 && isPlaying) {
      setAchievement(true);
    }
  };

  const clearGrid = () => {
    setGrid(Array(5).fill(null).map(() => Array(16).fill(false)));
    setAchievement(false);
  };

  useEffect(() => {
    return () => {
      clearTimeout(schedulerTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-stretch">
      {/* Sequencer Header Controls */}
      <div className="flex flex-wrap justify-between items-center bg-black/40 border border-industrial-800/80 rounded-lg p-4 mb-6 gap-4">
        
        {/* Play & Clear */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayToggle}
            className={`px-6 py-2.5 font-mono font-black uppercase tracking-wider text-xs border rounded cursor-pointer transition-all flex items-center gap-2 ${
              isPlaying 
                ? 'bg-red-950/20 border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white' 
                : 'bg-neon-purple text-white border-neon-purple shadow-neon-sm hover:bg-neon-light'
            }`}
            style={{ 
              backgroundColor: isPlaying ? '' : 'var(--color-neon)', 
              borderColor: isPlaying ? '' : 'var(--color-neon)',
              boxShadow: isPlaying ? '' : '0 0 10px var(--color-neon-shadow-sm)'
            }}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> STOP
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> RUN BEAT
              </>
            )}
          </button>

          <button
            onClick={clearGrid}
            className="px-4 py-2.5 font-mono font-bold uppercase tracking-wider text-xs border border-industrial-800 text-gray-400 hover:text-white rounded cursor-pointer transition-colors"
          >
            Limpiar Grid
          </button>
        </div>

        {/* BPM Slider */}
        <div className="flex items-center gap-3 bg-industrial-950/40 border border-industrial-800/60 rounded px-4 py-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase">VELOCIDAD:</span>
          <input 
            type="range" 
            min="120" 
            max="150" 
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-24 sm:w-32 accent-neon-purple cursor-pointer"
          />
          <span className="text-xs font-black text-white font-mono w-14 text-right">
            {bpm} <span className="text-[9px] text-gray-500">BPM</span>
          </span>
        </div>

        {/* Visualizer & Audio Control */}
        <div className="flex items-center gap-3">
          {/* Faded spectrum canvas */}
          <canvas 
            ref={visualizerRef} 
            width={120} 
            height={34} 
            className="bg-[#0f0f15] border border-industrial-800/40 rounded overflow-hidden hidden sm:block" 
          />

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-10 h-10 border border-industrial-800 rounded bg-industrial-950/40 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-neon-purple" style={{ color: 'var(--color-neon)' }} /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Grid Sequencer Table */}
      <div className="overflow-x-auto bg-black/40 border border-industrial-800/60 rounded-lg p-3 sm:p-5 mb-6">
        <div className="min-w-[650px] space-y-3.5">
          {channels.map((ch, chIdx) => (
            <div key={ch.key} className="flex items-center gap-3">
              {/* Channel Label */}
              <div className="w-16 flex-shrink-0 text-left">
                <span 
                  className="text-[10px] font-black font-mono tracking-wider block"
                  style={{ color: ch.color }}
                >
                  {ch.name}
                </span>
              </div>

              {/* Steps (16 nodes) */}
              <div className="flex-1 grid grid-cols-16 gap-1.5 sm:gap-2">
                {grid[chIdx].map((isActiveStep, stepIdx) => {
                  const isCurrentSweep = currentStep === stepIdx;
                  // Group steps into blocks of 4 for easy read
                  const isQuarterBlock = Math.floor(stepIdx / 4) % 2 === 0;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => handleCellClick(chIdx, stepIdx)}
                      className={`aspect-square w-full rounded-sm border transition-all cursor-pointer relative ${
                        isActiveStep 
                          ? 'shadow-[0_0_8px_rgba(255,255,255,0.1)]'
                          : isQuarterBlock 
                            ? 'bg-industrial-950/70 border-industrial-800/80 hover:border-industrial-700' 
                            : 'bg-industrial-900/30 border-industrial-800/40 hover:border-industrial-700'
                      }`}
                      style={{
                        backgroundColor: isActiveStep 
                          ? ch.color 
                          : isCurrentSweep 
                            ? 'rgba(255,255,255,0.15)' 
                            : '',
                        borderColor: isActiveStep 
                          ? ch.color 
                          : isCurrentSweep 
                            ? 'var(--color-neon)' 
                            : '',
                        boxShadow: isActiveStep 
                          ? `0 0 10px ${ch.color}60` 
                          : ''
                      }}
                      title={`${ch.name} - Paso ${stepIdx + 1}`}
                    >
                      {/* Sweep playhead dot */}
                      {isCurrentSweep && (
                        <div className="absolute inset-0 bg-white/35 rounded-sm animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid guide */}
      <div className="flex justify-between items-center text-[9px] font-mono text-gray-500">
        <span>● Cada bloque contiene 4 tiempos (16 pasos en total)</span>
        
        {/* Achievement Badge */}
        {achievement && (
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded animate-fadeIn">
            <Trophy className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-wider">Logro: Arquitecto del Ritmo</span>
          </div>
        )}
      </div>

    </div>
  );
}
