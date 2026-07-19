import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, Square, RefreshCw, Volume2, VolumeX, Copy, Check, Info, Award, Ticket, Lock, Loader2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { api } from '../services/api';

/* ─────────────────────────────────────────────────────────────────────────────
   ARCADE REWARDS — score tiers → discount coupons / free ticket
   Thresholds must match the backend (ArcadeController.THRESHOLDS).
   ───────────────────────────────────────────────────────────────────────────── */
export const GAME_THRESHOLDS = {
  catch:    [80, 200, 400, 1000],
  runner:   [80, 200, 400, 1000],
  snake:    [50, 120, 250, 500],
  beattap:  [300, 700, 1200, 2500],
  sequence: [120, 300, 600, 1000],
};

const TIER_LABELS = ['5% OFF', '10% OFF', '20% OFF', 'BOLETA GRATIS'];

/** Local (display-only) tier for a score; the backend is the source of truth. */
function localTier(juego, score) {
  const th = GAME_THRESHOLDS[juego] || [];
  let tier = 0;
  for (const t of th) if (score >= t) tier++;
  return tier;
}

/** Shows the reward tier thresholds for a given game. */
function TierInfo({ juego }) {
  const th = GAME_THRESHOLDS[juego] || [];
  if (th.length === 0) return null;
  const tierColors = ['#60A5FA', '#b14eff', '#FF6B00', '#4ADE80'];
  const tierLabels = ['5% OFF', '10% OFF', '20% OFF', 'BOLETA GRATIS'];
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {th.map((target, i) => (
        <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded border" style={{ color: tierColors[i], borderColor: `${tierColors[i]}40`, backgroundColor: `${tierColors[i]}10` }}>
          {target}+ pts → {tierLabels[i]}
        </span>
      ))}
    </div>
  );
}

/**
 * ArcadeReward — mounted inside a game's end screen. Claims the reward from the
 * backend (which validates the score, applies anti-farming + the lifetime free
 * ticket cap) and shows the resulting coupon.
 */
function ArcadeReward({ juego, puntaje }) {
  const [status, setStatus] = useState('loading'); // loading | needLogin | done | error
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const claimedRef = useRef(false);

  useEffect(() => {
    if (claimedRef.current) return;
    claimedRef.current = true;

    if (!api.isAuthenticated()) {
      setStatus('needLogin');
      return;
    }
    api.arcadeClaimReward(juego, puntaje)
      .then((res) => { setData(res); setStatus('done'); })
      .catch((err) => { setData({ mensaje: err.message || 'No se pudo reclamar el premio.' }); setStatus('error'); });
  }, [juego, puntaje]);

  const copyCode = () => {
    if (!data?.codigo) return;
    navigator.clipboard.writeText(data.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-gray-400 py-3">
        <Loader2 className="w-4 h-4 animate-spin" /> Calculando tu premio…
      </div>
    );
  }

  if (status === 'needLogin') {
    const tier = localTier(juego, puntaje);
    return (
      <div className="bg-industrial-950/80 border border-neon-purple/30 rounded-lg p-4 w-full max-w-xs text-center" style={{ borderColor: 'var(--color-neon-shadow-sm)' }}>
        <Lock className="w-6 h-6 mx-auto text-neon-purple mb-2" style={{ color: 'var(--color-neon)' }} />
        <p className="text-xs text-gray-300 mb-1">
          {tier > 0 ? `¡Alcanzaste ${TIER_LABELS[tier - 1]}!` : 'Juega para ganar premios.'}
        </p>
        <p className="text-[11px] text-gray-500 mb-3">Inicia sesión para reclamar tu premio.</p>
        <a href="/login" className="inline-block px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-wider bg-neon-purple text-white rounded" style={{ backgroundColor: 'var(--color-neon)' }}>
          Iniciar sesión
        </a>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4 w-full max-w-xs text-center">
        <p className="text-xs font-mono text-red-400">{data?.mensaje || 'Error al reclamar premio.'}</p>
        <p className="text-[10px] text-gray-500 mt-2">Tu puntaje: <span className="text-white font-bold">{puntaje}</span> pts</p>
      </div>
    );
  }

  // status === 'done'
  if (!data?.premio) {
    const th = GAME_THRESHOLDS[juego] || [];
    const nextTarget = data?.siguienteNivelEn;
    const progressPct = nextTarget && th[0] ? Math.min(1, (puntaje / th[0]) * 100) : 0;

    return (
      <div className="bg-industrial-950/80 border border-industrial-800 rounded-lg p-4 w-full max-w-xs text-center">
        <p className="text-[10px] font-mono text-gray-500 uppercase mb-1">Tu puntaje</p>
        <p className="text-lg font-black text-white font-mono mb-2">{puntaje} <span className="text-xs text-gray-500">pts</span></p>
        <p className="text-[10px] text-gray-400 mb-3">{data?.mensaje || 'Aún no alcanzas un premio.'}</p>

        {/* Mini tier progress */}
        <div className="space-y-2">
          {th.map((target, i) => {
            const reached = puntaje >= target;
            const pct = Math.min(100, (puntaje / target) * 100);
            const tierColors = ['#60A5FA', '#b14eff', '#FF6B00', '#4ADE80'];
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] font-mono w-16 text-right" style={{ color: reached ? tierColors[i] : '#555' }}>
                  {TIER_LABELS[i]}
                </span>
                <div className="flex-1 h-1.5 bg-industrial-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: tierColors[i],
                      boxShadow: reached ? `0 0 6px ${tierColors[i]}60` : 'none',
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono w-10 text-right" style={{ color: reached ? '#fff' : '#666' }}>
                  {target}
                </span>
              </div>
            );
          })}
        </div>

        {nextTarget != null && (
          <p className="text-[10px] text-gray-500 mt-2 font-mono">
            Llega a <span className="text-white font-bold">{nextTarget}</span> pts para el siguiente nivel.
          </p>
        )}
      </div>
    );
  }

  const esGratis = data.boletaGratis;
  const accent = esGratis ? '#4ADE80' : 'var(--color-neon)';
  const yaReclamado = data.yaReclamado;

  return (
    <div
      className="bg-industrial-950/80 border rounded-lg p-5 w-full max-w-xs flex flex-col items-center shadow-lg"
      style={{ borderColor: yaReclamado ? 'rgba(255,255,255,0.1)' : esGratis ? 'rgba(74,222,128,0.4)' : 'var(--color-neon-shadow-sm)' }}
    >
      {yaReclamado && (
        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded mb-2 border border-white/10">
          Ya reclamado hoy
        </span>
      )}
      {esGratis
        ? <Ticket className="w-8 h-8 mb-2" style={{ color: yaReclamado ? '#888' : accent }} />
        : <Award className="w-8 h-8 mb-2" style={{ color: yaReclamado ? '#888' : accent }} />}
      <span className="text-[9px] font-mono text-gray-500 uppercase mb-1 text-center">
        {esGratis ? 'CUPÓN DE BOLETA GRATIS' : `CUPÓN DE ${data.descuentoPorcentaje}% DE DESCUENTO`}
      </span>
      <div className={`text-base font-black tracking-widest font-mono select-all bg-black/60 px-4 py-2 border border-industrial-800 rounded text-center break-all ${yaReclamado ? 'text-gray-500' : 'text-white'}`}>
        {data.codigo}
      </div>
      <button
        onClick={copyCode}
        className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-gray-400 hover:text-white transition-colors uppercase cursor-pointer"
      >
        {copied
          ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copiado</>
          : <><Copy className="w-3.5 h-3.5" /> Copiar código</>}
      </button>
      {data.mensaje && (
        <p className="text-[10px] text-gray-500 mt-2 text-center leading-relaxed">{data.mensaje}</p>
      )}
      {!yaReclamado && (
        <a
          href="/eventos"
          className="mt-4 px-5 py-2 font-mono font-black uppercase tracking-wider text-[11px] rounded cursor-pointer transition-all text-black"
          style={{ backgroundColor: esGratis ? '#4ADE80' : 'var(--color-neon)' }}
        >
          {esGratis ? 'Reclamar boleta' : 'Usar en checkout'}
        </a>
      )}
    </div>
  );
}

