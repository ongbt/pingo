'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sheet } from '@/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Rocket, Shield, Lock, Star, Flame, Plus, Search,
  ChevronRight, X, CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorDialog from '@/app/components/ErrorDialog';

export const runtime = 'edge';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MY_SHEETS_KEY = 'pingo_my_sheet_ids';
function getLocalSheetIds(): string[] {
  try { return JSON.parse(localStorage.getItem(MY_SHEETS_KEY) || '[]'); } catch { return []; }
}

const SHEET_EMOJIS = ['📋', '✨', '🎯', '🎉', '⚡', '💡', '🏆', '🎲', '🎵', '🌍'];
function emojiFor(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  return SHEET_EMOJIS[Math.abs(h) % SHEET_EMOJIS.length];
}

function formatPlays(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
  return String(n);
}

// ─── Sheet Row (inside the modal) ─────────────────────────────────────────────
function ModalSheetRow({ sheet, selected, onSelect }: {
  sheet: Sheet; selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        selected ? 'bg-primary/8 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
      )}
    >
      <span className="text-xl shrink-0 w-8 text-center">{emojiFor(sheet.title)}</span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-black truncate', selected ? 'text-primary' : 'text-slate-900 dark:text-white')}>
          {sheet.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold text-slate-400">{sheet.items.length} items</span>
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500">
            <Flame size={8} />{formatPlays(sheet.play_count)} {sheet.play_count === 1 ? 'play' : 'plays'}
          </span>
        </div>
      </div>
      {selected
        ? <CheckCircle2 size={18} className="text-primary shrink-0" />
        : <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
      }
    </button>
  );
}

// ─── Sheet Picker Modal ────────────────────────────────────────────────────────
function SheetPickerModal({ open, sheets, mySheetIds, selectedId, onSelect, onClose, onGoToSheets }: {
  open: boolean;
  sheets: Sheet[];
  mySheetIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onGoToSheets: () => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? sheets.filter(s => s.title.toLowerCase().includes(q)) : sheets;
  }, [sheets, query]);

  const mySheets  = filtered.filter(s => mySheetIds.includes(s.id));
  const allSheets = filtered.filter(s => !mySheetIds.includes(s.id));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-white dark:bg-slate-900 shadow-2xl max-h-[80vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-white">Choose a Sheet</h3>
              <button
                onClick={onClose}
                className="size-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search sheets…"
                  className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  autoFocus
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 pb-6">
              {mySheets.length > 0 && (
                <>
                  <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">My Sheets</p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mySheets.map(s => (
                      <ModalSheetRow key={s.id} sheet={s} selected={selectedId === s.id} onSelect={() => { onSelect(s.id); onClose(); }} />
                    ))}
                  </div>
                </>
              )}

              {allSheets.length > 0 && (
                <>
                  <p className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400", mySheets.length > 0 && "mt-2")}>
                    {query ? 'Results' : 'All Sheets'}
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allSheets.map(s => (
                      <ModalSheetRow key={s.id} sheet={s} selected={selectedId === s.id} onSelect={() => { onSelect(s.id); onClose(); }} />
                    ))}
                  </div>
                </>
              )}

              {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                  <Search size={32} className="opacity-30" />
                  <p className="text-sm font-bold">No sheets match &quot;{query}&quot;</p>
                </div>
              )}

              {/* Create custom sheet CTA */}
              <div className="px-4 mt-4">
                <button
                  onClick={onGoToSheets}
                  className="w-full flex items-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 hover:border-primary/40 hover:bg-primary/5 transition-all group text-left"
                >
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <Plus size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">Create a Custom Sheet</p>
                    <p className="text-[10px] text-slate-400 font-medium">Build your own bingo sheet</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Settings Toggle ──────────────────────────────────────────────────────────
