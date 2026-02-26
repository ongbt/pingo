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

          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-h-[85vh] w-full max-w-md flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-black text-lg text-slate-900 dark:text-white truncate">
                  {sheet.title}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {sheet.items.length} items
                </p>
              </div>
              <button
                onClick={onClose}
                className="size-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Items Grid */}
            <div className="overflow-y-auto px-5 py-4 space-y-2.5 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
              {sheet.items.map((item, i) => (
                <div 
                  key={i} 
                  className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start gap-3"
                >
                  <span className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-600 mt-0.5 w-5 tabular-nums text-right">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row gap-2.5 sm:gap-3 bg-white dark:bg-slate-900">
              {onDuplicate && (
                <button
                  onClick={onDuplicate}
                  className="w-full sm:w-auto px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 text-sm hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 shrink-0"
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
                    "w-full flex-1 font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-widest text-sm",
                    isSelectActive
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold cursor-default"
                      : "bg-primary text-white hover:bg-primary/90 hover:scale-[0.98] shadow-primary/25"
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