export default function Arcade() {
  const [activeTab, setActiveTab] = useState('catch'); // 'catch','runner','beatmaker','snake','beattap','sequence'

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-20 overflow-hidden select-none">
        {/* Ambient Industrial Grid */}
        <div className="absolute inset-0 industrial-grid opacity-20 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-xs font-mono font-bold tracking-[0.3em] text-neon-purple uppercase bg-neon-purple/10 px-3 py-1 rounded-full border border-neon-purple/20" style={{ color: 'var(--color-neon)', borderColor: 'var(--color-neon-shadow-sm)', backgroundColor: 'var(--color-neon-shadow-sm)' }}>
              Zona Recreativa & Recompensas
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-wider uppercase">
              DOPAMINA ARCADE
            </h1>
            <div className="w-16 h-[2px] bg-neon-purple mx-auto mt-4" style={{ backgroundColor: 'var(--color-neon)' }} />
            <p className="text-xs text-gray-400 mt-3 max-w-md mx-auto">
              Juega, suma puntos y gana premios reales. ¡El nivel más alto te da una <span className="text-green-400 font-bold">boleta gratis</span>!
            </p>
          </div>

          {/* Reward Tiers Showcase */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              { tier: 1, label: '5% OFF', icon: '🎟️', color: '#60A5FA', desc: 'Primer descuento' },
              { tier: 2, label: '10% OFF', icon: '🎫', color: '#b14eff', desc: 'Descuento medio' },
              { tier: 3, label: '20% OFF', icon: '💎', color: '#FF6B00', desc: 'Gran descuento' },
              { tier: 4, label: 'BOLETA GRATIS', icon: '🏆', color: '#4ADE80', desc: '1 por cuenta', highlight: true },
            ].map(({ tier, label, icon, color, desc, highlight }) => (
              <div
                key={tier}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all ${
                  highlight
                    ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.15)]'
                    : 'bg-industrial-950/60 border-industrial-800/80'
                }`}
              >
                <span className="text-lg">{icon}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                  <span className="text-[9px] text-gray-500 font-mono">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center mb-8 gap-3">
            {[
              { key: 'catch',    label: '🕹️ Dopamine Catch' },
              { key: 'runner',   label: '🏃 Rave Runner' },
              { key: 'snake',    label: '🐍 Neon Snake' },
              { key: 'beattap',  label: '🎯 Beat Tap' },
              { key: 'sequence', label: '🧠 Sequence Sync' },
              { key: 'beatmaker',label: '🎛️ Techno Beatmaker' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 font-mono font-bold uppercase tracking-wider text-xs border rounded transition-all duration-300 cursor-pointer ${
                  activeTab === key
                    ? 'text-white'
                    : 'bg-industrial-950/40 text-gray-400 border-industrial-800 hover:text-white hover:border-neon-purple/50'
                }`}
                style={{
                  backgroundColor: activeTab === key ? 'var(--color-neon)' : '',
                  borderColor: activeTab === key ? 'var(--color-neon)' : '',
                  boxShadow: activeTab === key ? '0 0 10px var(--color-neon-shadow-md)' : ''
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 sm:p-8 relative">
            {activeTab === 'catch'    && <DopamineCatchGame />}
            {activeTab === 'runner'   && <RaveRunnerGame />}
            {activeTab === 'beatmaker'&& <TechnoBeatmaker />}
            {activeTab === 'snake'    && <NeonSnakeGame />}
            {activeTab === 'beattap'  && <BeatTapGame />}
            {activeTab === 'sequence' && <SequenceSyncGame />}
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
  const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'lost'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // References for keeping track of fast mutations in game loop
  const stateRef = useRef({
    score: 0,
    lives: 3,
    gameState: 'idle',
    soundEnabled: true,
    playerX: 0,
    playerWidth: 65,
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

    // Difficulty scaling — ramps up slowly
    stateRef.current.speedMultiplier = 1.0 + (stateRef.current.score / 250);

    // Spawn falling objects — slower spawn rate
    stateRef.current.spawnTimer++;
    const spawnRate = Math.max(35, 70 - Math.floor(stateRef.current.score / 15));
    if (stateRef.current.spawnTimer >= spawnRate) {
      stateRef.current.spawnTimer = 0;

      // Types of items:
      // 'dopamine' (purple orb), 'ticket' (golden ticket), 'vinyl' (cyan vinyl), 'distort' (red cross)
      const rand = Math.random();
      let type = 'dopamine';
      let color = '#FF2A85'; // Dopamine pink/purple
      let scoreVal = 10;
      let size = 10;

      if (rand < 0.15) {
        type = 'ticket';
        color = '#FFC800'; // Gold ticket
        scoreVal = 25;
        size = 11;
      } else if (rand < 0.38) {
        type = 'vinyl';
        color = '#00D8FF'; // Cyan vinyl
        scoreVal = 15;
        size = 10;
      } else if (rand < 0.62) {
        type = 'distort';
        color = '#FF3E3E'; // Red damage
        scoreVal = -25;
        size = 11;
      }

      stateRef.current.fallingObjects.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20,
        vy: (Math.random() * 1.5 + 2) * stateRef.current.speedMultiplier,
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

    // Game ends only when lives run out — the final score decides the reward tier.
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

  return (
    <div className="flex flex-col items-center">
      {/* Game controls and score header */}
      <div className="w-full flex flex-wrap justify-between items-center bg-black/40 border border-industrial-800/80 rounded-lg p-4 mb-6 gap-4">
        
        {/* Score & Lives */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-500 uppercase">PUNTOS</span>
            <span className="text-xl font-black text-neon-glow font-mono" style={{ textShadow: '0 0 6px var(--color-neon)' }}>
              {score} <span className="text-xs text-gray-500">pts</span>
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
            <p className="text-xs text-gray-400 max-w-sm mb-3 leading-relaxed">
              Atrapa las moléculas de dopamina, vinilos y boletas VIP. Evita a toda costa las malas vibras (rojas) que dañan tu sistema de audio.
            </p>
            <TierInfo juego="catch" />
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
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col justify-center items-center text-center p-6 z-10 animate-fadeIn overflow-y-auto">
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-1">Se apagó la pista</h3>
            <p className="text-[11px] font-mono text-gray-400 mb-4">
              Puntaje final: <span className="text-neon-glow font-bold" style={{ color: 'var(--color-neon)' }}>{score}</span> pts
            </p>

            <ArcadeReward juego="catch" puntaje={score} />

            <button
              onClick={startGame}
              className="mt-5 px-6 py-2.5 font-mono font-bold uppercase tracking-wider text-xs border border-red-500 bg-red-950/20 text-red-400 rounded cursor-pointer hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> REINTENTAR
            </button>
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

/* ─────────────────────────────────────────────────────────────────────────────
   GAME 3: RAVE RUNNER (MOBILE ENDLESS RUNNER)
   ───────────────────────────────────────────────────────────────────────────── */
function RaveRunnerGame() {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'lost'
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef({
    score: 0,
    gameState: 'idle',
    soundEnabled: true,
    playerY: 0,
    playerVy: 0,
    playerSize: 15,
    gravity: 0.5,
    jumpForce: -9.5,
    isJumping: false,
    groundY: 0,
    obstacles: [],
    spawnTimer: 0,
    speed: 4.0,
    rotation: 0,
    bgFlash: 0,
    animationId: null
  });

  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    stateRef.current.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  const playSound = (type) => {
    if (!stateRef.current.soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'jump') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'crash') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'win') {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
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

  const jump = () => {
    if (stateRef.current.gameState !== 'playing') return;
    if (!stateRef.current.isJumping) {
      stateRef.current.playerVy = stateRef.current.jumpForce;
      stateRef.current.isJumping = true;
      playSound('jump');
    }
  };

  // Keyboard jump handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startGame = () => {
    setScore(0);
    setGameState('playing');

    const canvas = canvasRef.current;
    if (!canvas) return;

    stateRef.current.score = 0;
    stateRef.current.groundY = canvas.height - 80;
    stateRef.current.playerY = stateRef.current.groundY - stateRef.current.playerSize;
    stateRef.current.playerVy = 0;
    stateRef.current.isJumping = false;
    stateRef.current.obstacles = [];
    stateRef.current.spawnTimer = 0;
    stateRef.current.speed = 4.0;
    stateRef.current.rotation = 0;
    stateRef.current.bgFlash = 0;

    if (stateRef.current.animationId) {
      cancelAnimationFrame(stateRef.current.animationId);
    }

    stateRef.current.animationId = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas || stateRef.current.gameState !== 'playing') return;

    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Clear background with ambient strobe flash
    ctx.fillStyle = state.bgFlash > 0 ? `rgba(177, 78, 255, ${state.bgFlash * 0.05})` : '#060609';
    if (state.bgFlash > 0) state.bgFlash -= 0.05;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fade ambient grids
    ctx.strokeStyle = 'rgba(177, 78, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Move player (rolling vinyl)
    state.playerVy += state.gravity;
    state.playerY += state.playerVy;

    // Constrain to ground
    const onGroundY = state.groundY - state.playerSize;
    if (state.playerY >= onGroundY) {
      state.playerY = onGroundY;
      state.playerVy = 0;
      state.isJumping = false;
    }

    // Rotation angle
    state.rotation += 0.06 * (state.speed / 4.0);

    // Draw Ground (Equalizer glowing baseline)
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'var(--color-neon)';
    ctx.strokeStyle = 'var(--color-neon)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, state.groundY);
    ctx.lineTo(canvas.width, state.groundY);
    ctx.stroke();

    // Ambient equalizer waves below ground
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(177, 78, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 10) {
      const h = Math.sin(x * 0.05 + state.rotation) * 15;
      if (x === 0) ctx.moveTo(x, state.groundY + 10 + h);
      else ctx.lineTo(x, state.groundY + 10 + h);
    }
    ctx.stroke();

    // Draw Player (Rotating Glowing Vinyl disc)
    const px = 100;
    const py = state.playerY;
    const size = state.playerSize;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(state.rotation);
    
    // Vinyl body
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'var(--color-neon)';
    ctx.fillStyle = '#111116';
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'var(--color-neon)';
    ctx.stroke();

    // Grooves inside vinyl
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(177, 78, 255, 0.25)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Center sticker
    ctx.fillStyle = '#00D8FF'; // Cyan center sticker
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Sticker label marker
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, -size * 0.3, 2, size * 0.6);

    // Spindle hole
    ctx.fillStyle = '#060609';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Difficulty increases speed — slower ramp
    state.speed = 4.0 + (state.score / 350);

    // Distance/Score tick
    state.score += 0.12;
    const currentIntScore = Math.floor(state.score);
    setScore(currentIntScore);

    // Spawn obstacles — more frequent, more doubles
    state.spawnTimer++;
    const randomSpawnRate = 65 + Math.random() * 50 - (state.speed * 2.5);
    if (state.spawnTimer >= randomSpawnRate) {
      state.spawnTimer = 0;

      const isDouble = Math.random() < 0.35 && state.score > 20;
      const isTriple = Math.random() < 0.12 && state.score > 60;
      const w = 22;
      const h = isTriple ? 60 : isDouble ? 40 : 22;

      state.obstacles.push({
        x: canvas.width,
        y: state.groundY - h,
        width: w,
        height: h,
        color: isTriple ? '#FF3E3E' : isDouble ? '#FF3E3E' : '#FF6B00',
        isDouble: isDouble || isTriple,
        isTriple
      });
    }

    // Update and draw obstacles
    const obsList = state.obstacles;
    for (let i = obsList.length - 1; i >= 0; i--) {
      const obs = obsList[i];
      obs.x -= state.speed;

      // Draw obstacle (Speaker)
      ctx.shadowBlur = 10;
      ctx.shadowColor = obs.color;
      ctx.fillStyle = '#101016';
      ctx.strokeStyle = obs.color;
      ctx.lineWidth = 2;

      // Outer speaker cabinet
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 3);
      ctx.fill();
      ctx.stroke();

      // Speaker cones inside
      ctx.shadowBlur = 0;
      ctx.fillStyle = obs.color;
      if (obs.isTriple) {
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height * 0.2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height * 0.5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height * 0.8, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.isDouble) {
        // Double stack - draw two circles
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height * 0.28, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height * 0.72, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Single speaker
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Check collision
      const padX = 4;
      const padY = 2;
      const collided = (
        px + size - padX >= obs.x &&
        px - size + padX <= obs.x + obs.width &&
        py + size - padY >= obs.y &&
        py - size + padY <= obs.y + obs.height
      );

      if (collided) {
        setGameState('lost');
        playSound('crash');
        cancelAnimationFrame(state.animationId);
        return;
      }

      // Evaporate out of screen
      if (obs.x + obs.width < 0) {
        obsList.splice(i, 1);
        // Small flash when clearing obstacle
        state.bgFlash = 0.5;
      }
    }

    state.animationId = requestAnimationFrame(gameLoop);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Game controls and score header */}
      <div className="w-full flex flex-wrap justify-between items-center bg-black/40 border border-industrial-800/80 rounded-lg p-4 mb-6 gap-4">
        
        {/* Score & Goal */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-500 uppercase">DISTANCIA</span>
            <span className="text-xl font-black text-neon-glow font-mono" style={{ textShadow: '0 0 6px var(--color-neon)' }}>
              {score}m <span className="text-xs text-gray-500">/ 100m</span>
            </span>
          </div>
        </div>

        {/* Instructions Quick Box */}
        <div className="hidden md:flex items-center gap-3 text-xs text-gray-400 bg-industrial-950/50 px-4 py-2 border border-industrial-800/40 rounded font-mono">
          <Info className="w-4 h-4 text-neon-purple" style={{ color: 'var(--color-neon)' }} />
          <span>Controles: Pulsa <kbd className="bg-industrial-800 px-1.5 py-0.5 rounded text-white text-[10px]">Espacio</kbd> / <kbd className="bg-industrial-800 px-1.5 py-0.5 rounded text-white text-[10px]">↑</kbd> o toca la pantalla</span>
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
      <div 
        onClick={jump}
        onTouchStart={jump}
        className="relative border border-industrial-800/80 rounded-lg overflow-hidden w-full max-w-[800px] aspect-[4/3] sm:aspect-[16/10] bg-[#060609] cursor-pointer"
      >
        
        {/* Canvas Element */}
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500} 
          className="w-full h-full block" 
        />

        {/* Overlay States */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col justify-center items-center text-center p-6 z-10 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <span className="text-4xl mb-4 animate-bounce">🏃</span>
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Rave Runner</h3>
            <p className="text-xs text-gray-400 max-w-sm mb-3 leading-relaxed">
              Salta sobre los altavoces de la bodega. Toca cualquier parte del Canvas (o presiona la tecla de Espacio) para saltar.
            </p>
            <TierInfo juego="runner" />
            <button
              onClick={startGame}
              className="px-8 py-3 font-mono font-black uppercase tracking-widest text-xs bg-neon-purple text-white border border-neon-purple rounded cursor-pointer shadow-neon-md transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-neon)', borderColor: 'var(--color-neon)', boxShadow: '0 0 15px var(--color-neon-shadow-lg)' }}
            >
              EMPEZAR CARRERA
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col justify-center items-center text-center p-6 z-10 animate-fadeIn overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <span className="text-4xl mb-2">💥</span>
            <h3 className="text-xl font-black text-red-500 uppercase tracking-wider mb-1">¡Chocaste con el Bafle!</h3>
            <p className="text-[11px] font-mono text-gray-400 mb-4">
              Distancia: <span className="font-bold" style={{ color: 'var(--color-neon)' }}>{score}</span>m
            </p>

            <ArcadeReward juego="runner" puntaje={score} />

            <button
              onClick={startGame}
              className="mt-5 px-6 py-2.5 font-mono font-bold uppercase tracking-wider text-xs border border-red-500 bg-red-950/20 text-red-400 rounded cursor-pointer hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> VOLVER A CORRER
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-[10px] text-gray-500 font-mono flex items-center gap-1">
        <span>Toca cualquier parte de la pantalla negra para saltar los bafles</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GAME 4: NEON SNAKE (CANVAS SNAKE + D-PAD MÓVIL)
   ───────────────────────────────────────────────────────────────────────────── */
function NeonSnakeGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState('idle');
  const audioCtxRef = useRef(null);
  const stateRef = useRef({
    snake: [],
    food: { x: 0, y: 0 },
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    score: 0,
    gameState: 'idle',
    cellSize: 22,
    cols: 16,
    rows: 16,
    tickInterval: null,
    foodHue: 0,
  });

  const playTone = (freq, type = 'sine', dur = 0.08) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch (e) { /* silent */ }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    const { cellSize, cols, rows } = s;
    ctx.fillStyle = '#07070d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(180,80,255,0.07)';
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
      ctx.beginPath();
      ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    s.foodHue = (s.foodHue + 2) % 360;
    ctx.shadowBlur = 18;
    ctx.shadowColor = `hsl(${s.foodHue},100%,65%)`;
    ctx.fillStyle = `hsl(${s.foodHue},100%,65%)`;
    ctx.beginPath();
    ctx.arc(s.food.x * cellSize + cellSize / 2, s.food.y * cellSize + cellSize / 2, cellSize / 2.4, 0, Math.PI * 2);
    ctx.fill();
    s.snake.forEach((seg, i) => {
      const ratio = i / s.snake.length;
      ctx.shadowBlur = i === 0 ? 14 : 6;
      ctx.shadowColor = 'rgba(177,78,255,0.8)';
      ctx.fillStyle = i === 0 ? 'hsl(270,85%,75%)' : `hsl(270,70%,${55 + 15 * ratio}%)`;
      const pad = i === 0 ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(seg.x * cellSize + pad, seg.y * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2, 3);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  };

  const spawnFood = () => {
    const s = stateRef.current;
    let pos;
    do { pos = { x: Math.floor(Math.random() * s.cols), y: Math.floor(Math.random() * s.rows) }; }
    while (s.snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    s.food = pos;
  };

  const tick = () => {
    const s = stateRef.current;
    if (s.gameState !== 'playing') return;
    s.dir = s.nextDir;
    const head = s.snake[0];
    const newHead = { x: (head.x + s.dir.x + s.cols) % s.cols, y: (head.y + s.dir.y + s.rows) % s.rows };
    if (s.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      s.gameState = 'lost'; setGameState('lost'); clearInterval(s.tickInterval);
      playTone(80, 'sawtooth', 0.4); return;
    }
    s.snake.unshift(newHead);
    if (newHead.x === s.food.x && newHead.y === s.food.y) {
      s.score += 10; setScore(s.score); setHighScore(prev => Math.max(prev, s.score));
      spawnFood(); playTone(600 + s.score * 3, 'sine', 0.1);
      if (s.score % 50 === 0 && s.score > 0) {
        clearInterval(s.tickInterval);
        s.tickInterval = setInterval(tick, Math.max(80, 180 - s.score * 0.5));
      }
    } else { s.snake.pop(); }
    drawCanvas();
  };

  const startGame = () => {
    const s = stateRef.current;
    clearInterval(s.tickInterval);
    s.snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }];
    s.dir = { x: 1, y: 0 }; s.nextDir = { x: 1, y: 0 }; s.score = 0; s.gameState = 'playing';
    setScore(0); setGameState('playing'); spawnFood(); drawCanvas();
    s.tickInterval = setInterval(tick, 180);
  };

  const changeDir = (dx, dy) => {
    const s = stateRef.current;
    if (s.gameState !== 'playing') return;
    if (dx !== 0 && s.dir.x !== 0) return;
    if (dy !== 0 && s.dir.y !== 0) return;
    s.nextDir = { x: dx, y: dy };
  };

  useEffect(() => {
    const onKey = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowUp'    || e.key === 'w') changeDir(0, -1);
      if (e.key === 'ArrowDown'  || e.key === 's') changeDir(0,  1);
      if (e.key === 'ArrowLeft'  || e.key === 'a') changeDir(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') changeDir( 1, 0);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearInterval(stateRef.current.tickInterval); };
  }, []);

  const touchStart = useRef(null);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full flex justify-between items-center bg-black/40 border border-industrial-800 rounded-lg px-5 py-3">
        <div><div className="text-[10px] font-mono text-gray-500 uppercase">Puntaje</div><div className="text-2xl font-black text-white font-mono">{score}</div></div>
        <div><div className="text-[10px] font-mono text-gray-500 uppercase">Récord</div><div className="text-2xl font-black font-mono" style={{ color: 'var(--color-neon)' }}>{highScore}</div></div>
        <button onClick={startGame} className="px-5 py-2 font-mono font-bold uppercase text-xs border rounded cursor-pointer flex items-center gap-1.5 text-black" style={{ backgroundColor: 'var(--color-neon)', borderColor: 'var(--color-neon)' }}>
          <Play className="w-3.5 h-3.5 fill-current" /> {gameState === 'idle' ? 'Jugar' : 'Reiniciar'}
        </button>
      </div>

      <div
        className="relative w-full max-w-[420px]"
        onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => {
          if (!touchStart.current) return;
          const dx = e.changedTouches[0].clientX - touchStart.current.x;
          const dy = e.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(dx) > Math.abs(dy)) { dx > 20 ? changeDir(1, 0) : changeDir(-1, 0); }
          else { dy > 20 ? changeDir(0, 1) : changeDir(0, -1); }
          touchStart.current = null;
        }}
      >
        <canvas ref={canvasRef} width={352} height={352} className="w-full border border-industrial-800 rounded-lg" style={{ imageRendering: 'pixelated', maxWidth: '352px' }} />
        {(gameState === 'idle' || gameState === 'lost') && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg gap-3 overflow-y-auto">
            <span className="text-4xl">{gameState === 'lost' ? '💀' : '🐍'}</span>
            <h3 className="text-lg font-black text-white uppercase tracking-widest">{gameState === 'lost' ? '¡Chocaste!' : 'Neon Snake'}</h3>
            {gameState === 'idle' && <p className="text-xs text-gray-400 text-center max-w-[220px]">Desliza en pantalla o usa WASD/flechas. ¡Come los orbes sin chocar contra ti mismo!</p>}
            {gameState === 'idle' && <TierInfo juego="snake" />}
            {gameState === 'lost' && (
              <>
                <p className="text-[11px] font-mono text-gray-400">Puntaje: <span className="text-white font-bold">{score}</span></p>
                <ArcadeReward juego="snake" puntaje={score} />
              </>
            )}
            <button onClick={startGame} className="mt-2 px-6 py-2 font-mono font-bold uppercase text-xs text-black rounded cursor-pointer" style={{ backgroundColor: 'var(--color-neon)' }}>
              {gameState === 'lost' ? 'Volver a Jugar' : 'Empezar'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 w-36 mt-1">
        <div />
        <button onPointerDown={() => changeDir(0, -1)} className="h-12 bg-industrial-900 border border-industrial-700 rounded-lg text-white text-xl flex items-center justify-center cursor-pointer select-none active:opacity-60">↑</button>
        <div />
        <button onPointerDown={() => changeDir(-1, 0)} className="h-12 bg-industrial-900 border border-industrial-700 rounded-lg text-white text-xl flex items-center justify-center cursor-pointer select-none active:opacity-60">←</button>
        <button onPointerDown={() => changeDir(0, 1)}  className="h-12 bg-industrial-900 border border-industrial-700 rounded-lg text-white text-xl flex items-center justify-center cursor-pointer select-none active:opacity-60">↓</button>
        <button onPointerDown={() => changeDir(1, 0)}  className="h-12 bg-industrial-900 border border-industrial-700 rounded-lg text-white text-xl flex items-center justify-center cursor-pointer select-none active:opacity-60">→</button>
      </div>
      <p className="text-[10px] text-gray-600 font-mono">Teclado: WASD / Flechas &bull; Táctil: Desliza o D-Pad</p>
    </div>
  );
}



/* ─────────────────────────────────────────────────────────────────────────────
   GAME 5: BEAT TAP – CÍRCULOS RÍTMICOS (MOBILE-FIRST)
   ───────────────────────────────────────────────────────────────────────────── */
function BeatTapGame() {
  const [circles, setCircles] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [missed, setMissed] = useState(0);
  const [gameState, setGameState] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(30);
  const [lastFeedback, setLastFeedback] = useState(null);
  const audioCtxRef = useRef(null);
  const idRef = useRef(0);
  const timersRef = useRef([]);
  const refs = useRef({ score: 0, combo: 0, missed: 0, maxCombo: 0, tLeft: 30 });

  const COLORS = [
    { bg: '#b14eff', shadow: 'rgba(177,78,255,0.6)' },
    { bg: '#00D8FF', shadow: 'rgba(0,216,255,0.5)'  },
    { bg: '#FF6B00', shadow: 'rgba(255,107,0,0.5)'  },
    { bg: '#FF3E8A', shadow: 'rgba(255,62,138,0.5)' },
    { bg: '#A0FF50', shadow: 'rgba(160,255,80,0.5)' },
  ];

  const playTone = (freq) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* silent */ }
  };

  const stopAll = () => { timersRef.current.forEach(id => { try { clearInterval(id); clearTimeout(id); } catch(e){} }); timersRef.current = []; };

  const startGame = () => {
    stopAll();
    const r = refs.current;
    r.score = 0; r.combo = 0; r.missed = 0; r.maxCombo = 0; r.tLeft = 40; idRef.current = 0;
    setScore(0); setCombo(0); setMissed(0); setMaxCombo(0); setTimeLeft(40); setCircles([]); setGameState('playing');

    let t = 40;
    const timer = setInterval(() => {
      t--; r.tLeft = t; setTimeLeft(t);
      if (t <= 0) { clearInterval(timer); stopAll(); setGameState('done'); }
    }, 1000);
    timersRef.current.push(timer);

    const scheduleSpawn = () => {
      if (r.tLeft <= 0) return;
      const id = idRef.current++;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = 40 + Math.random() * 25;
      const duration = 1200 + Math.random() * 600;
      setCircles(prev => [...prev, { id, x: 8 + Math.random() * 84, y: 10 + Math.random() * 80, size, color, born: Date.now(), duration }]);
      const remove = setTimeout(() => {
        setCircles(prev => {
          const still = prev.find(c => c.id === id);
          if (still) { r.combo = 0; r.missed++; setCombo(0); setMissed(r.missed); playTone(120); }
          return prev.filter(c => c.id !== id);
        });
      }, duration);
      timersRef.current.push(remove);
      const next = setTimeout(scheduleSpawn, 700 + Math.random() * 500);
      timersRef.current.push(next);
    };
    const first = setTimeout(scheduleSpawn, 300);
    timersRef.current.push(first);
  };

  const tapCircle = (id, born, duration) => {
    const ratio = Math.min(1, (Date.now() - born) / duration);
    const quality = ratio < 0.30 ? 'perfect' : ratio < 0.60 ? 'good' : 'ok';
    const pts = quality === 'perfect' ? 30 : quality === 'good' ? 20 : 10;
    refs.current.combo++;
    const earned = pts * Math.min(refs.current.combo, 5);
    refs.current.score += earned;
    refs.current.maxCombo = Math.max(refs.current.maxCombo, refs.current.combo);
    setScore(refs.current.score); setCombo(refs.current.combo); setMaxCombo(refs.current.maxCombo);
    playTone(quality === 'perfect' ? 880 : quality === 'good' ? 660 : 440);
    setLastFeedback({ quality, earned, ts: Date.now() });
    setTimeout(() => setLastFeedback(null), 600);
    setCircles(prev => prev.filter(c => c.id !== id));
  };

  useEffect(() => () => stopAll(), []);

  const QLABELS = { perfect: '✦ PERFECT', good: '✓ GOOD', ok: 'OK' };
  const QCOLORS = { perfect: '#FFD700', good: '#4ADE80', ok: '#60A5FA' };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full flex justify-between items-center bg-black/40 border border-industrial-800 rounded-lg px-5 py-3 flex-wrap gap-3">
        <div><div className="text-[10px] font-mono text-gray-500">PUNTOS</div><div className="text-2xl font-black text-white font-mono">{score}</div></div>
        <div><div className="text-[10px] font-mono text-gray-500">COMBO</div><div className="text-2xl font-black font-mono" style={{ color: combo > 3 ? '#b14eff' : '#fff' }}>x{combo}</div></div>
        <div><div className="text-[10px] font-mono text-gray-500">TIEMPO</div><div className={`text-2xl font-black font-mono ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</div></div>
        <div><div className="text-[10px] font-mono text-gray-500">PERDIDOS</div><div className="text-2xl font-black text-red-400 font-mono">{missed}</div></div>
      </div>

      <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-lg overflow-hidden border border-industrial-800/80 bg-[#07070d]" style={{ touchAction: 'none' }}>
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(180,60,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {lastFeedback && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-sm font-black font-mono uppercase tracking-wider pointer-events-none z-20" style={{ color: QCOLORS[lastFeedback.quality] }}>
            {QLABELS[lastFeedback.quality]} <span className="text-white">+{lastFeedback.earned}</span>
          </div>
        )}

        {circles.map((c) => {
          const progress = Math.min(1, (Date.now() - c.born) / c.duration);
          return (
            <button
              key={c.id}
              onPointerDown={() => tapCircle(c.id, c.born, c.duration)}
              className="absolute rounded-full cursor-pointer flex items-center justify-center font-black text-black select-none"
              style={{
                left: `${c.x}%`, top: `${c.y}%`,
                width: c.size, height: c.size,
                transform: 'translate(-50%,-50%)',
                background: c.color.bg,
                boxShadow: `0 0 20px ${c.color.shadow},0 0 40px ${c.color.shadow}`,
                outline: `3px solid rgba(255,255,255,${0.6 - progress * 0.5})`,
                outlineOffset: `${Math.max(0, 6 - progress * 5)}px`,
                opacity: progress > 0.85 ? Math.max(0, 1 - (progress - 0.85) * 6) : 1,
                fontSize: c.size * 0.32,
              }}
            >✦</button>
          );
        })}

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4 text-center p-6">
            <span className="text-5xl">🎯</span>
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Beat Tap</h3>
            <p className="text-xs text-gray-400 max-w-xs">Toca los círculos antes de que se esfumen. ¡Los combos multiplican tus puntos hasta x5!</p>
            <TierInfo juego="beattap" />
            <button onClick={startGame} className="px-8 py-3 font-mono font-black uppercase text-xs text-black rounded cursor-pointer" style={{ backgroundColor: '#b14eff' }}>¡Empezar!</button>
          </div>
        )}
        {gameState === 'done' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center p-6 overflow-y-auto">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <h3 className="text-xl font-black text-white uppercase">¡Tiempo!</h3>
            <div className="grid grid-cols-3 gap-6 my-2">
              <div><div className="text-2xl font-black text-white">{score}</div><div className="text-[10px] text-gray-500 uppercase font-mono">Pts</div></div>
              <div><div className="text-2xl font-black" style={{ color: '#b14eff' }}>x{maxCombo}</div><div className="text-[10px] text-gray-500 uppercase font-mono">Max Combo</div></div>
              <div><div className="text-2xl font-black text-red-400">{missed}</div><div className="text-[10px] text-gray-500 uppercase font-mono">Perdidos</div></div>
            </div>
            <ArcadeReward juego="beattap" puntaje={score} />
            <button onClick={startGame} className="mt-2 px-6 py-2.5 font-mono font-bold uppercase text-xs text-black rounded cursor-pointer" style={{ backgroundColor: '#b14eff' }}>Jugar de Nuevo</button>
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-600 font-mono">Toca los círculos antes de que desaparezcan. ¡Combos x5!</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GAME 6: SEQUENCE SYNC – SIMON SAYS (MEMORIA DE COLORES)

   ───────────────────────────────────────────────────────────────────────────── */
function SequenceSyncGame() {
  const PADS = [
    { id: 0, label: 'KICK',   color: '#FF3E3E', glow: 'rgba(255,62,62,0.7)'   },
    { id: 1, label: 'SNARE',  color: '#FF9F1C', glow: 'rgba(255,159,28,0.7)'  },
    { id: 2, label: 'HI-HAT', color: '#b14eff', glow: 'rgba(177,78,255,0.7)'  },
    { id: 3, label: 'BASS',   color: '#00D8FF', glow: 'rgba(0,216,255,0.7)'   },
  ];
  const FREQS = [130, 196, 330, 523];

  const [sequence, setSequence] = useState([]);
  const [playerSeq, setPlayerSeq] = useState([]);
  const [activePad, setActivePad] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const audioCtxRef = useRef(null);

  const playPad = (padId) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = padId < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(FREQS[padId], ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* silent */ }
  };

  const flash = (padId, ms = 400) => { setActivePad(padId); playPad(padId); setTimeout(() => setActivePad(null), ms); };

  const showSequence = (seq) => {
    setPhase('showing');
    seq.forEach((padId, i) => setTimeout(() => flash(padId, 380), 600 + i * 700));
    setTimeout(() => setPhase('player'), 600 + seq.length * 700 + 200);
  };

  const startGame = () => {
    const seq = [Math.floor(Math.random() * 4)];
    setSequence(seq); setPlayerSeq([]); setRound(1); setScore(0);
    showSequence(seq);
  };

  const handlePadPress = (padId) => {
    if (phase !== 'player') return;
    flash(padId, 300);
    const newSeq = [...playerSeq, padId];
    const idx = newSeq.length - 1;
    if (newSeq[idx] !== sequence[idx]) {
      setPhase('fail');
      setHighScore(prev => Math.max(prev, score));
      return;
    }
    if (newSeq.length === sequence.length) {
      const newScore = score + round * 10;
      setScore(newScore);
      setPlayerSeq([]);
      if (sequence.length >= 12) { setPhase('win'); setHighScore(prev => Math.max(prev, newScore)); return; }
      setTimeout(() => {
        const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(nextSeq); setRound(r => r + 1); showSequence(nextSeq);
      }, 800);
    } else { setPlayerSeq(newSeq); }
  };

  return (
    <div className="flex flex-col items-center gap-5 max-w-sm mx-auto">
      <div className="w-full flex justify-between items-center bg-black/40 border border-industrial-800 rounded-lg px-5 py-3">
        <div><div className="text-[10px] font-mono text-gray-500 uppercase">Ronda</div><div className="text-2xl font-black text-white">{round}</div></div>
        <div><div className="text-[10px] font-mono text-gray-500 uppercase">Puntos</div><div className="text-2xl font-black text-white">{score}</div></div>
        <div><div className="text-[10px] font-mono text-gray-500 uppercase">Récord</div><div className="text-2xl font-black font-mono" style={{ color: '#b14eff' }}>{highScore}</div></div>
      </div>

      <div className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 min-h-[20px] text-center">
        {phase === 'idle' && 'Presiona INICIAR para comenzar'}
        {phase === 'showing' && <span style={{ color: '#b14eff' }}>▶ Observa la secuencia...</span>}
        {phase === 'player' && <span className="text-green-400 animate-pulse">★ TU TURNO – Repite la secuencia</span>}
        {phase === 'fail' && <span className="text-red-400">✕ ¡Error! Intenta de nuevo</span>}
        {phase === 'win' && <span className="text-yellow-400">🏆 ¡Maestro del Ritmo! (12/12)</span>}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {PADS.map((pad) => (
          <button
            key={pad.id}
            onPointerDown={() => handlePadPress(pad.id)}
            disabled={phase !== 'player'}
            className="h-28 sm:h-36 rounded-xl font-black text-sm uppercase tracking-wider font-mono select-none cursor-pointer disabled:cursor-default transition-all duration-100"
            style={{
              backgroundColor: activePad === pad.id ? pad.color : '#111118',
              color: activePad === pad.id ? '#000' : pad.color,
              border: `2px solid ${pad.color}`,
              boxShadow: activePad === pad.id ? `0 0 30px ${pad.glow}, inset 0 0 20px ${pad.glow}` : `0 0 6px ${pad.glow}40`,
              transform: activePad === pad.id ? 'scale(0.95)' : 'scale(1)',
            }}
          >{pad.label}</button>
        ))}
      </div>

      {sequence.length > 0 && (
        <div className="flex gap-1.5 flex-wrap justify-center">
          {sequence.map((padId, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full border transition-all" style={{ backgroundColor: i < playerSeq.length ? PADS[padId].color : 'transparent', borderColor: PADS[padId].color, opacity: i < playerSeq.length ? 1 : 0.3 }} />
          ))}
        </div>
      )}

      {(phase === 'fail' || phase === 'win') && (
        <ArcadeReward juego="sequence" puntaje={score} />
      )}

      <div className="flex gap-4">
        {(phase === 'idle' || phase === 'fail' || phase === 'win') && (
          <button onClick={startGame} className="px-8 py-3 font-mono font-black uppercase tracking-widest text-xs text-black rounded cursor-pointer" style={{ backgroundColor: '#b14eff' }}>
            {phase === 'idle' ? 'INICIAR' : phase === 'win' ? 'OTRA RONDA' : 'INTENTAR DE NUEVO'}
          </button>
        )}
        {phase === 'showing' && <div className="px-8 py-3 font-mono text-xs text-gray-500 border border-industrial-800 rounded animate-pulse">Memorizando...</div>}
      </div>
      <p className="text-[10px] text-gray-600 font-mono text-center">Memoriza y repite la secuencia. ¡Ronda 12 = Victoria!</p>
      {phase === 'idle' && <TierInfo juego="sequence" />}
    </div>
  );
}
