'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sheet } from '@/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Rocket, CheckCircle, PlusCircle, Shield, Lock, Star, FileText, ExternalLink,
} from 'lucide-react';
import ErrorDialog from '@/app/components/ErrorDialog';

const MY_SHEETS_KEY = 'pingo_my_sheet_ids';

function getLocalSheetIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MY_SHEETS_KEY) || '[]');
  } catch {
    return [];
  }
}

// ─── Sheet carousel card ───────────────────────────────────────────────────
function SheetCard({
  sheet,
  selected,
  onSelect,
  custom = false,
}: {
  sheet?: Sheet;
  selected: boolean;
  onSelect: () => void;
  custom?: boolean;
}) {
  return (
    <div onClick={onSelect} className="flex-shrink-0 w-36 cursor-pointer group">
      <div className={cn(
        'aspect-[3/4] rounded-2xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden mb-2 relative shadow-sm',
        selected
          ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
          : custom
          ? 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/50'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/30',
      )}>
        {custom ? (
          <>
            <PlusCircle size={36} className={cn('transition-colors', selected ? 'text-primary' : 'text-slate-300 dark:text-slate-600')} />
            <p className={cn('mt-2 text-[9px] font-black uppercase tracking-widest', selected ? 'text-primary' : 'text-slate-300 dark:text-slate-600')}>
              Browse
            </p>
          </>
        ) : (
          <>
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-3">
              <FileText size={28} className="text-slate-300 dark:text-slate-600" />
            </div>
            {selected && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                <CheckCircle className="text-primary fill-white" size={36} />
              </div>
            )}
          </>
        )}
      </div>
      <p className={cn(
        'text-center font-bold text-xs leading-tight transition-colors px-1',
        selected ? 'text-primary' : 'text-slate-500 dark:text-slate-400',
      )}>
        {custom ? 'My Sheets' : sheet?.title}
      </p>
    </div>
  );
}

