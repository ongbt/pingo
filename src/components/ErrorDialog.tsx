import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorDialogProps {
  open: boolean;
  title: string;
  message: string;
  details?: string[];
  onClose: () => void;
}

export default function ErrorDialog({
  open,
  title,
  message,
  details,
  onClose,
}: ErrorDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="dialog"
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            className="fixed inset-x-0 bottom-0 z-[101] mx-auto max-w-md p-4 pb-8"
          >
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between p-5 pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle size={20} className="text-red-500" />
                  </div>
                  <h3 className="text-base font-black leading-tight text-slate-900 dark:text-white">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 p-5">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {message}
                </p>

                {details && details.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
                    <ul className="space-y-1">
                      {details.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-300"
                        >
                          <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={onClose}
                  className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-black uppercase tracking-widest text-white transition-transform active:scale-[0.98] dark:bg-white dark:text-slate-900"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
