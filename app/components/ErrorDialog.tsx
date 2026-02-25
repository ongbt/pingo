'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorDialogProps {
  open: boolean;
  title: string;
  /** Main message. Can contain an array of bullet strings for lists. */
  message: string;
  /** Optional list of detail items (e.g. duplicate entries). */
  details?: string[];
  onClose: () => void;
}

export default function ErrorDialog({ open, title, message, details, onClose }: ErrorDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            className="fixed z-[101] bottom-0 inset-x-0 max-w-md mx-auto p-4 pb-8"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between p-5 pb-0">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-red-500" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>

                {details && details.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {details.map((item, i) => (
                        <li key={i} className="text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-red-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-5">
                <button
                  onClick={onClose}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-3.5 rounded-2xl text-sm uppercase tracking-widest active:scale-[0.98] transition-transform"
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
