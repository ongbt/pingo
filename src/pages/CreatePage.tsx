import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { usePingoAuth } from '@/hooks/use-pingo-auth';
import { Sheet } from '@/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Rocket,
  Shield,
  Lock,
  Star,
  Flame,
  Plus,
  Search,
  ChevronRight,
  X,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorDialog from '@/components/ErrorDialog';
import SheetPreviewModal from '@/components/SheetPreviewModal';
import { Id } from '../../convex/_generated/dataModel';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MY_SHEETS_KEY = 'pingo_my_sheet_ids';
function getLocalSheetIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MY_SHEETS_KEY) || '[]');
  } catch {
    return [];
  }
}

const SHEET_EMOJIS = [
  '📋',
  '✨',
  '🎯',
  '🎉',
  '⚡',
  '💡',
  '🏆',
  '🎲',
  '🎵',
  '🌍',
];
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
function ModalSheetRow({
  sheet,
  selected,
  onSelect,
}: {
  sheet: Sheet;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
        selected
          ? 'bg-primary/8 dark:bg-primary/10'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
      )}
    >
      <span className="w-8 shrink-0 text-center text-xl">
        {emojiFor(sheet.title)}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-black',
            selected ? 'text-primary' : 'text-slate-900 dark:text-white'
          )}
        >
          {sheet.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400">
            {sheet.items.length} items
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500">
            <Flame size={8} />
            {formatPlays(sheet.play_count)}{' '}
            {sheet.play_count === 1 ? 'play' : 'plays'}
          </span>
        </div>
      </div>
      {selected ? (
        <CheckCircle2 size={18} className="shrink-0 text-primary" />
      ) : (
        <ChevronRight
          size={16}
          className="shrink-0 text-slate-300 dark:text-slate-600"
        />
      )}
    </button>
  );
}

// ─── Sheet Picker Modal ────────────────────────────────────────────────────────
function SheetPickerModal({
  open,
  sheets,
  mySheetIds,
  selectedId,
  onSelect,
  onClose,
  onGoToSheets,
}: {
  open: boolean;
  sheets: Sheet[];
  mySheetIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onGoToSheets: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [previewSheet, setPreviewSheet] = useState<Sheet | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? sheets.filter((s) => s.title.toLowerCase().includes(q)) : sheets;
  }, [sheets, query]);

  const mySheets = filtered.filter((s) => mySheetIds.includes(s.id));
  const allSheets = filtered.filter((s) => !mySheetIds.includes(s.id));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Choose a Sheet
              </h3>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="shrink-0 px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 dark:bg-slate-800">
                <Search size={15} className="shrink-0 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sheets…"
                  className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-slate-400 transition-colors hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
              {mySheets.length > 0 && (
                <>
                  <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    My Sheets
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mySheets.map((s) => (
                      <ModalSheetRow
                        key={s.id}
                        sheet={s}
                        selected={selectedId === s.id}
                        onSelect={() => setPreviewSheet(s)}
                      />
                    ))}
                  </div>
                </>
              )}

              {allSheets.length > 0 && (
                <>
                  <p
                    className={cn(
                      'px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400',
                      mySheets.length > 0 && 'mt-2'
                    )}
                  >
                    {query ? 'Results' : 'All Sheets'}
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allSheets.map((s) => (
                      <ModalSheetRow
                        key={s.id}
                        sheet={s}
                        selected={selectedId === s.id}
                        onSelect={() => setPreviewSheet(s)}
                      />
                    ))}
                  </div>
                </>
              )}

              {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                  <Search size={32} className="opacity-30" />
                  <p className="text-sm font-bold">
                    No sheets match &quot;{query}&quot;
                  </p>
                </div>
              )}

              <div className="mt-4 px-4">
                <button
                  onClick={onGoToSheets}
                  className="group flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 dark:border-slate-700"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Plus size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700 transition-colors group-hover:text-primary dark:text-slate-300">
                      Create a Custom Sheet
                    </p>
                    <p className="text-[10px] font-medium text-slate-400">
                      Build your own bingo sheet
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Internal preview modal stacked on top */}
      <SheetPreviewModal
        sheet={previewSheet}
        open={!!previewSheet}
        onClose={() => setPreviewSheet(null)}
        onDuplicate={() => navigate(`/sheets?duplicate=${previewSheet?.id}`)}
        onSelect={() => {
          if (previewSheet) onSelect(previewSheet.id);
          setPreviewSheet(null);
          onClose(); // also close the parent picker
        }}
        selectLabel="Select Sheet"
        isSelectActive={selectedId === previewSheet?.id}
      />
    </AnimatePresence>
  );
}

