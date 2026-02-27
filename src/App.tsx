import { useEffect, useRef, useState } from 'react';
import { Engine } from './game/Engine';
import { GameState, SaveData } from './game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, LEVEL_THEMES, GAME_CORES, GameCore } from './game/constants';
import { UpgradeSystem } from './game/UpgradeSystem';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sword, Zap, Shield, Coins, Play, RotateCcw, ShoppingCart, Ghost, Target, Crosshair } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.START_MENU);
  const [saveData, setSaveData] = useState<SaveData>(UpgradeSystem.load());
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);
  const [gold, setGold] = useState(0);
  const [souls, setSouls] = useState(0);
  const [killCount, setKillCount] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXp, setPlayerXp] = useState(0);
  const [playerXpToNext, setPlayerXpToNext] = useState(10);
  const [levelUpOptions, setLevelUpOptions] = useState<GameCore[]>([]);
  const [activeCores, setActiveCores] = useState<Record<string, number>>({});
  const [skillCooldown, setSkillCooldown] = useState(0);
  const [dashCooldown, setDashCooldown] = useState(0);
  const [isOutsideZone, setIsOutsideZone] = useState(false);
  const [zoneRadius, setZoneRadius] = useState(1000);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new Engine(canvasRef.current, (state) => {
        setGameState(state);
        if (state === GameState.UPGRADE_MENU || state === GameState.GAME_OVER) {
          setSaveData(UpgradeSystem.load());
        }
      });
    }

    const updateUI = () => {
      if (engineRef.current) {
        setPlayerHp(engineRef.current.player.hp);
        setPlayerMaxHp(engineRef.current.player.maxHp);
        setGold(engineRef.current.player.gold);
        setSouls(engineRef.current.player.souls);
        setKillCount(engineRef.current.player.killCount);
        setPlayerLevel(engineRef.current.player.level);
        setPlayerXp(engineRef.current.player.xp);
        setPlayerXpToNext(engineRef.current.player.xpToNextLevel);
        setLevelUpOptions(engineRef.current.levelUpOptions);
        setActiveCores({ ...engineRef.current.player.cores });
        setSkillCooldown(engineRef.current.player.skillCooldown / engineRef.current.player.maxSkillCooldown);
        setDashCooldown(engineRef.current.player.dashCooldown / engineRef.current.player.maxDashCooldown);
        setZoneRadius(engineRef.current.zoneRadius);
        
        const dx = engineRef.current.player.x - engineRef.current.zoneCenter.x;
        const dy = engineRef.current.player.y - engineRef.current.zoneCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        setIsOutsideZone(dist > engineRef.current.zoneRadius);

        if (engineRef.current.boss) {
          setBossHp(engineRef.current.boss.hp);
          setBossMaxHp(engineRef.current.boss.maxHp);
        } else {
          setBossHp(0);
        }
      }
      requestAnimationFrame(updateUI);
    };

    const animId = requestAnimationFrame(updateUI);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleStart = () => {
    if (engineRef.current) {
      engineRef.current.start();
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.resetLevel();
      engineRef.current.start();
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.state = GameState.PLAYING;
      setGameState(GameState.PLAYING);
    }
  };

  const handleNextLevel = () => {
    if (engineRef.current) {
      if (engineRef.current.levelManager.isLevelComplete) {
        engineRef.current.resetLevel();
      }
      engineRef.current.state = GameState.START_MENU;
      setGameState(GameState.START_MENU);
    }
  };

  const selectCore = (coreId: string) => {
    if (engineRef.current) {
      engineRef.current.applyCore(coreId);
    }
  };

  const buyUpgrade = (type: keyof SaveData['upgrades']) => {
    const currentLevel = saveData.upgrades[type as keyof typeof saveData.upgrades] as number;
    const cost = UpgradeSystem.getUpgradeCost(currentLevel);
    
    if (saveData.souls >= cost) {
      const newSaveData = { ...saveData };
      newSaveData.souls -= cost;
      (newSaveData.upgrades[type as keyof typeof newSaveData.upgrades] as number)++;
      setSaveData(newSaveData);
      UpgradeSystem.save(newSaveData);
      
      if (engineRef.current) {
        engineRef.current.saveData = newSaveData;
        engineRef.current.player.applyUpgrades(newSaveData.upgrades);
        engineRef.current.player.souls = newSaveData.souls;
      }
    }
  };

  const changeSkin = (color: string) => {
    const cost = UpgradeSystem.getSkinCost();
    if (saveData.gold >= cost || saveData.upgrades.skin === color) {
      const newSaveData = { ...saveData };
      if (saveData.upgrades.skin !== color) {
        newSaveData.gold -= cost;
      }
      newSaveData.upgrades.skin = color;
      setSaveData(newSaveData);
      UpgradeSystem.save(newSaveData);
      
      if (engineRef.current) {
        engineRef.current.saveData = newSaveData;
        engineRef.current.player.applyUpgrades(newSaveData.upgrades);
        engineRef.current.player.gold = newSaveData.gold;
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === GameState.GAME_OVER && (e.key === 'Enter' || e.key === ' ')) {
        handleRestart();
      }
      if (gameState === GameState.START_MENU && (e.key === 'Enter' || e.key === ' ')) {
        handleStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, saveData]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-slate-800" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block"
        />

        {/* HUD */}
        {gameState === GameState.PLAYING && (
          <div className="absolute top-0 left-0 w-full p-6 pointer-events-none flex flex-col gap-4">
            <div className="flex justify-between items-start">
              {/* Player Stats */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2 px-4 rounded-2xl shadow-lg border-2 border-slate-100">
                  <Heart className="text-red-500 fill-red-500" size={24} />
                  <div className="w-48 h-4 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-red-500" 
                      initial={{ width: '100%' }}
                      animate={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* XP Bar */}
                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2 px-4 rounded-2xl shadow-lg border-2 border-slate-100">
                  <span className="font-black text-indigo-600 text-xs w-8">LV.{playerLevel}</span>
                  <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500" 
                      animate={{ width: `${(playerXp / playerXpToNext) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2 px-4 rounded-2xl shadow-lg border-2 border-slate-100 w-fit">
                    <Ghost className="text-violet-500" size={24} />
                    <span className="font-bold text-slate-700 text-xl">{Math.floor(souls)}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2 px-4 rounded-2xl shadow-lg border-2 border-slate-100 w-fit">
                    <Coins className="text-amber-500" size={24} />
                    <span className="font-bold text-slate-700 text-xl">{Math.floor(gold)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2 px-4 rounded-2xl shadow-lg border-2 border-slate-100 w-fit">
                  <Sword className="text-slate-700" size={24} />
                  <span className="font-bold text-slate-700 text-xl">{killCount} KILLS</span>
                </div>
              </div>

              {/* Active Cores */}
              <div className="flex flex-wrap gap-2 max-w-[200px]">
                {Object.entries(activeCores).map(([id, count]) => {
                  const core = GAME_CORES.find(c => c.id === id);
                  if (!core) return null;
                  return (
                    <div key={id} className="bg-white/90 backdrop-blur-sm p-1 px-2 rounded-xl shadow-md border border-slate-100 flex items-center gap-1">
                      <div className="text-indigo-500">
                        {core.icon === 'Sword' && <Sword size={14} />}
                        {core.icon === 'Heart' && <Heart size={14} />}
                        {core.icon === 'Zap' && <Zap size={14} />}
                        {core.icon === 'Shield' && <Shield size={14} />}
                        {core.icon === 'Target' && <Target size={14} />}
                        {core.icon === 'Crosshair' && <Crosshair size={14} />}
                      </div>
                      <span className="text-[10px] font-black text-slate-700">x{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Skills & Dash */}
              <div className="flex gap-3">
                {/* Skill Cooldown */}
                <div className="relative w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-slate-100 flex items-center justify-center">
                  <Zap className={skillCooldown > 0 ? "text-slate-300" : "text-amber-400 fill-amber-400"} size={32} />
                  {skillCooldown > 0 && (
                    <div 
                      className="absolute inset-0 bg-slate-900/40 rounded-2xl" 
                      style={{ height: `${skillCooldown * 100}%`, top: 'auto' }}
                    />
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white text-[10px] font-bold px-1.5 rounded-md">L</div>
                </div>

                {/* Dash Cooldown */}
                <div className="relative w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-slate-100 flex items-center justify-center">
                  <Zap className={dashCooldown > 0 ? "text-slate-300" : "text-blue-400 fill-blue-400"} size={32} />
                  {dashCooldown > 0 && (
                    <div 
                      className="absolute inset-0 bg-slate-900/40 rounded-2xl" 
                      style={{ height: `${dashCooldown * 100}%`, top: 'auto' }}
                    />
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white text-[10px] font-bold px-1.5 rounded-md">SPACE</div>
                </div>
              </div>
            </div>

            {/* Zone Warning */}
            <AnimatePresence>
              {isOutsideZone && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="self-center bg-red-600 text-white font-black px-6 py-2 rounded-full shadow-2xl border-4 border-white animate-pulse"
                >
                  OUTSIDE SAFE ZONE!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Zone Status */}
            <div className="self-center flex flex-col items-center gap-1">
              <div className="bg-slate-800/80 backdrop-blur-sm px-4 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-white font-bold text-xs uppercase tracking-widest">Zone: {Math.floor(zoneRadius)}m</span>
              </div>
            </div>

            {/* Boss Health Bar */}
            {bossHp > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="self-center w-2/3 flex flex-col items-center gap-1"
              >
                <span className="text-slate-800 font-black tracking-widest text-sm uppercase">BOSS</span>
                <div className="w-full h-6 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-xl">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600" 
                    animate={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Menus */}
        <AnimatePresence>
          {gameState === GameState.START_MENU && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-center flex-col items-center justify-center text-white p-12 text-center"
            >
              <div className="mb-8">
                <h2 className="text-amber-400 font-black tracking-widest text-sm uppercase mb-2">Level {saveData.level}</h2>
                <h1 className="text-5xl font-black mb-4 tracking-tighter">
                  {LEVEL_THEMES[(saveData.level - 1) % LEVEL_THEMES.length].name}
                </h1>
                <p className="text-lg opacity-80 max-w-md mx-auto italic">
                  "{LEVEL_THEMES[(saveData.level - 1) % LEVEL_THEMES.length].story}"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-12 text-left bg-white/10 p-6 rounded-3xl">
                <div>
                  <h3 className="font-bold mb-2 text-indigo-200 uppercase text-xs tracking-widest">Movement</h3>
                  <p className="font-bold">WASD / Arrow Keys</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2 text-indigo-200 uppercase text-xs tracking-widest">Actions</h3>
                  <p className="font-bold text-xs">J/Z: Attack | K/X: Heavy | L/C: Skill | SPACE: Dash</p>
                </div>
              </div>

              <button 
                onClick={handleStart}
                className="group relative bg-white text-indigo-600 font-black text-2xl px-12 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform active:scale-95"
              >
                <span className="flex items-center gap-3">
                  <Play fill="currentColor" /> {saveData.level > 1 ? 'CONTINUE' : 'START GAME'}
                </span>
              </button>
            </motion.div>
          )}

          {gameState === GameState.LEVEL_UP && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="mb-12"
              >
                <h2 className="text-indigo-400 font-black tracking-[0.2em] text-sm uppercase mb-2">Level Up!</h2>
                <h1 className="text-5xl font-black text-white tracking-tighter">CHOOSE A CORE</h1>
              </motion.div>

              <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                {levelUpOptions.map((core) => (
                  <button
                    key={core.id}
                    onClick={() => selectCore(core.id)}
                    className="group relative bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-indigo-500 p-8 rounded-[2rem] transition-all flex flex-col items-center gap-6"
                  >
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {core.icon === 'Sword' && <Sword className="text-indigo-400" size={40} />}
                      {core.icon === 'Heart' && <Heart className="text-red-400" size={40} />}
                      {core.icon === 'Zap' && <Zap className="text-amber-400" size={40} />}
                      {core.icon === 'Shield' && <Shield className="text-blue-400" size={40} />}
                      {core.icon === 'Target' && <Target className="text-emerald-400" size={40} />}
                      {core.icon === 'Crosshair' && <Crosshair className="text-rose-400" size={40} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-2">{core.name}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{core.description}</p>
                    </div>
                    <div className="absolute inset-x-0 -bottom-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-indigo-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Select</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === GameState.UPGRADE_MENU && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-slate-50 flex flex-col p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-black text-slate-800">SOUL UPGRADES</h2>
                <div className="flex items-center gap-3 bg-white p-3 px-6 rounded-2xl shadow-md border-2 border-slate-100">
                  <Ghost className="text-violet-500" size={28} />
                  <span className="font-bold text-slate-700 text-2xl">{Math.floor(saveData.souls)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 flex-1 overflow-y-auto pr-2">
                <UpgradeCard 
                  icon={<Heart className="text-red-500" />}
                  title="Max HP"
                  level={saveData.upgrades.hp}
                  cost={UpgradeSystem.getUpgradeCost(saveData.upgrades.hp)}
                  onBuy={() => buyUpgrade('hp')}
                  canAfford={saveData.gold >= UpgradeSystem.getUpgradeCost(saveData.upgrades.hp)}
                />
                <UpgradeCard 
                  icon={<Sword className="text-blue-500" />}
                  title="Damage"
                  level={saveData.upgrades.damage}
                  cost={UpgradeSystem.getUpgradeCost(saveData.upgrades.damage)}
                  onBuy={() => buyUpgrade('damage')}
                  canAfford={saveData.gold >= UpgradeSystem.getUpgradeCost(saveData.upgrades.damage)}
                />
                <UpgradeCard 
                  icon={<Zap className="text-amber-500" />}
                  title="Speed"
                  level={saveData.upgrades.speed}
                  cost={UpgradeSystem.getUpgradeCost(saveData.upgrades.speed)}
                  onBuy={() => buyUpgrade('speed')}
                  canAfford={saveData.gold >= UpgradeSystem.getUpgradeCost(saveData.upgrades.speed)}
                />
                <UpgradeCard 
                  icon={<Shield className="text-indigo-500" />}
                  title="Skill CD"
                  level={saveData.upgrades.cooldown}
                  cost={UpgradeSystem.getUpgradeCost(saveData.upgrades.cooldown)}
                  onBuy={() => buyUpgrade('cooldown')}
                  canAfford={saveData.gold >= UpgradeSystem.getUpgradeCost(saveData.upgrades.cooldown)}
                />
                
                <div className="col-span-2 bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-100">
                  <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                    <ShoppingCart size={20} /> SKINS (200 Gold)
                  </h3>
                  <div className="flex gap-4">
                    {['#4ade80', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa'].map(color => (
                      <button 
                        key={color}
                        onClick={() => changeSkin(color)}
                        className={`w-12 h-12 rounded-full border-4 transition-transform hover:scale-110 ${saveData.upgrades.skin === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={handleResume}
                  className="flex-1 bg-slate-200 text-slate-800 font-black text-xl py-4 rounded-2xl shadow-md hover:bg-slate-300 transition-colors"
                >
                  RESUME
                </button>
                <button 
                  onClick={handleNextLevel}
                  className="flex-[2] bg-indigo-600 text-white font-black text-xl py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3"
                >
                  NEXT LEVEL <Play fill="currentColor" size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {gameState === GameState.GAME_OVER && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-red-500/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-12 text-center"
            >
              <h2 className="text-6xl font-black mb-4">GAME OVER</h2>
              <p className="text-xl mb-12 opacity-90">Don't give up! You'll get stronger next time.</p>
              <button 
                onClick={handleRestart}
                className="bg-white text-red-600 font-black text-2xl px-12 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform"
              >
                <span className="flex items-center gap-3">
                  <RotateCcw /> TRY AGAIN
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function UpgradeCard({ icon, title, level, cost, onBuy, canAfford }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
      <div className="flex items-center gap-4">
        <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-50 transition-colors">
          {icon}
        </div>
        <div>
          <h4 className="font-black text-slate-800">{title}</h4>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lv. {level}</p>
        </div>
      </div>
      <button 
        onClick={onBuy}
        disabled={!canAfford}
        className={`flex flex-col items-center p-2 px-4 rounded-2xl transition-all ${canAfford ? 'bg-violet-50 text-violet-600 hover:bg-violet-100' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
      >
        <span className="text-[10px] font-black uppercase">Upgrade</span>
        <span className="font-black flex items-center gap-1"><Ghost size={14} /> {cost}</span>
      </button>
    </div>
  );
}
