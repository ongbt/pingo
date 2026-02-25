'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sheet } from '@/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Plus, ChevronRight, Trash2, Settings, CheckCircle2,
  Flame, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorDialog from '@/app/components/ErrorDialog';

export const runtime = 'edge';

const MY_SHEETS_KEY = 'pingo_my_sheet_ids';

function getLocalSheetIds(): string[] {
  try { return JSON.parse(localStorage.getItem(MY_SHEETS_KEY) || '[]'); } catch { return []; }
}
function addLocalSheetId(id: string) {
  const ids = getLocalSheetIds();
  if (!ids.includes(id)) localStorage.setItem(MY_SHEETS_KEY, JSON.stringify([...ids, id]));
}
function removeLocalSheetId(id: string) {
  localStorage.setItem(MY_SHEETS_KEY, JSON.stringify(getLocalSheetIds().filter(i => i !== id)));
}

function detectDuplicates(items: string[]): string[] {
  const seen = new Map<string, boolean>();
  const dupes: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) dupes.push(item);
    else seen.set(key, true);
  }
  return dupes;
}

// ─── Create Sheet Form ────────────────────────────────────────────────────
function CreateSheetForm({ onSaved }: { onSaved: (sheet: Sheet) => void }) {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string; details?: string[] } | null>(null);

  const itemCount = items.split('\n').map(i => i.trim()).filter(Boolean).length;

  const handleSave = async () => {
    if (saving) return;

    if (!title.trim()) {
      setDialog({ title: 'Sheet Name Required', message: 'Please give your sheet a name before saving.' });
      return;
    }

    const itemsArray = items.split('\n').map(i => i.trim()).filter(Boolean);

    const dupes = detectDuplicates(itemsArray);
    if (dupes.length > 0) {
      setDialog({ title: 'Duplicate Items Found', message: 'Every item must be unique. Remove or rename the duplicates below:', details: dupes });
      return;
    }

    if (itemsArray.length < 25) {
      setDialog({ title: 'Not Enough Items', message: `You have ${itemsArray.length} item${itemsArray.length === 1 ? '' : 's'}. Add at least ${25 - itemsArray.length} more to reach the minimum of 25.` });
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('sheet')
      .insert({ title: title.trim(), items: itemsArray, is_default: false })
      .select()
      .single();
    setSaving(false);

    if (error || !data) {
      setDialog({ title: 'Save Failed', message: 'Could not save the sheet. Please try again.' });
      return;
    }

    addLocalSheetId(data.id);
    onSaved(data as Sheet);
    setTitle('');
    setItems('');
  };

  return (
    <>
      <ErrorDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        details={dialog?.details}
        onClose={() => setDialog(null)}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div className="p-4 space-y-4">
          {/* Sheet Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Settings size={10} />
              Sheet Name
              <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-background-dark border-2 border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold text-sm transition-colors"
              placeholder="e.g. Office Party Bingo"
              type="text"
            />
          </div>

          {/* Items */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Phrases / Words
              </label>
              <span className={cn(
                'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-colors',
                itemCount >= 25
                  ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                  : 'text-primary bg-primary/10'
              )}>
                {itemCount} / 25 min
              </span>
            </div>
            <textarea
              value={items}
              onChange={e => setItems(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-background-dark border-2 border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none font-medium text-sm leading-relaxed"
              placeholder={"Can you hear me?\nLet's circle back\nBio break"}
              rows={6}
            />
            <p className="text-[10px] text-slate-400 italic font-medium">
              One item per line · Min 25 · No duplicates
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-primary/20 uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {saving ? 'Saving…' : <><CheckCircle2 size={15} /> Save Sheet</>}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── My Sheet Card ──────────────────────────────────────────────────────────
function MySheetCard({ sheet, onDelete, onPlay }: { sheet: Sheet; onDelete?: () => void; onPlay: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Icon */}
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-lg">📋</span>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-[13px] text-slate-900 dark:text-white truncate">{sheet.title}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {sheet.items.length} items
          </p>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onDelete && (
            <button
              onClick={onDelete}
              className="size-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onPlay}
            className="h-8 px-3.5 rounded-lg bg-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-1 shadow-sm shadow-primary/20 active:scale-95 transition-transform"
          >
            Use <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Top Sheet Row ──────────────────────────────────────────────────────────
function TopSheetRow({ sheet, rank, onPlay }: { sheet: Sheet; rank: number; onPlay: () => void }) {
  const rankColors = ['text-yellow-500', 'text-slate-400', 'text-orange-500'];
  const rankBg    = ['bg-yellow-50 dark:bg-yellow-900/20', 'bg-slate-50 dark:bg-slate-800', 'bg-orange-50 dark:bg-orange-900/20'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Rank badge */}
        <div className={cn(
          'size-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm',
          rank < 3 ? rankBg[rank] : 'bg-slate-50 dark:bg-slate-800',
          rank < 3 ? rankColors[rank] : 'text-slate-400',
        )}>
          {rank < 3 ? ['🥇', '🥈', '🥉'][rank] : `#${rank + 1}`}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-[13px] text-slate-900 dark:text-white truncate">{sheet.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {sheet.items.length} items
            </span>
            {sheet.play_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500">
                <Flame size={9} />
                {sheet.play_count} {sheet.play_count === 1 ? 'play' : 'plays'}
              </span>
            )}
          </div>
        </div>

        {/* Use button */}
        <button
          onClick={onPlay}
          className="h-8 px-3.5 rounded-lg bg-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-1 shadow-sm shadow-primary/20 active:scale-95 transition-transform shrink-0"
        >
          Use <ChevronRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function SheetsPage() {
  const router = useRouter();
  const [topSheets, setTopSheets]   = useState<Sheet[]>([]);
  const [mySheets, setMySheets]     = useState<Sheet[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      // Top 5 most-played
      const { data: top } = await supabase
        .from('sheet')
        .select('*')
        .order('play_count', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(5);
      setTopSheets((top as Sheet[]) ?? []);

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

      // Auth-based sheets
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: authSheets } = await supabase
          .from('sheet')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (authSheets?.length) {
          setMySheets(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            return [...authSheets.filter(s => !existingIds.has(s.id)), ...prev] as Sheet[];
          });
        }
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleSheetSaved = (sheet: Sheet) => {
    setMySheets(prev => [sheet, ...prev]);
    setShowForm(false);
  };

  const handleDelete = (sheet: Sheet) => {
    removeLocalSheetId(sheet.id);
    setMySheets(prev => prev.filter(s => s.id !== sheet.id));
  };

  const handlePlay = (sheetId: string) => router.push(`/create?sheetId=${sheetId}`);

  return (
    <div className="bg-[#F5F7FA] dark:bg-background-dark min-h-screen pb-28 font-display antialiased">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3.5">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-black tracking-tight uppercase">Sheets</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-8">

        {/* ── My Sheets ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">My Sheets</h2>
            <button
              onClick={() => setShowForm(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-black text-[11px] uppercase tracking-widest transition-all',
                showForm
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  : 'bg-primary text-white shadow-md shadow-primary/25'
              )}
            >
              <Plus size={13} className={cn('transition-transform duration-200', showForm && 'rotate-45')} />
              {showForm ? 'Cancel' : 'New Sheet'}
            </button>
          </div>

          {/* Create form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                key="form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <CreateSheetForm onSaved={handleSheetSaved} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary" />
            </div>
          ) : mySheets.length === 0 && !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full text-left flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <Plus size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-black text-sm text-slate-900 dark:text-white">Create your first sheet</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Build a custom bingo sheet and reuse it anytime</p>
              </div>
            </button>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2.5">
                {mySheets.map(sheet => (
                  <MySheetCard
                    key={sheet.id}
                    sheet={sheet}
                    onDelete={() => handleDelete(sheet)}
                    onPlay={() => handlePlay(sheet.id)}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </section>

        {/* ── Top Sheets ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame size={13} className="text-orange-500" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Top Sheets</h2>
            <TrendingUp size={13} className="text-slate-400 ml-auto" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Most played</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-2.5">
              {topSheets.map((sheet, i) => (
                <TopSheetRow
                  key={sheet.id}
                  sheet={sheet}
                  rank={i}
                  onPlay={() => handlePlay(sheet.id)}
                />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