function SettingToggle({ icon, title, description, enabled, onToggle }: {
  icon: React.ReactNode; title: string; description: string; enabled: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex gap-3 items-center">
        <div className={cn(
          'size-8 rounded-lg flex items-center justify-center shrink-0',
          enabled ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400',
        )}>
          {icon}
        </div>
        <div className="pr-3">
          <p className="font-bold text-sm">{title}</p>
          <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
          enabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700',
        )}
      >
        <span className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200',
          enabled ? 'translate-x-5' : 'translate-x-0',
        )} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CreateGamePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [sheets,          setSheets]          = useState<Sheet[]>([]);
  const [mySheetIds,      setMySheetIds]      = useState<string[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [pickerOpen,      setPickerOpen]      = useState(false);
  const [nickname,        setNickname]        = useState('');
  const [isCreating,      setIsCreating]      = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [settings, setSettings] = useState({ firstBingoWins: true, antiCheat: false, privateLobby: true });
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const showError = (title: string, message: string) => setDialog({ title, message });

  useEffect(() => {
    const load = async () => {
      // Load ALL sheets so the picker has everything
      const { data } = await supabase
        .from('sheet')
        .select('*')
        .order('play_count', { ascending: false })
        .order('title', { ascending: true });

      const all = (data as Sheet[]) ?? [];
      setSheets(all);

      const ids = getLocalSheetIds();
      setMySheetIds(ids);

      const paramId = searchParams.get('sheetId');
      if (paramId && all.find(s => s.id === paramId)) {
        setSelectedSheetId(paramId);
      } else if (all.length > 0) {
        setSelectedSheetId(all[0].id);
      }

      setLoading(false);
    };
    load();

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
    if (!nickname.trim()) { showError('Nickname Required', 'Please enter a nickname before creating the lobby.'); return; }
    if (!selectedSheetId) { showError('No Sheet Selected', 'Please select a bingo sheet before creating the lobby.'); return; }

    setIsCreating(true);
    try {
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
        .select().single();
      if (gameError) throw gameError;

      const { data: hostPlayer, error: playerError } = await supabase
        .from('player')
        .insert({ game_id: game.id, nickname: nickname.trim(), is_host: true })
        .select().single();
      if (playerError) throw playerError;

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

  const selectedSheet = sheets.find(s => s.id === selectedSheetId) ?? null;

  return (
    <div className="bg-[#F5F7FA] dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-36 font-display antialiased">
      <ErrorDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        onClose={() => setDialog(null)}
      />

      <SheetPickerModal
        open={pickerOpen}
        sheets={sheets}
        mySheetIds={mySheetIds}
        selectedId={selectedSheetId}
        onSelect={setSelectedSheetId}
        onClose={() => setPickerOpen(false)}
        onGoToSheets={() => { setPickerOpen(false); router.push('/sheets'); }}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3.5">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-black tracking-tight uppercase">Create New Game</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* ── Sheet Picker ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3 px-0.5 flex items-center gap-2">
            <Flame size={14} className="text-orange-500" />
            Bingo Sheet
          </h2>

          <button
            onClick={() => setPickerOpen(true)}
            disabled={loading}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-left hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <div className="flex items-center gap-4 p-4">
                <div className="size-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
            ) : selectedSheet ? (
              <div className="flex items-center gap-4 p-4">
                {/* Emoji icon */}
                <div className="size-14 rounded-xl bg-gradient-to-br from-primary/20 to-orange-400/10 flex items-center justify-center shrink-0 text-2xl">
                  {emojiFor(selectedSheet.title)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[15px] text-slate-900 dark:text-white truncate">{selectedSheet.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] font-bold text-slate-400">{selectedSheet.items.length} items</span>
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-orange-500">
                      <Flame size={10} />
                      {formatPlays(selectedSheet.play_count)} {selectedSheet.play_count === 1 ? 'play' : 'plays'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-primary">
                  <span className="text-[11px] font-black uppercase tracking-widest">Change</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4">
                <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus size={22} className="text-primary" />
                </div>
                <div>
                  <p className="font-black text-sm text-slate-700 dark:text-slate-300">Choose a Sheet</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tap to browse all sheets</p>
                </div>
                <ChevronRight size={16} className="text-slate-400 ml-auto" />
              </div>
            )}
          </button>
        </section>

        {/* ── Lobby Settings ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3 px-0.5">Lobby Settings</h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
            <SettingToggle
              icon={<Star size={16} />}
              title="First Bingo Wins"
              description="Game ends when the first player scores."
              enabled={settings.firstBingoWins}
              onToggle={() => setSettings(s => ({ ...s, firstBingoWins: !s.firstBingoWins }))}
            />
            <SettingToggle
              icon={<Shield size={16} />}
              title="Anti-Cheat Mode"
              description="Multi-player verification for marked squares."
              enabled={settings.antiCheat}
              onToggle={() => setSettings(s => ({ ...s, antiCheat: !s.antiCheat }))}
            />
            <SettingToggle
              icon={<Lock size={16} />}
              title="Private Lobby"
              description="Join requires the unique room code."
              enabled={settings.privateLobby}
              onToggle={() => setSettings(s => ({ ...s, privateLobby: !s.privateLobby }))}
            />
          </div>
        </section>

        {/* ── Nickname ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3 px-0.5">Your Nickname</h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-background-dark border-2 border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold text-sm"
              placeholder="e.g. BingoHost"
              type="text"
            />
          </div>
        </section>
      </main>

      {/* ── Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-30">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCreate}
            disabled={isCreating || !selectedSheetId}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 uppercase tracking-widest text-sm"
          >
            {isCreating ? (
              <span>Creating…</span>
            ) : (
              <>
                <Rocket size={18} />
                <span>Create Lobby</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
