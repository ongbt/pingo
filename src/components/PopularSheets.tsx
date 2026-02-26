import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Sheet } from '@/types';
import { Flame, ArrowRight, ChevronRight } from 'lucide-react';

const GRADIENTS = [
  'from-orange-400 to-pink-500',
  'from-violet-500 to-indigo-600',
  'from-emerald-400 to-teal-500',
];

function formatPlayCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export default function PopularSheets() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('sheet')
      .select('id, title, play_count, items')
      .order('play_count', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setSheets((data as Sheet[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (sheets.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3">
      {sheets.map((sheet, i) => (
        <button
          key={sheet.id}
          onClick={() => navigate(`/create?sheetId=${sheet.id}`)}
          className="group flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md hover:border-primary/30 transition-all text-left active:scale-[0.99]"
        >
          <div className={`size-12 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center shrink-0 shadow-md`}>
            <span className="text-xl">{['📋', '✨', '🎯'][i]}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-black text-[14px] text-slate-900 dark:text-white truncate">{sheet.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {sheet.items.length} items
              </span>
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500">
                <Flame size={9} />
                {formatPlayCount(sheet.play_count)} {sheet.play_count === 1 ? 'play' : 'plays'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[14px]">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
            </span>
            <div className="bg-primary/10 text-primary rounded-full px-2 py-0.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-black uppercase tracking-widest">Play</span>
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
      className="text-primary font-bold text-sm flex items-center gap-1 hover:opacity-70 transition-opacity"
    >
      See All
      <ArrowRight size={14} />
    </button>
  );
}