// ─── Settings Row ──────────────────────────────
function SettingRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
  locked = true,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle?: () => void;
  locked?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3.5 transition-colors',
        locked
          ? 'opacity-60'
          : 'cursor-pointer focus-within:bg-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      )}
      onClick={() => {
        if (!locked && onToggle) onToggle();
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            enabled
              ? 'bg-primary/10 text-primary'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
          )}
        >
          {icon}
        </div>
        <div className="pr-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{title}</p>
            {badge && (
              <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] font-medium leading-tight text-slate-400">
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={locked}
        aria-checked={enabled}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50',
          locked ? 'cursor-not-allowed' : 'cursor-pointer',
          enabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200',
            enabled ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = usePingoAuth();

  const defaultSheetsResult = useQuery(api.sheets.getDefaults);
  const userSheetsResult = useQuery(api.sheets.getForUser);
  const createGame = useMutation(api.games.create);
  const joinGame = useMutation(api.players.join);

  const [selectedSheetId, setSelectedSheetId] = useState<Id<'sheet'> | null>(
    null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [settings] = useState({
    firstBingoWins: true,
    antiCheat: false,
    privateLobby: true,
    minTwoPlayers: true,
  });
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const showError = (title: string, message: string) =>
    setDialog({ title, message });

  const sheets = useMemo(() => {
    const all = [...(defaultSheetsResult || []), ...(userSheetsResult || [])];
    return all.map(
      (s) =>
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
  }, [defaultSheetsResult, userSheetsResult]);

  useEffect(() => {
    if (!selectedSheetId && sheets.length > 0) {
      const paramId = searchParams.get('sheetId');
      if (paramId && sheets.find((s) => s.id === paramId)) {
        setSelectedSheetId(paramId as Id<'sheet'>);
      } else {
        setSelectedSheetId(sheets[0].id as Id<'sheet'>);
      }
    }
  }, [sheets, selectedSheetId, searchParams]);

  const loading = defaultSheetsResult === undefined;
  const mySheetIds = useMemo(() => getLocalSheetIds(), []);

  useEffect(() => {
    if (profile?.nickname) {
      setNickname(profile.nickname);
      localStorage.setItem('pingo_nickname', profile.nickname);
    } else {
      const saved = localStorage.getItem('pingo_nickname');
      if (saved) setNickname(saved);
    }
  }, [profile]);

  const handleCreate = async () => {
    if (isCreating) return;

    if (!profile) {
      showError(
        'Authentication Required',
        'You must be signed in to host a game.'
      );
      return;
    }

    if (!nickname.trim()) {
      showError('Nickname Required', 'Please enter a nickname.');
      return;
    }
    if (!selectedSheetId) {
      showError('No Sheet Selected', 'Please select a bingo sheet.');
      return;
    }

    setIsCreating(true);
    try {
      const { gameId } = await createGame({
        sheetId: selectedSheetId,
        config: settings,
      });

      const playerId = await joinGame({
        gameId,
        nickname: nickname.trim(),
        isHost: true,
      });

      localStorage.setItem('pingo_nickname', nickname.trim());
      localStorage.setItem(`pingo_player_${gameId}`, playerId);

      // In Convex, user profile is typically updated via mutation if needed.
      // For now, let's assume the user name can be updated separately or it's handled.
      // We don't have a specific profile upsert mutation yet, but we can add it if needed.

      navigate(`/lobby/${gameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      showError('Game Creation Failed', errMsg || 'Something went wrong');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedSheet = sheets.find((s) => s.id === selectedSheetId) ?? null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-36 font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
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
        onSelect={(id) => setSelectedSheetId(id as Id<'sheet'>)}
        onClose={() => setPickerOpen(false)}
        onGoToSheets={() => {
          setPickerOpen(false);
          navigate('/sheets');
        }}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/90">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-black uppercase tracking-tight">
            Create New Game
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 pt-6">
        {/* ── Sheet Picker ── */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 px-0.5 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            <Flame size={14} className="text-orange-500" />
            Bingo Sheet
          </h2>

          <button
            onClick={() => setPickerOpen(true)}
            disabled={loading}
            className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99] disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900"
          >
            {loading ? (
              <div className="flex items-center gap-4 p-4">
                <div className="size-14 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ) : selectedSheet ? (
              <div className="flex items-center gap-4 p-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-orange-400/10 text-2xl">
                  {emojiFor(selectedSheet.title)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-black text-slate-900 dark:text-white">
                    {selectedSheet.title}
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400">
                      {selectedSheet.items.length} items
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-orange-500">
                      <Flame size={10} />
                      {formatPlays(selectedSheet.play_count)}{' '}
                      {selectedSheet.play_count === 1 ? 'play' : 'plays'}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-primary">
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    Change
                  </span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Plus size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                    Choose a Sheet
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                    Tap to browse all sheets
                  </p>
                </div>
                <ChevronRight size={16} className="ml-auto text-slate-400" />
              </div>
            )}
          </button>
        </section>

        {/* ── Nickname ── */}
        <section>
          <label
            htmlFor="host-nickname"
            className="mb-3 block px-0.5 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Your Nickname
          </label>
          <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <input
              id="host-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-0 dark:bg-background-dark dark:text-slate-100"
              placeholder="e.g. BingoHost"
              type="text"
            />
          </div>
        </section>

        {/* ── Lobby Settings ── */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 px-0.5 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            Lobby Settings
          </h2>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            <SettingRow
              icon={<Star size={16} />}
              title="First Bingo Wins"
              description="Game ends when the first player scores."
              enabled={settings.firstBingoWins}
              locked={true}
              badge="Coming Soon"
            />
            <SettingRow
              icon={<Shield size={16} />}
              title="Anti-Cheat Mode"
              description="Forces all players to share the same random 24 items."
              enabled={settings.antiCheat}
              locked={true}
              badge="Coming Soon"
            />
            <SettingRow
              icon={<Lock size={16} />}
              title="Private Lobby"
              description="Join requires the unique room code."
              enabled={settings.privateLobby}
              locked={true}
              badge="Coming Soon"
            />
            <SettingRow
              icon={<Users size={16} />}
              title="Minimum 2 Players"
              description="Requires at least 2 players to start."
              enabled={settings.minTwoPlayers}
              locked={true}
              badge="Coming Soon"
            />
          </div>
        </section>
      </main>

      {/* ── Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/90">
        <div className="mx-auto max-w-lg">
          {!profile && (
            <div className="mb-3 text-center">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                You must be{' '}
                <button
                  onClick={() => navigate('/signin')}
                  className="text-primary hover:underline"
                >
                  signed in
                </button>{' '}
                to host a game.
              </p>
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={isCreating || !selectedSheetId || !profile}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
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
