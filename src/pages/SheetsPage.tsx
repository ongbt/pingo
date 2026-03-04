import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Doc, Id } from '../../convex/_generated/dataModel';
import { Sheet } from '@/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  ChevronRight,
  Trash2,
  Settings,
  CheckCircle2,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorDialog from '@/components/ErrorDialog';
import SheetPreviewModal from '@/components/SheetPreviewModal';

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
  if (!ids.includes(id))
    localStorage.setItem(MY_SHEETS_KEY, JSON.stringify([...ids, id]));
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
function CreateSheetForm({
  onSaved,
  initialTitle = '',
  initialItems = '',
}: {
  onSaved: (sheet: Sheet) => void;
  initialTitle?: string;
  initialItems?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    details?: string[];
  } | null>(null);

  const createSheetMutation = useMutation(api.sheets.create);
  const itemCount = items
    .split('\n')
    .map((i) => i.trim())
    .filter(Boolean).length;

  const handleSave = async () => {
    if (saving) return;

    if (!title.trim()) {
      setDialog({
        title: 'Sheet Name Required',
        message: 'Please give your sheet a name before saving.',
      });
      return;
    }

    const itemsArray = items
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);

    const dupes = detectDuplicates(itemsArray);
    if (dupes.length > 0) {
      setDialog({
        title: 'Duplicate Items Found',
        message:
          'Every item must be unique. Remove or rename the duplicates below:',
        details: dupes,
      });
      return;
    }

    if (itemsArray.length < 25) {
      setDialog({
        title: 'Not Enough Items',
        message: `You have ${itemsArray.length} item${itemsArray.length === 1 ? '' : 's'}. Add at least ${25 - itemsArray.length} more to reach the minimum of 25.`,
      });
      return;
    }

    setSaving(true);
    try {
      const _newId = await createSheetMutation({
        title: title.trim(),
        items: itemsArray,
      });

      // Fetch new data via query if needed, but onSaved local update is usually enough
      onSaved({
        id: _newId,
        title: title.trim(),
        items: itemsArray,
        is_default: false,
        creator_id: null, // will be updated on next refresh from server
        play_count: 0,
        created_at: new Date().toISOString(),
      } as Sheet);
      addLocalSheetId(_newId);
      setTitle('');
      setItems('');
    } catch {
      setDialog({
        title: 'Save Failed',
        message: 'Could not save the sheet. Please try again.',
      });
    } finally {
      setSaving(false);
    }
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
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="space-y-4 p-4">
          {/* Sheet Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Settings size={10} />
              Sheet Name
              <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-0 dark:bg-background-dark dark:text-slate-100"
              placeholder="e.g. Office Party Bingo"
              type="text"
            />
          </div>

          {/* Items */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Phrases / Words
              </label>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest transition-colors',
                  itemCount >= 25
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {itemCount} / 25 min
              </span>
            </div>
            <textarea
              value={items}
              onChange={(e) => setItems(e.target.value)}
              className="w-full resize-none rounded-l border-2 border-transparent bg-slate-50 px-4 py-3 text-sm font-medium leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-0 dark:bg-background-dark dark:text-slate-100"
              placeholder={"Can you hear me?\nLet's circle back\nBio break"}
              rows={6}
            />
            <p className="text-[10px] font-medium italic text-slate-400">
              One item per line · Min 25 · No duplicates
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              'Saving…'
            ) : (
              <>
                <CheckCircle2 size={15} /> Save Sheet
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── My Sheet Card ──────────────────────────────────────────────────────────
function MySheetCard({
  sheet,
  onDelete,
  onPlay,
  onPreview,
}: {
  sheet: Sheet;
  onDelete?: () => void;
  onPlay: () => void;
  onPreview: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onPreview}
      className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-colors hover:border-primary/30 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-lg">📋</span>
        </div>
        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-slate-900 dark:text-white">
            {sheet.title}
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {sheet.items.length} items
          </p>
        </div>
        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-400 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="flex h-8 items-center gap-1 rounded-lg bg-primary px-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
          >
            Use <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Top Sheet Row ──────────────────────────────────────────────────────────
function TopSheetRow({
  sheet,
  rank,
  onPlay,
  onPreview,
}: {
  sheet: Sheet;
  rank: number;
  onPlay: () => void;
  onPreview: () => void;
}) {
  const rankColors = ['text-yellow-500', 'text-slate-400', 'text-orange-500'];
  const rankBg = [
    'bg-yellow-50 dark:bg-yellow-900/20',
    'bg-slate-50 dark:bg-slate-800',
    'bg-orange-50 dark:bg-orange-900/20',
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onPreview}
      className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-colors hover:border-primary/30 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Rank badge */}
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-black',
            rank < 3 ? rankBg[rank] : 'bg-slate-50 dark:bg-slate-800',
            rank < 3 ? rankColors[rank] : 'text-slate-400'
          )}
        >
          {rank < 3 ? ['🥇', '🥈', '🥉'][rank] : `#${rank + 1}`}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-slate-900 dark:text-white">
            {sheet.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
        >
          Use <ChevronRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function SheetsPage() {
  const navigate = useNavigate();
  const topSheetsResult = useQuery(api.sheets.getPopular, { limit: 5 });
  const mySheetsResult = useQuery(api.sheets.getForUser);
  const convex = useConvex();

  const topSheets = useMemo(() => {
    return (topSheetsResult || []).map(
      (s: Doc<'sheet'>) =>
        ({
          id: s._id,
          title: s.title,
          items: s.items,
          is_default: s.isDefault,
          creator_id: s.creatorId ?? null,
          play_count: s.playCount,
          created_at: new Date(s._creationTime).toISOString(),
        }) as Sheet
    );
  }, [topSheetsResult]);

  const mySheetsFromDB = useMemo(() => {
    return (mySheetsResult || []).map(
      (s: Doc<'sheet'>) =>
        ({
          id: s._id,
          title: s.title,
          items: s.items,
          is_default: s.isDefault,
          creator_id: s.creatorId ?? null,
          play_count: s.playCount,
          created_at: new Date(s._creationTime).toISOString(),
        }) as Sheet
    );
  }, [mySheetsResult]);

  const [mySheets, setMySheets] = useState<Sheet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [previewSheet, setPreviewSheet] = useState<Sheet | null>(null);

  // State to hold starting values when duplicating a sheet
  const [initialFormState, setInitialFormState] = useState<{
    title: string;
    items: string;
  } | null>(null);

  // Still support local IDs for guest mode or specific sheets
  useEffect(() => {
    // Merge: DB-backed ones (which includes ones we created while signed in)
    // and local-only sheets (deduplicated)
    const localIds = new Set(getLocalSheetIds());
    const dbIds = new Set(mySheetsFromDB.map((s: Sheet) => s.id));

    const merged = [...mySheetsFromDB];

    // Add local sheets that are not already in the DB-fetched list
    const fetchMissingLocalSheets = async () => {
      const missingLocalIds = Array.from(localIds).filter(
        (id) => !dbIds.has(id)
      );
      if (missingLocalIds.length > 0) {
        // This would require a Convex query to fetch multiple sheets by ID
        // For now, we'll just rely on `mySheetsFromDB` and assume local sheets
        // are either owned by the user (and thus in `mySheetsFromDB`) or
        // are temporary and not persisted across sessions without auth.
        // A more robust solution would involve a Convex query like `api.sheets.getByIds`
        // and then mapping those results.
        // For simplicity, we'll just use mySheetsFromDB for now.
      }
      setMySheets(merged);
    };

    fetchMissingLocalSheets();
  }, [mySheetsFromDB]);

  const loading = topSheetsResult === undefined || mySheetsResult === undefined;

  useEffect(() => {
    const loadDuplicateSheet = async () => {
      if (loading) return;

      const urlParams = new URLSearchParams(window.location.search);
      const duplicateId = urlParams.get('duplicate');

      if (duplicateId) {
        let sheetToDuplicate: Sheet | undefined = undefined;

        // Check if it's in top sheets or my sheets already
        sheetToDuplicate =
          topSheets.find((s: Sheet) => s.id === duplicateId) ||
          mySheets.find((s: Sheet) => s.id === duplicateId);

        if (!sheetToDuplicate) {
          // If not found, fetch it specifically from Convex
          const fetchedSheet = await convex.query(api.sheets.getById, {
            id: duplicateId as Id<'sheet'>,
          });
          if (fetchedSheet) {
            sheetToDuplicate = {
              id: fetchedSheet._id,
              title: fetchedSheet.title,
              items: fetchedSheet.items,
              is_default: fetchedSheet.isDefault,
              creator_id: fetchedSheet.creatorId ?? null,
              play_count: fetchedSheet.playCount,
              created_at: new Date(fetchedSheet._creationTime).toISOString(),
            } as Sheet;
          }
        }

        if (sheetToDuplicate) {
          setInitialFormState({
            title: `${sheetToDuplicate.title} (Copy)`,
            items: sheetToDuplicate.items.join('\n'),
          });
          setShowForm(true);
          // clear the query param gracefully
          window.history.replaceState({}, '', '/sheets');
        }
      }
    };
    loadDuplicateSheet();
  }, [loading, topSheets, mySheets, convex]);

  const handleSheetSaved = (sheet: Sheet) => {
    setMySheets((prev) => [sheet, ...prev]);
    setShowForm(false);
    setInitialFormState(null);
  };

  const handlePlay = (sheetId: string) =>
    navigate(`/create?sheetId=${sheetId}`);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-28 font-display antialiased dark:bg-background-dark">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 px-4 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/90">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-black uppercase tracking-tight">
            Sheets
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-8 px-4 pt-5">
        {/* ── My Sheets ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
              My Sheets
            </h2>
            <button
              onClick={() => {
                if (showForm) setInitialFormState(null);
                setShowForm((v) => !v);
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all',
                showForm
                  ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  : 'bg-primary text-white shadow-md shadow-primary/25'
              )}
            >
              <Plus
                size={13}
                className={cn(
                  'transition-transform duration-200',
                  showForm && 'rotate-45'
                )}
              />
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
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <CreateSheetForm
                  key={initialFormState?.title || 'new'}
                  onSaved={handleSheetSaved}
                  initialTitle={initialFormState?.title}
                  initialItems={initialFormState?.items}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : mySheets.length === 0 && !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="group flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                <Plus size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  Create your first sheet
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  Build a custom bingo sheet and reuse it anytime
                </p>
              </div>
            </button>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2.5">
                {mySheets.map((sheet: Sheet) => (
                  <MySheetCard
                    key={sheet.id}
                    sheet={sheet}
                    onPlay={() => handlePlay(sheet.id)}
                    onPreview={() => setPreviewSheet(sheet)}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </section>

        {/* ── Top Sheets ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Flame size={13} className="text-orange-500" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
              Top Sheets
            </h2>
            <TrendingUp size={13} className="ml-auto text-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Most played
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-2.5">
              {topSheets.map((sheet: Sheet, i: number) => (
                <TopSheetRow
                  key={sheet.id}
                  sheet={sheet}
                  rank={i}
                  onPlay={() => handlePlay(sheet.id)}
                  onPreview={() => setPreviewSheet(sheet)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Sheet Preview Modal */}
      <SheetPreviewModal
        sheet={previewSheet}
        open={!!previewSheet}
        onClose={() => setPreviewSheet(null)}
        onSelect={() => {
          if (previewSheet) handlePlay(previewSheet.id);
          setPreviewSheet(null);
        }}
        onDuplicate={() => {
          if (previewSheet) {
            setInitialFormState({
              title: `${previewSheet.title} (Copy)`,
              items: previewSheet.items.join('\n'),
            });
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          setPreviewSheet(null);
        }}
        selectLabel="Use Sheet"
      />
    </div>
  );
}
