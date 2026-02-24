'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sheet } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowLeft, Rocket, CheckCircle, PlusCircle, Settings, Shield, Lock, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreateGamePage() {
  const router = useRouter();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customItems, setCustomItems] = useState('');
  const [nickname, setNickname] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [settings, setSettings] = useState({
    firstBingoWins: true,
    antiCheat: false,
    privateLobby: true,
  });

  useEffect(() => {
    const fetchSheets = async () => {
      const { data, error } = await supabase
        .from('sheet')
        .select('*')
        .eq('is_default', true);
      
      if (!error && data) {
        setSheets(data);
        if (data.length > 0) setSelectedSheetId(data[0].id);
      }
    };
    fetchSheets();

    // Load Nickname
    const saved = localStorage.getItem('pingo_nickname');
    if (saved) setNickname(saved);

    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profile')
          .select('nickname')
          .eq('id', user.id)
          .single();
        if (profile?.nickname) {
          setNickname(profile.nickname);
          localStorage.setItem('pingo_nickname', profile.nickname);
        }
      }
    };
    checkProfile();
  }, []);

  const handleCreate = async () => {
    if (isCreating || !nickname.trim()) {
      if (!nickname.trim()) alert('Please enter a nickname.');
      return;
    }
    setIsCreating(true);

    try {
      let finalSheetId = selectedSheetId;

      // Handle Custom Sheet
      if (selectedSheetId === 'custom') {
        const itemsArray = customItems.split('\n').filter(i => i.trim() !== '');
        if (itemsArray.length < 25) {
          alert('Custom sheet needs at least 25 items.');
          setIsCreating(false);
          return;
        }

        const { data: newSheet, error: sheetError } = await supabase
          .from('sheet')
          .insert({
            title: customTitle || 'Custom Sheet',
            items: itemsArray,
            is_default: false,
          })
          .select()
          .single();

        if (sheetError) throw sheetError;
        finalSheetId = newSheet.id;
      }

      // Create Game with collision check
      let roomCode = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 5) {
        roomCode = Array.from({ length: 6 }, () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 0, O, 1, I, S, 5
          return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join('');

        const { data: existingGame } = await supabase
          .from('game')
          .select('id')
          .eq('room_code', roomCode)
          .maybeSingle();

        if (!existingGame) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) throw new Error('Could not generate a unique room code. Please try again.');

      const { data: game, error: gameError } = await supabase
        .from('game')
        .insert({
          room_code: roomCode,
          sheet_id: finalSheetId,
          status: 'lobby',
          config: settings,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Create Host Player (Mocking nickname for now, usually from auth or input)
      const { data: hostPlayer, error: playerError } = await supabase
        .from('player')
        .insert({
          game_id: game.id,
          nickname: nickname.trim(),
          is_host: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Sync Nickname
      localStorage.setItem('pingo_nickname', nickname.trim());
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profile')
          .upsert({ id: user.id, nickname: nickname.trim(), updated_at: new Date().toISOString() });
      }

      // Save to localStorage for lobby/game session
      localStorage.setItem(`pingo_player_${game.id}`, hostPlayer.id);

      router.push(`/lobby/${game.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Check console for details.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-32 relative font-display antialiased">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div className="absolute top-20 -left-10 w-32 h-32 rounded-full bg-blue-400/10 border-4 border-blue-400/20 flex items-center justify-center text-blue-400/20 text-4xl font-black rotate-12">30</div>
        <div className="absolute top-1/3 -right-12 w-40 h-40 rounded-full bg-pink-400/10 border-4 border-pink-400/20 flex items-center justify-center text-pink-400/20 text-5xl font-black -rotate-12">21</div>
        <div className="absolute bottom-1/4 -left-8 w-24 h-24 rounded-full bg-green-400/10 border-4 border-green-400/20 flex items-center justify-center text-green-400/20 text-2xl font-black rotate-45">9</div>
      </div>

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-black tracking-tight uppercase">Create New Game</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-8">
        {/* Section: Select a Bingo Sheet */}
        <section>
          <h2 className="text-xl font-black mb-4 px-1 uppercase tracking-tight">Select a Bingo Sheet</h2>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
            {sheets.map((sheet) => (
              <div 
                key={sheet.id}
                onClick={() => setSelectedSheetId(sheet.id)}
                className="flex-shrink-0 w-40 group cursor-pointer"
              >
                <div className={cn(
                  "aspect-[3/4] rounded-2xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden mb-3 relative shadow-sm",
                  selectedSheetId === sheet.id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                )}>
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="text-4xl font-black text-slate-200 dark:text-slate-700 select-none uppercase">BINGO</span>
                  </div>
                  {selectedSheetId === sheet.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                      <CheckCircle className="text-primary fill-white" size={40} />
                    </div>
                  )}
                </div>
                <p className={cn(
                  "text-center font-bold text-sm transition-colors",
                  selectedSheetId === sheet.id ? "text-primary" : "text-slate-500 dark:text-slate-400"
                )}>{sheet.title}</p>
              </div>
            ))}
            
            {/* Custom Sheet Option */}
            <div 
              onClick={() => setSelectedSheetId('custom')}
              className="flex-shrink-0 w-40 group cursor-pointer"
            >
              <div className={cn(
                "aspect-[3/4] rounded-2xl border-2 transition-all flex flex-col items-center justify-center mb-3 shadow-sm",
                selectedSheetId === 'custom' ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              )}>
                <PlusCircle size={40} className={cn(
                  "transition-colors",
                  selectedSheetId === 'custom' ? "text-primary" : "text-slate-300 dark:text-slate-600"
                )} />
              </div>
              <p className={cn(
                "text-center font-bold text-sm transition-colors",
                selectedSheetId === 'custom' ? "text-primary" : "text-slate-500 dark:text-slate-400"
              )}>Custom Sheet</p>
            </div>
          </div>
        </section>

        {/* Section: Configure Custom Sheet */}
        {selectedSheetId === 'custom' && (
          <motion.section 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-black px-1 uppercase tracking-tight">Configure Custom Sheet</h2>
            <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-1">
                  <Settings size={12} />
                  Sheet Name
                </label>
                <input 
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold" 
                  placeholder="e.g. Friday Fun Bingo" 
                  type="text"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phrases / Words</label>
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">One per line</span>
                </div>
                <textarea 
                  value={customItems}
                  onChange={(e) => setCustomItems(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none font-medium text-sm leading-relaxed" 
                  placeholder="Can you hear me?&#10;Let's circle back&#10;Bio break" 
                  rows={6}
                />
                <p className="text-[10px] text-slate-400 px-2 italic font-medium">Enter at least 25 phrases for a standard 5x5 grid.</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Section: Lobby Settings */}
        <section className="space-y-4">
          <h2 className="text-xl font-black px-1 uppercase tracking-tight">Lobby Settings</h2>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <SettingToggle 
              icon={<Star size={18} />}
              title="First Bingo Wins" 
              description="The game ends immediately after the first person scores." 
              enabled={settings.firstBingoWins}
              onToggle={() => setSettings(s => ({ ...s, firstBingoWins: !s.firstBingoWins }))}
            />
            <SettingToggle 
              icon={<Shield size={18} />}
              title="Anti-Cheat Mode" 
              description="Requires multi-player verification for marked squares." 
              enabled={settings.antiCheat}
              onToggle={() => setSettings(s => ({ ...s, antiCheat: !s.antiCheat }))}
            />
            <SettingToggle 
              icon={<Lock size={18} />}
              title="Private Lobby" 
              description="Only people with the unique room code can join." 
              enabled={settings.privateLobby}
              onToggle={() => setSettings(s => ({ ...s, privateLobby: !s.privateLobby }))}
            />
          </div>
        </section>

        {/* Section: Your Nickname */}
        <section className="space-y-4">
          <h2 className="text-xl font-black px-1 uppercase tracking-tight">Your Nickname</h2>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <input 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold" 
              placeholder="e.g. BingoHost" 
              type="text"
            />
          </div>
        </section>
      </main>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-50">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-primary/30 uppercase tracking-widest disabled:opacity-50"
          >
            <span>{isCreating ? 'Creating...' : 'Create Lobby'}</span>
            {!isCreating && <Rocket size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ 
  icon, 
  title, 
  description, 
  enabled, 
  onToggle 
}: { 
  icon: React.ReactNode;
  title: string; 
  description: string; 
  enabled: boolean; 
  onToggle: () => void 
}) {
  return (
    <div className="flex items-center justify-between p-5">
      <div className="flex gap-4">
        <div className={cn(
          "size-10 rounded-xl flex items-center justify-center shrink-0",
          enabled ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
        )}>
          {icon}
        </div>
        <div className="space-y-0.5 pr-4">
          <p className="font-bold text-sm tracking-tight">{title}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium leading-tight">{description}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
          enabled ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
        )}
      >
        <span className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}
