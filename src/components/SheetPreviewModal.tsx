import { Sheet } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Copy } from 'lucide-react';

interface SheetPreviewModalProps {
  sheet: Sheet | null;
  open: boolean;
  onClose: () => void;
  onSelect?: () => void;
  onDuplicate?: () => void;
  selectLabel?: string;
  isSelectActive?: boolean;
}

export default function SheetPreviewModal({
  sheet,
  open,
  onClose,
  onSelect,
  onDuplicate,
  selectLabel = 'Select Sheet',
  isSelectActive = false,
}: SheetPreviewModalProps) {
  if (!sheet) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              className="pointer-events-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="truncate text-lg font-black text-slate-900 dark:text-white">
                    {sheet.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {sheet.items.length} items
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Items Grid */}
              <div className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50/50 px-5 py-4 dark:bg-slate-900/50">
                {sheet.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <span className="mt-0.5 w-5 text-right text-[10px] font-black uppercase tabular-nums text-slate-300 dark:text-slate-600">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-bold leading-tight text-slate-700 dark:text-slate-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex shrink-0 flex-col gap-2.5 border-t border-slate-100 bg-white p-4 sm:flex-row sm:gap-3 dark:border-slate-800 dark:bg-slate-900">
                {onDuplicate && (
                  <button
                    onClick={onDuplicate}
                    className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-600 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary sm:w-auto dark:border-slate-700 dark:text-slate-300"
                    title="Copy as new Custom Sheet"
                  >
                    <Copy size={16} />
                    <span>Duplicate this sheet</span>
                  </button>
                )}
                {onSelect && (
                  <button
                    onClick={onSelect}
                    className={cn(
                      'flex w-full flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black uppercase tracking-widest shadow-sm transition-all',
                      isSelectActive
                        ? 'cursor-default bg-slate-200 font-bold text-slate-500 dark:bg-slate-800'
                        : 'bg-primary text-white shadow-primary/25 hover:scale-[0.98] hover:bg-primary/90'
                    )}
                  >
                    {isSelectActive ? (
                      <>
                        <Check size={18} />
                        Selected
                      </>
                    ) : (
                      selectLabel
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