export default function CreateGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [defaultSheets, setDefaultSheets] = useState<Sheet[]>([]);
  const [mySheets, setMySheets] = useState<Sheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [settings, setSettings] = useState({ firstBingoWins: true, antiCheat: false, privateLobby: true });
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const showError = (title: string, message: string) => setDialog({ title, message });

  useEffect(() => {
    const load = async () => {
      // Default sheets
      const { data: defaults } = await supabase
        .from('sheet')
        .select('*')
        .eq('is_default', true)
        .order('created_at', { ascending: true });

      const defaultList = (defaults as Sheet[]) ?? [];
      setDefaultSheets(defaultList);

      // My sheets from localStorage
      const ids = getLocalSheetIds();
      if (ids.length > 0) {
        const { data: mine } = await supabase
          .from('sheet')
          .select('*')
          .in('id', ids)
          .order('created_at', { ascending: false });
        setMySheets((mine as Sheet[]) ?? []);
      }

      // Pre-select from query param (?sheetId=) or first default
      const paramId = searchParams.get('sheetId');
      if (paramId) {
        setSelectedSheetId(paramId);
      } else if (defaultList.length > 0) {
        setSelectedSheetId(defaultList[0].id);
      }
    };
    load();

    // Nickname
    const saved = localStorage.getItem('pingo_nickname');
    if (saved) setNickname(saved);

    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profile').select('nickname').eq('id', user.id).single();
        if (profile?.nickname) {
          setNickname(profile.nickname);
          localStorage.setItem('pingo_nickname', profile.nickname);
        }
      }
    };
    checkProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (isCreating) return;

    if (!nickname.trim()) {
      showError('Nickname Required', 'Please enter a nickname before creating the lobby.');
      return;
    }
    if (!selectedSheetId) {
      showError('No Sheet Selected', 'Please select a bingo sheet before creating the lobby.');
      return;
    }

    setIsCreating(true);
    try {
      // Room code with uniqueness check
      let roomCode = '';
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        roomCode = Array.from({ length: 6 }, () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join('');
        const { data: existing } = await supabase.from('game').select('id').eq('room_code', roomCode).maybeSingle();
        if (!existing) isUnique = true;
        attempts++;
      }
      if (!isUnique) throw new Error('Could not generate a unique room code.');

      const { data: game, error: gameError } = await supabase
        .from('game')
        .insert({ room_code: roomCode, sheet_id: selectedSheetId, status: 'lobby', config: settings })
        .select()
        .single();
      if (gameError) throw gameError;

      const { data: hostPlayer, error: playerError } = await supabase
        .from('player')
        .insert({ game_id: game.id, nickname: nickname.trim(), is_host: true })
        .select()
        .single();
      if (playerError) throw playerError;

      // Persist session
      localStorage.setItem('pingo_nickname', nickname.trim());
      localStorage.setItem(`pingo_player_${game.id}`, hostPlayer.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profile').upsert({ id: user.id, nickname: nickname.trim(), updated_at: new Date().toISOString() });
      }

      router.push(`/lobby/${game.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
      showError('Game Creation Failed', 'Something went wrong while creating the lobby. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-32 relative font-display antialiased">
      <ErrorDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        onClose={() => setDialog(null)}
      />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div className="absolute top-20 -left-10 w-32 h-32 rounded-full bg-blue-400/10 border-4 border-blue-400/20 flex items-center justify-center text-blue-400/20 text-4xl font-black rotate-12">30</div>
        <div className="absolute top-1/3 -right-12 w-40 h-40 rounded-full bg-pink-400/10 border-4 border-pink-400/20 flex items-center justify-center text-pink-400/20 text-5xl font-black -rotate-12">21</div>
        <div className="absolute bottom-1/4 -left-8 w-24 h-24 rounded-full bg-green-400/10 border-4 border-green-400/20 flex items-center justify-center text-green-400/20 text-2xl font-black rotate-45">9</div>
      </div>

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-black tracking-tight uppercase">Create New Game</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-10">

        {/* ── Default Sheets carousel ── */}
        <section>
          <h2 className="text-xl font-black mb-4 px-1 uppercase tracking-tight">Default Sheets</h2>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
            {defaultSheets.map(sheet => (
              <SheetCard
                key={sheet.id}
                sheet={sheet}
                selected={selectedSheetId === sheet.id}
                onSelect={() => setSelectedSheetId(sheet.id)}
              />
            ))}
          </div>
        </section>

        {/* ── My Sheets carousel ── */}
        <section>
          <div className="flex items-baseline justify-between mb-4 px-1">
            <h2 className="text-xl font-black uppercase tracking-tight">My Sheets</h2>
            <button
              onClick={() => router.push('/sheets')}
              className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              Manage
              <ExternalLink size={11} />
            </button>
          </div>

          {mySheets.length === 0 ? (
            // Empty state — invite to create
            <button
              onClick={() => router.push('/sheets')}
              className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors group"
            >
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <PlusCircle size={24} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-black text-sm text-slate-900 dark:text-white">Create a Custom Sheet</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Build your own bingo sheet and reuse it anytime.
                </p>
              </div>
            </button>
          ) : (
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
              {mySheets.map(sheet => (
                <SheetCard
                  key={sheet.id}
                  sheet={sheet}
                  selected={selectedSheetId === sheet.id}
                  onSelect={() => setSelectedSheetId(sheet.id)}
                />
              ))}
              {/* + New sheet shortcut */}
              <SheetCard
                selected={false}
                custom
                onSelect={() => router.push('/sheets')}
              />
            </div>
          )}
        </section>

        {/* ── Lobby Settings ── */}
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

        {/* ── Your Nickname ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-black px-1 uppercase tracking-tight">Your Nickname</h2>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold"
              placeholder="e.g. BingoHost"
              type="text"
            />
          </div>
        </section>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-50">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-primary/30 uppercase tracking-widest disabled:opacity-50"
          >
            <span>{isCreating ? 'Creating…' : 'Create Lobby'}</span>
            {!isCreating && <Rocket size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  icon, title, description, enabled, onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-5">
      <div className="flex gap-4">
        <div className={cn(
          'size-10 rounded-xl flex items-center justify-center shrink-0',
          enabled ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400',
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
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
          enabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700',
        )}
      >
        <span className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          enabled ? 'translate-x-5' : 'translate-x-0',
        )} />
      </button>
    </div>
  );
}
