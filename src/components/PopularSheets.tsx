import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Doc } from '../../convex/_generated/dataModel';
import { Sheet } from '@/types';
import { Flame, ArrowRight, ChevronRight } from 'lucide-react';

const GRADIENTS = [
  'from-orange-400 to-pink-500',
  'from-cyan-500 to-blue-600',
  'from-emerald-400 to-teal-500',
];

function formatPlayCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export default function PopularSheets() {
  const navigate = useNavigate();
  const popularSheets = useQuery(api.sheets.getPopular, { limit: 3 });
  const sheets =
    popularSheets?.map(
      (s: Doc<'sheet'>) =>
        ({
          id: s._id,
          title: s.title,
          items: s.items,
          play_count: s.playCount,
          is_default: s.isDefault,
          creator_id: s.creatorId ?? null,
          created_at: new Date(s._creationTime).toISOString(),
        }) as Sheet
    ) ?? [];

  const loading = popularSheets === undefined;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  if (sheets.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3">
      {sheets.map((sheet: Sheet, i: number) => (
        <button
          key={sheet.id}
          onClick={() => navigate(`/create?sheetId=${sheet.id}`)}
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
        >
          <div
            className={`size-12 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex shrink-0 items-center justify-center shadow-md`}
          >
            <span className="text-xl">{['📋', '✨', '🎯'][i]}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-black text-slate-900 dark:text-white">
              {sheet.title}
            </p>
            <div className="mt-0.5 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {sheet.items.length} items
              </span>
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500">
                <Flame size={9} />
                {formatPlayCount(sheet.play_count)}{' '}
                {sheet.play_count === 1 ? 'play' : 'plays'}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-[14px]">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
            </span>
            <div className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-primary opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-[9px] font-black uppercase tracking-widest">
                Play
              </span>
              <ChevronRight size={9} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function SeeAllLink() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/sheets')}
      className="flex items-center gap-1 text-sm font-bold text-primary transition-opacity hover:opacity-70"
    >
      See All
      <ArrowRight size={14} />
    </button>
  );
}
