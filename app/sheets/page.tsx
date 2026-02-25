'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sheet } from '@/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Plus, ChevronRight, Trash2, Settings, CheckCircle2, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorDialog from '@/app/components/ErrorDialog';

const MY_SHEETS_KEY = 'pingo_my_sheet_ids';

function getLocalSheetIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MY_SHEETS_KEY) || '[]');
  } catch {
    return [];
  }
}

function addLocalSheetId(id: string) {
  const ids = getLocalSheetIds();
  if (!ids.includes(id)) localStorage.setItem(MY_SHEETS_KEY, JSON.stringify([...ids, id]));
}

function removeLocalSheetId(id: string) {
  const ids = getLocalSheetIds().filter(i => i !== id);
  localStorage.setItem(MY_SHEETS_KEY, JSON.stringify(ids));
}

// ─── Validation helpers ────────────────────────────────────────────────────
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

  const itemCount = items
    .split('\n')
    .map(i => i.trim())
    .filter(Boolean).length;

  const handleSave = async () => {
    if (saving) return;

    // Name required
    if (!title.trim()) {
      setDialog({ title: 'Sheet Name Required', message: 'Please give your sheet a name before saving.' });
      return;
    }

    const itemsArray = items
      .split('\n')
      .map(i => i.trim())
      .filter(Boolean);

    // Duplicate check
    const dupes = detectDuplicates(itemsArray);
    if (dupes.length > 0) {
      setDialog({
        title: 'Duplicate Items Found',
        message: 'Every item must be unique. Remove or rename the duplicates below:',
        details: dupes,
      });
      return;
    }

    // Minimum count
    if (itemsArray.length < 25) {
      setDialog({
        title: 'Not Enough Items',
        message: `You have ${itemsArray.length} item${itemsArray.length === 1 ? '' : 's'}. Add at least ${25 - itemsArray.length} more to reach the minimum of 25.`,
      });
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
      >
        <div className="p-5 space-y-5">
          {/* Sheet Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1">
              <Settings size={11} />
              Sheet Name
              <span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={cn(
                'w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-background-dark border-2 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold',
                title.trim() === '' && saving
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-transparent focus:border-primary focus:ring-0'
              )}
              placeholder="e.g. Office Party Bingo"
              type="text"
            />
          </div>

          {/* Items textarea */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
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
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none font-medium text-sm leading-relaxed border-2"
              placeholder={'Can you hear me?\nLet\'s circle back\nBio break'}
              rows={7}
            />
            <p className="text-[10px] text-slate-400 px-1 italic font-medium">
              One item per line. Minimum 25. Duplicates are not allowed.
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 uppercase tracking-widest text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : (
              <>
                <CheckCircle2 size={18} />
                Save Sheet
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Sheet Card ────────────────────────────────────────────────────────────
function SheetCard({ sheet, onDelete, onPlay }: { sheet: Sheet; onDelete?: () => void; onPlay: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="p-4 flex items-center gap-4">
        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileText size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-slate-900 dark:text-white truncate">{sheet.title}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {sheet.items.length} items
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onDelete && (
            <button
              onClick={onDelete}
              className="size-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onPlay}
            className="h-9 px-4 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-1 shadow-sm shadow-primary/20 active:scale-95 transition-transform"
          >
            Use
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function SheetsPage() {
  const router = useRouter();
  const [defaultSheets, setDefaultSheets] = useState<Sheet[]>([]);
  const [mySheets, setMySheets] = useState<Sheet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Load default sheets
      const { data: defaults } = await supabase
        .from('sheet')
        .select('*')
        .eq('is_default', true)
        .order('created_at', { ascending: true });

      setDefaultSheets((defaults as Sheet[]) ?? []);

      // Load My Sheets from localStorage IDs
      const ids = getLocalSheetIds();
      if (ids.length > 0) {
        const { data: mine } = await supabase
          .from('sheet')
          .select('*')
          .in('id', ids)
          .order('created_at', { ascending: false });

        setMySheets((mine as Sheet[]) ?? []);
      }

      // Also attempt auth-based sheets for logged-in users
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: authSheets } = await supabase
          .from('sheet')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (authSheets && authSheets.length > 0) {
          setMySheets(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const newOnes = authSheets.filter(s => !existingIds.has(s.id));
            return [...newOnes, ...prev] as Sheet[];
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

  const handleDelete = async (sheet: Sheet) => {
    removeLocalSheetId(sheet.id);
    setMySheets(prev => prev.filter(s => s.id !== sheet.id));
    // We don't hard-delete from Supabase — just hide from UI
  };

  const handlePlay = (sheetId: string) => {
    router.push(`/create?sheetId=${sheetId}`);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32 font-display antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-black tracking-tight uppercase">My Sheets</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-10">

        {/* ── My Sheets ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-black uppercase tracking-tight">My Sheets</h2>
            <button
              onClick={() => setShowForm(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all',
                showForm
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  : 'bg-primary text-white shadow-md shadow-primary/25'
              )}
            >
              <Plus size={14} className={cn('transition-transform', showForm && 'rotate-45')} />
              {showForm ? 'Cancel' : 'New Sheet'}
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                key="form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <CreateSheetForm onSaved={handleSheetSaved} />
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : mySheets.length === 0 && !showForm ? (
            <div className="text-center py-10 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Plus size={28} className="text-primary" />
              </div>
              <p className="font-black text-slate-900 dark:text-white mb-1">No sheets yet</p>
              <p className="text-sm text-slate-400">Create your first custom bingo sheet above.</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {mySheets.map(sheet => (
                  <SheetCard
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

        {/* ── Default Sheets ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-black uppercase tracking-tight px-1">Default Sheets</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {defaultSheets.map(sheet => (
                <SheetCard
                  key={sheet.id}
                  sheet={sheet}
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
